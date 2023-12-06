const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db.sqlite");

const bcrypt = require("bcrypt");
const { encryptNum } = require("../crypt");

const { stores, orders, external_providers } = require("./data");

// SQLite database

const init = () => {
    db.serialize(function () {
        console.log("Creating databases if they don't exist");
        db.run(`
            CREATE TABLE IF NOT EXISTS stores (id TEXT PRIMARY KEY, store_name TEXT NOT NULL UNIQUE, password TEXT NOT NULL);
            `);
        db.run(`
            CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, status TEXT NOT NULL, customer TEXT NOT NULL, products TEXT NOT NULL, store_name TEXT NOT NULL, phoneNum TEXT NOT NULL, external_api_key TEXT NOT NULL);
            `);
        db.run(`
            CREATE TABLE IF NOT EXISTS api_keys (api_key TEXT PRIMARY KEY, external_name TEXT NOT NULL);
            `);

        // laver 10 salt rounds
        const salt_rounds = 10;
        // hasher storepassword, og tjekker om store allerede findes i databasen
        (async () => {
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
                                bcrypt.hashSync(store.password, salt_rounds),
                            ]);
                        }
                    }
                );
            });
        })();
        (async () => {
            external_providers.forEach(async (provider) => {
                db.get(
                    `SELECT * FROM api_keys WHERE external_name = ?`,
                    [provider.external_name],
                    (err, row) => {
                        if (err) {
                            console.error(err.message);
                        }
                        if (row) {
                            return;
                        } else {
                            db.run(`INSERT INTO api_keys VALUES (?, ?)`, [
                                provider.api_key,
                                provider.external_name,
                            ]);
                        }
                    }
                );
            });
        })();
        (async () => {
            // Check if orders already exist
            db.get("SELECT COUNT(*) as count FROM orders", (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                if (row.count > 0) {
                    return;
                } else {
                    orders.forEach(async (order) => {
                        db.run("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?)", [
                            order.id,
                            order.status,
                            order.customer,
                            JSON.stringify(order.products),
                            order.store_name,
                            encryptNum(order.phoneNum),
                            order.external_api_key,
                        ]);
                    });
                }
            });
        })();
    });
}

module.exports = { init, db }
