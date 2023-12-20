require("dotenv").config();

const express = require("express");
const router = express.Router();

// importerer jwt og uuidv4
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// importerer encryptNum og sendSMS
const { encryptNum } = require("../lib/crypt");
const sendSMS = require("../lib/sms");

// importerer emitToLocation og socketLocationMapping
const emitToLocation = require("../lib/sockets/emitter");
const { socketLocationMapping } = require("../lib/sockets/connection");

const { db } = require("../lib/database/init");

// opretter en call-backfunktion, der tager imod io som objekt, så socket.io kan bruges i API'et
const apiRoutes = (io) => {
    // opretter et endpoint for /login, der tager imod en POST-request med et butiksnavn og et password i body'en
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
            // henter alle ordrer fra databasen, hvor butiksnavnet matcher det, der er i JWT-tokenet
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
            
                    // Organiserer data i en mere struktureret form
                    const ordersWithProducts = rows.reduce((acc, row) => {
                        // TJekker om ordren allerede eksisterer i accumulator
                        const existingOrder = acc.find((o) => o.order_id === row.order_id);
                        // Hvis ordren eksisterer, tilføj produktinformation til den eksisterende ordre
                        if (existingOrder) {
                            // Tilføj produktinformation til den eksisterende ordre
                            existingOrder.products.push({
                                product_id: row.product_id,
                                product_name: row.product_name,
                                quantity: row.quantity,
                            });
                        } else {
                            // Opret en ny ordre i accumulator
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
                        // returner accumulatoren
                        return acc;
                    }, []);
                    // returnerer ordrer med produkter
                    res.json(ordersWithProducts);
                }
            );
        })
        // laver en POST-endpoint for ordrer, hvor JWT-tokenet hentes fra cookien, og bearer-tokenet hentes fra headeren
        .post(async (req, res) => {
            try {
                const jwtToken = req.cookies.JWT;
                const bearerToken = req.headers["authorization"]?.split(" ")[1];
                let store_name = undefined;
                // Hvis der ikke er et JWT-token eller et bearer-token, returner en 401-fejl
                if (!jwtToken && !bearerToken) {
                    return res.status(401).json({ message: "No jwt or bearer token" });
                }
                // Hvis der er et JWT-token, verificer det og decode butiksnavnet
                if (jwtToken) {
                    const decoded = await new Promise((resolve, reject) => {
                        jwt.verify(jwtToken, process.env.secret_key, (err, decoded) => {
                            if (err) reject("Invalid token");
                            resolve(decoded);
                        });
                    });
                    store_name = decoded.locationName;
                }
                // Hvis der er et bearer-token, select all fra api_keys-tabellen, hvor api_key matcher bearer-tokenet
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
                // Opretter konstanter med informationer til databasen
                const order = req.body;
                const orderId = uuidv4();
                order.order_id = orderId;
                order.status = "created";
                // indsætter værdier i orders-tabellen og krypterer kundens telefonnummer
                db.run("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)", [
                    orderId,
                    order.status,
                    order.customer_name,
                    encryptNum(order.customer_phone),
                    store_name ?? order.store_name,
                    bearerToken ?? "none",
                ]);
                // Opretter produktmapping og indsætter værdier i order_products-tabellen
                // Hvis der er en fejl, select all fra products, hvor id er produkt-id'et

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
                                    // hvis der ikke er en række eller rækken er udefineret, reject promise
                                    if (row == undefined || !row) {
                                        reject("Product not available");
                                    // ellers sæt produktets navn til produktets navn fra databasen
                                    } else {
                                        product.product_name = row.product_name;
                                        resolve();
                                    }
                                });
                            }
                        });
                    });
                });
                // send en SMS til kunden og emit ordren til butikken
                Promise.all(productPromises)
                    .then(() => {
                        sendSMS(order.customer_phone, "created", false);
                        emitToLocation(io, socketLocationMapping, store_name ?? order.store_name, "newOrder", order);
                        console.log("Order:", order)
                        res.json(order);  
                    })
                    // hvis der er en fejl, returner en 500-fejl
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
    // opretter en PUT-endpoint for ordrer, hvor JWT-tokenet hentes fra cookien, og bearer-tokenet hentes fra headeren
    router.route("/partner-orders")
        .get(async (req, res) => {
            const bearerToken = req.headers["authorization"]?.split(" ")[1];
            if (!bearerToken) {
                return res.status(401).json({ message: "No bearer token" });
            }
            // select all fra api_keys-tabellen, hvor api_key matcher bearer-tokenet
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
                // select all fra orders-tabellen, hvor external_api_key matcher bearer-tokenet
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
                        // Organiserer data i en mere struktureret form
                        const ordersWithProducts = rows.reduce((acc, row) => {
                            // tjek om ordren allerede eksisterer i accumulator
                            const existingOrder = acc.find((o) => o.order_id === row.order_id);
                            if (existingOrder) {
                                // tilføj produktinformation til den eksisterende ordre
                                existingOrder.products.push({
                                    product_id: row.product_id,
                                    product_name: row.product_name,
                                    quantity: row.quantity,
                                });
                            } else {
                                // opret en ny ordre i accumulator
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
                            return acc;
                        }, []);
                        // returner ordrer med produkter
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
    // opretter en GET-endpoint for produkter, hvor JWT-tokenet hentes fra cookien, og bearer-tokenet hentes fra headeren
        .get(async (req, res) => {
            try {
                const jwtToken = req.cookies.JWT;
                const bearerToken = req.headers["authorization"]?.split(" ")[1];

                // hvis der ikke er et JWT-token eller et bearer-token, returner en 401-fejl
                if (!jwtToken && !bearerToken) {
                    return res.status(401).json({ message: "No jwt or bearer token" });
                }
                // hvis der er et JWT-token, verificer det og decode butiksnavnet
                if (jwtToken) {
                    const decoded = await new Promise((resolve, reject) => {
                        jwt.verify(jwtToken, process.env.secret_key, (err, decoded) => {
                            if (err) reject("Invalid token");
                            resolve(decoded);
                        });
                    });
                }
                // hvis der er et bearer-token, select all fra api_keys-tabellen, hvor api_key matcher bearer-tokenet
                if (bearerToken) {
                    const row = await new Promise((resolve, reject) => {
                        // vælg alt fra api_keys-tabellen, hvor api_key matcher bearer-tokenet
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
                // select all fra products-tabellen
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
    
    // opret et endpoint for /stores der returnerer en liste over butikker på samme måde som /products returnerer en liste over produkter, hvis du har en gyldig bearer-token:
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
    // opret et endpoint for /login der accepterer en POST-request med et butiksnavn og et password i body'en og returnerer et JWT-token, hvis password'et er korrekt:
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
// eksporter routeren
module.exports = apiRoutes;