require("dotenv").config();

const express = require("express");
const router = express.Router();
// import the jwt library
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
// import the encryptNum function
const { encryptNum } = require("../lib/crypt");
const sendSMS = require("../lib/sms");
// import the emitToLocation function
const emitToLocation = require("../lib/sockets/emitter");
const { socketLocationMapping } = require("../lib/sockets/connection");

const { db } = require("../lib/database/init");
// creates a callback function that takes in io as object, so that socket.io can be used in the api to emit
// contains all the routes for the api
const apiRoutes = (io) => {
    // creates an endpoint for orders, where the store name is extracted from the JWT token
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
            // Get all orders from the database where the store name matches the store name from the JWT token
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
                        // if the order exists, add the product information to the existing order
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
                        // return the accumulator
                        return acc;
                    }, []);
                    // return the orders with products
                    res.json(ordersWithProducts);
                }
            );
        })
        // creates a POST endpoint for orders 
        .post(async (req, res) => {
            try {
                // JWT token is extracted from the cookie, and bearer token is extracted from the header
                const jwtToken = req.cookies.JWT;
                const bearerToken = req.headers["authorization"]?.split(" ")[1];
                let store_name = undefined;
                // if there is no JWT token or bearer token, return a 401 error
                if (!jwtToken && !bearerToken) {
                    return res.status(401).json({ message: "No jwt or bearer token" });
                }
                // if there is a JWT token, verify it and decode the store name
                if (jwtToken) {
                    const decoded = await new Promise((resolve, reject) => {
                        jwt.verify(jwtToken, process.env.secret_key, (err, decoded) => {
                            if (err) reject("Invalid token");
                            resolve(decoded);
                        });
                    });
                    store_name = decoded.locationName;
                }
                // if there is a bearer token select all from the api_keys table where the api_key matches the bearer token
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
                // creates constants with the information for the database
                const order = req.body;
                const orderId = uuidv4();
                order.order_id = orderId;
                order.status = "created";
                // insert values into the orders table and encrypt the customer phone number
                db.run("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)", [
                    orderId,
                    order.status,
                    order.customer_name,
                    encryptNum(order.customer_phone),
                    store_name ?? order.store_name,
                    bearerToken ?? "none",
                ]);
                // create the product mapping, and insert values into the order_products table
                // if there is an error select all from products where id is the product id

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
                                    // if there is no row or the row is undefined, reject the promise
                                    if (row == undefined || !row) {
                                        reject("Product not available");
                                    // else set the product name to the product name from the database
                                    } else {
                                        product.product_name = row.product_name;
                                        resolve();
                                    }
                                });
                            }
                        });
                    });
                });
                // send an SMS to the customer, and emit the order to the location
                Promise.all(productPromises)
                    .then(() => {
                        sendSMS(order.customer_phone, "created", false);
                        emitToLocation(io, socketLocationMapping, store_name ?? order.store_name, "newOrder", order);
                        console.log("Order:", order)
                        res.json(order);
                        
                    })
                    // if there is an error, return a 500 error
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
    // route for partner-orders
    router.route("/partner-orders")
    // GET endpoint for partner-orders, where the bearer token is extracted from the header
        .get(async (req, res) => {
            const bearerToken = req.headers["authorization"]?.split(" ")[1];
            if (!bearerToken) {
                return res.status(401).json({ message: "No bearer token" });
            }
            // select all from the api_keys table where the api_key matches the bearer token
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
                // select all from the orders table where the external_api_key matches the bearer token
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
                                });
                            }
                            // return the accumulator
                            return acc;
                        }, []);
                        // return the orders with products
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
    // route for products
    router.route("/products")
    // GET endpoint for products, where the JWT token is extracted from the cookie and the bearer token is extracted from the header
        .get(async (req, res) => {
            try {
                const jwtToken = req.cookies.JWT;
                const bearerToken = req.headers["authorization"]?.split(" ")[1];

                // if there is no JWT token or bearer token, return a 401 error 
                if (!jwtToken && !bearerToken) {
                    return res.status(401).json({ message: "No jwt or bearer token" });
                }
                // if there is a JWT token, decode it
                if (jwtToken) {
                    const decoded = await new Promise((resolve, reject) => {
                        jwt.verify(jwtToken, process.env.secret_key, (err, decoded) => {
                            if (err) reject("Invalid token");
                            resolve(decoded);
                        });
                    });
                }
                // if there is a bearer token, select all from the api_keys table where the api_key matches the bearer token
                if (bearerToken) {
                    const row = await new Promise((resolve, reject) => {
                        // select all from the api_keys table where the api_key matches the bearer token
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
                // select all from the products table
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
    // Create an endpoint for /login that accepts a POST request with a store name and password in the body
    // and returns a JWT token if the password is correct:
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
// export the apiRoutes function
module.exports = apiRoutes;