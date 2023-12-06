require("dotenv").config();

const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const { encryptNum } = require("../lib/crypt");
const sendSMS = require("../lib/sms");

const { emitToLocation } = require("../lib/sockets/emitter");
const { socketLocationMapping } = require("../lib/sockets/connection");
const io = require("../server");

const { db } = require("../lib/database/init");

router.route("/orders")
    .get((req, res) => {
        const token = req.cookies.JWT;
        console.log("token", token);
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
        console.log(store_name);

        db.all(
            "SELECT * FROM orders WHERE store_name = ?",
            [store_name],
            (err, rows) => {
                rows = rows.map((row) => {
                    return {
                        ...row,
                        products: JSON.parse(row.products),
                    };
                });
                if (err) {
                    return console.error(err.message);
                }
                res.json(rows);
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
            order.id = uuidv4();
            order.status = "created";
            db.run("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?)", [
                order.id,
                order.status,
                order.customer,
                JSON.stringify(order.products),
                store_name ?? order.store_name,
                encryptNum(order.phoneNum),
                bearerToken ?? "none",
            ]);
            sendSMS(order.phoneNum, "created", false);
            emitToLocation(io, socketLocationMapping, store_name ?? order.store_name, "newOrder", order);
            res.json(order);
        } catch (error) {
            if (error === "Invalid token") {
                return res.status(403).json({ message: error });
            } else {
                return res.status(500).json({ message: "An error occurred" });
            }
        }
    });

module.exports = router;