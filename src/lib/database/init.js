const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db.sqlite");

const bcrypt = require("bcrypt");
const { encryptNum } = require("../crypt");

// Importer dummy data fra data.js
const { api_keys, orders, stores, products, order_products } = require("./data");

// Initialiserer databasen med SQLite3
const init = () => {
    db.serialize(function () {
        console.log("Creating databases if they don't exist");
        db.run(`CREATE TABLE IF NOT EXISTS api_keys (api_key TEXT PRIMARY KEY, external_name TEXT NOT NULL UNIQUE);`);
        db.run(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, status TEXT NOT NULL, customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL, store_name TEXT NOT NULL, external_api_key TEXT NOT NULL);`);
        db.run(`CREATE TABLE IF NOT EXISTS stores (id TEXT PRIMARY KEY, store_name TEXT NOT NULL UNIQUE, password TEXT NOT NULL);`);
        db.run(`CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, product_name TEXT NOT NULL UNIQUE);`);
        db.run(`CREATE TABLE IF NOT EXISTS order_products (order_id TEXT NOT NULL, product_id TEXT NOT NULL, quantity INTEGER NOT NULL, PRIMARY KEY (order_id, product_id), FOREIGN KEY (order_id) REFERENCES orders (id), FOREIGN KEY (product_id) REFERENCES products (id));`);

        // Indsætter API nøgler i databasen
        api_keys.forEach(async (key) => {
            db.get(
                `SELECT * FROM api_keys WHERE external_name = ?`,
                [key.external_name],
                (err, row) => {
                    if (err) {
                        console.error(err.message);
                    }
                    if (row) {
                        return;
                    } else {
                        db.run(`INSERT INTO api_keys VALUES (?, ?)`, [
                            key.api_key,
                            key.external_name,
                        ]);
                    }
                }
            );
        });

        // Indsætter ordrer i databasen
        orders.forEach(async (order) => {
            db.get(
                `SELECT * FROM orders WHERE id = ?`,
                [order.id],
                (err, row) => {
                    if (err) {
                        console.error(err.message);
                    }
                    if (row) {
                        return;
                    } else {
                        db.run(`INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)`, [
                            order.id,
                            order.status,
                            order.customer_name,
                            encryptNum(order.customer_phone),
                            order.store_name,
                            order.external_api_key,
                        ]);
                    }
                }
            );
        });

        //Opretter 10 salts og bruger dem til at hashe adgangskoden
        //Indsætter butikker i databasen
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        stores.forEach(async (store) => {
            db.get(
                `SELECT * FROM stores WHERE store_name = ?`,
                [store.store_name],
                (err, row) => {
                    if (err) {
                        console.error(err.message);
                    }
                    if (row) {
                        return;
                    } else {
                        db.run(`INSERT INTO stores VALUES (?, ?, ?)`, [
                            store.id,
                            store.store_name,
                            bcrypt.hashSync(store.password, salt),
                        ]);
                    }
                }
            );
        });

        // Indsætter produkter i databasen
        products.forEach(async (product) => {
            db.get(
                `SELECT * FROM products WHERE product_name = ?`,
                [product.product_name],
                (err, row) => {
                    if (err) {
                        console.error(err.message);
                    }
                    if (row) {
                        return;
                    } else {
                        db.run(`INSERT INTO products VALUES (?, ?)`, [
                            product.id,
                            product.product_name,
                        ]);
                    }
                }
            );
        });

        // Indsætter ordrer og produkter i databasen
        order_products.forEach(async (order_product) => {
            db.get(
                `SELECT * FROM order_products WHERE order_id = ? AND product_id = ?`,
                [order_product.order_id, order_product.product_id],
                (err, row) => {
                    if (err) {
                        console.error(err.message);
                    }
                    if (row) {
                        return;
                    } else {
                        db.run(`INSERT INTO order_products VALUES (?, ?, ?)`, [
                            order_product.order_id,
                            order_product.product_id,
                            order_product.quantity,
                        ]);
                    }
                }
            );
        });
    });
}

module.exports = { init, db }
