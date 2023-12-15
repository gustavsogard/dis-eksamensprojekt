require("dotenv").config();

const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const { encryptNum } = require("../lib/crypt");
const sendSMS = require("../lib/sms");

const emitToLocation = require("../lib/sockets/emitter");
const { socketLocationMapping } = require("../lib/sockets/connection");

const { db } = require("../lib/database/init");

const apiRoutes = (io) => {
    router.route("/orders")
        .get((req, res) => {
            const token = req.cookies.JWT;
            const store_name = jwt.verify(
                token,
                process.env.secret_key,
                (err, decoded) => {
                    if (err) {
                        return res.status(403).json({ message: "Invalid token" });
                    } else {
                        return decoded.locationName;
                    }
                }
            );

            db.all(
                "SELECT * " +
                "FROM orders " +
                "JOIN order_products ON orders.id = order_products.order_id " +
                "JOIN products ON order_products.product_id = products.id " +
                "WHERE orders.store_name = ?",
                [store_name],
                (err, rows) => {
                    if (err) {
                        return console.error(err.message);
                    }
            
                    // Organize the data into a more structured format
                    const ordersWithProducts = rows.reduce((acc, row) => {
                        // Check if the order already exists in the accumulator
                        const existingOrder = acc.find((o) => o.order_id === row.order_id);
            
                        if (existingOrder) {
                            // Add the product information to the existing order
                            existingOrder.products.push({
                                product_id: row.product_id,
                                product_name: row.product_name,
                                quantity: row.quantity,
                            });
                        } else {
                            // Create a new order entry in the accumulator
                            acc.push({
                                order_id: row.order_id,
                                status: row.status,
                                customer_name: row.customer_name,
                                customer_phone: row.customer_phone,
                                store_name: row.store_name,
                                external_api_key: row.external_api_key,
                                products: [{
                                    product_id: row.product_id,
                                    product_name: row.product_name,
                                    quantity: row.quantity,
                                }],
                                // Include other order fields as needed
                            });
                        }

                        return acc;
                    }, []);
                    res.json(ordersWithProducts);
                }
            );
        })

        .post(async (req, res) => {
            try {
                const jwtToken = req.cookies.JWT;
                const bearerToken = req.headers["authorization"]?.split(" ")[1];
                let store_name = undefined;

                if (!jwtToken && !bearerToken) {
                    return res.status(401).json({ message: "No jwt or bearer token" });
                }

                if (jwtToken) {
                    const decoded = await new Promise((resolve, reject) => {
                        jwt.verify(jwtToken, process.env.secret_key, (err, decoded) => {
                            if (err) reject("Invalid token");
                            resolve(decoded);
                        });
                    });
                    store_name = decoded.locationName;
                }

                if (bearerToken) {
                    const row = await new Promise((resolve, reject) => {
                        db.get(
                            `SELECT * FROM api_keys WHERE api_key = ?`,
                            [bearerToken],
                            (err, row) => {
                                if (err) reject("Server error");
                                if (!row) reject("Invalid token");
                                resolve(row);
                            }
                        );
                    });
                }

                const order = req.body;
                const orderId = uuidv4();
                order.order_id = orderId;
                order.status = "created";
                
                db.run("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)", [
                    orderId,
                    order.status,
                    order.customer_name,
                    encryptNum(order.customer_phone),
                    store_name ?? order.store_name,
                    bearerToken ?? "none",
                ]);

                const productPromises = order.products.map((product) => {
                    return new Promise((resolve, reject) => {
                        db.run("INSERT INTO order_products VALUES (?, ?, ?)", [
                            orderId,
                            product.product_id,
                            product.quantity,
                        ], function (err) {
                            if (err) {
                                reject(err);
                            } else {
                                db.get("SELECT * FROM products WHERE id = ?", [product.product_id], (err, row) => {
                                    if (err) {
                                        reject(err);
                                    }
                                    if (row == undefined || !row) {
                                        reject("Product not available");
                                    } else {
                                        product.product_name = row.product_name;
                                        resolve();
                                    }
                                });
                            }
                        });
                    });
                });

                Promise.all(productPromises)
                    .then(() => {
                        sendSMS(order.customer_phone, "created", false);
                        emitToLocation(io, socketLocationMapping, store_name ?? order.store_name, "newOrder", order);
                        console.log("Order:", order)
                        res.json(order);
                        
                    })
                    .catch((error) => {
                        console.error(error);
                        return res.status(500).json({ message: "An error occurred" });
                    });
                
            } catch (error) {
                console.error(error);
                if (error === "Invalid token") {
                    return res.status(401).json({ message: error });
                } else {
                    return res.status(500).json({ message: "An error occurred" });
                }
            }
        });

    router.route("/partner-orders")
        .get(async (req, res) => {
            const bearerToken = req.headers["authorization"]?.split(" ")[1];
            if (!bearerToken) {
                return res.status(401).json({ message: "No bearer token" });
            }

            try {
                const row = await new Promise((resolve, reject) => {
                    db.get(
                        `SELECT * FROM api_keys WHERE api_key = ?`,
                        [bearerToken],
                        (err, row) => {
                            if (err) reject("Server error");
                            if (!row) reject("Invalid token");
                            resolve(row);
                        }
                    );
                });

                db.all(
                    "SELECT * " +
                    "FROM orders " +
                    "JOIN order_products ON orders.id = order_products.order_id " +
                    "JOIN products ON order_products.product_id = products.id " +
                    "WHERE orders.external_api_key = ?",
                    [bearerToken],
                    (err, rows) => {
                        if (err) {
                            return console.error(err.message);
                        }
                
                        // Organize the data into a more structured format
                        const ordersWithProducts = rows.reduce((acc, row) => {
                            // Check if the order already exists in the accumulator
                            const existingOrder = acc.find((o) => o.order_id === row.order_id);
                
                            if (existingOrder) {
                                // Add the product information to the existing order
                                existingOrder.products.push({
                                    product_id: row.product_id,
                                    product_name: row.product_name,
                                    quantity: row.quantity,
                                });
                            } else {
                                // Create a new order entry in the accumulator
                                acc.push({
                                    order_id: row.order_id,
                                    status: row.status,
                                    customer_name: row.customer_name,
                                    customer_phone: row.customer_phone,
                                    store_name: row.store_name,
                                    external_api_key: row.external_api_key,
                                    products: [{
                                        product_id: row.product_id,
                                        product_name: row.product_name,
                                        quantity: row.quantity,
                                    }],
                                    // Include other order fields as needed
                                });
                            }

                            return acc;
                        }, []);
                        res.json(ordersWithProducts);
                    }
                );
            } catch (error) {
                console.error(error);
                if (error === "Invalid token") {
                    return res.status(401).json({ message: error });
                } else {
                    return res.status(500).json({ message: "An error occurred" });
                }
            }
        });
    
    router.route("/products")
        .get(async (req, res) => {
            try {
                const jwtToken = req.cookies.JWT;
                const bearerToken = req.headers["authorization"]?.split(" ")[1];
                let store_name = undefined;
    
                if (!jwtToken && !bearerToken) {
                    return res.status(401).json({ message: "No jwt or bearer token" });
                }
    
                if (jwtToken) {
                    const decoded = await new Promise((resolve, reject) => {
                        jwt.verify(jwtToken, process.env.secret_key, (err, decoded) => {
                            if (err) reject("Invalid token");
                            resolve(decoded);
                        });
                    });
                    store_name = decoded.locationName;
                }
    
                if (bearerToken) {
                    const row = await new Promise((resolve, reject) => {
                        db.get(
                            `SELECT * FROM api_keys WHERE api_key = ?`,
                            [bearerToken],
                            (err, row) => {
                                if (err) reject("Server error");
                                if (!row) reject("Invalid token");
                                resolve(row);
                            }
                        );
                    });
                }

                db.all("SELECT * FROM products", [], (err, rows) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    res.json(rows);
                });
            } catch (error) {
                console.error(error);
                if (error === "Invalid token") {
                    return res.status(401).json({ message: error });
                } else {
                    return res.status(500).json({ message: "An error occurred" });
                }
            }
        });
    
    // Create an endpoint for /stores that returns a list of stores just like the way /products returns a list of products only if you have a valid bearer token:
    router.route("/stores")
        .get(async (req, res) => {
            const bearerToken = req.headers["authorization"]?.split(" ")[1];
            if (!bearerToken) {
                return res.status(401).json({ message: "No bearer token" });
            }

            try {
                const row = await new Promise((resolve, reject) => {
                    db.get(
                        `SELECT * FROM api_keys WHERE api_key = ?`,
                        [bearerToken],
                        (err, row) => {
                            if (err) reject("Server error");
                            if (!row) reject("Invalid token");
                            resolve(row);
                        }
                    );
                });

                db.all("SELECT store_name FROM stores", [], (err, rows) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    res.json(rows);
                });
            } catch (error) {
                console.error(error);
                if (error === "Invalid token") {
                    return res.status(401).json({ message: error });
                } else {
                    return res.status(500).json({ message: "An error occurred" });
                }
            }
        });

    router.route("/loadtest").get((req, res) => {
        function calculateSumOfNumbers(n) {
            let sum = 0;
            for (let i = 0; i < n; i++) {
                sum += i;
            }
            return sum;
        }
        return res.json({ sum: calculateSumOfNumbers(10000000) });
    });

    return router;
}

module.exports = apiRoutes;