const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const app = express();
const port = 3000;
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authenticateToken = require("./authToken");
const { encryptNum, decryptNum } = require("./crypt");
const sendSMS = require("./sms");

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const http = require("http").Server(app);
const io = require("socket.io")(http);
const host = "localhost";
const path = require("path");

http.listen(port, host, () => {
  console.log("Server running...");
});

const orders = [
  {
    id: uuidv4(),
    status: "created",
    customer: "Donald",
    products: [
      { id: 1, name: "Avocado Sandwich" },
      { id: 2, name: "Juice" },
    ],
    store_name: "Copenhagen",
    phoneNum: "+4528600501"
  },
  {
    id: uuidv4(),
    status: "created",
    customer: "Donald",
    products: [{ id: 1, name: "Avocado Sandwich" }],
    store_name: "Copenhagen",
    phoneNum: "+4530223698"
  },
];

// 3 stores med 3 hashede passwords
const stores = [
  { id: uuidv4(), store_name: "Copenhagen", password: "testCPH" },
  { id: uuidv4(), store_name: "London", password: "testLD" },
  { id: uuidv4(), store_name: "New York", password: "testNY" },
];

// SQLite database
const db = new sqlite3.Database("./db.sqlite");

db.serialize(function () {
  console.log("Creating databases if they don't exist");
  db.run(`
    CREATE TABLE IF NOT EXISTS stores (id TEXT PRIMARY KEY, store_name TEXT NOT NULL UNIQUE, password TEXT NOT NULL);
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, status TEXT NOT NULL, customer TEXT NOT NULL, products TEXT NOT NULL, store_name TEXT NOT NULL, phoneNum TEXT NOT NULL);
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
    // Check if orders already exist
    db.get("SELECT COUNT(*) as count FROM orders", (err, row) => {
      if (err) {
        return console.error(err.message);
      }
      if (row.count > 0) {
        return;
      } else {
        orders.forEach(async (order) => {
          db.run("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)", [
            order.id,
            order.status,
            order.customer,
            JSON.stringify(order.products),
            order.store_name,
            encryptNum(order.phoneNum)
          ]);
        });
      }
    });
  })();
});



app
  .route("/login")
  .get(authenticateToken, (req, res) =>
    res.sendFile(path.join(__dirname, "../client/login.html"))
  );

app.route("/").get(authenticateToken, (req, res) => {
  console.log("token is valid, serving dashboard");
  // dette gør at der bliver tjekket for token, hvis der er en korrekt token bliver orders vist
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

app
  .route("/orders")
  .get((req, res) => {
    const token = req.cookies.JWT;
    console.log("token", token);
    const store_name = jwt.verify(token, process.env.secret_key, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      } else {
        return decoded.locationName;
      }
    });
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
  .post((req, res) => {
    const order = req.body;
    order.id = uuidv4();
    order.status = "created";
    db.run("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)", [
      order.id,
      order.status,
      order.customer,
      JSON.stringify(order.products),
      order.store_name,
      encryptNum(order.phoneNum)
    ]);
    sendSMS(encryptNum(order.phoneNum, 'created'));
    io.emit("newOrder", order);
    res.json(order);
  });

// verifyPassword() for copenhagen function
app.route("/authentication").post((req, res) => {
  const password = req.body.password;
  const locationName = req.body.locationName;
  // først tjekke om location findes i databasen og hvis den gør, så tjekke om passwordet er korrekt
  db.get(
    `SELECT password FROM stores WHERE store_name = ?`,
    [locationName],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Server error" });
      }
      if (!row) {
        return res.status(401).json({ message: "Invalid location" });
      }
      const hash = row.password;

      bcrypt.compare(password, hash, (err, result) => {
        if (result) {
          console.log("Password is correct");
          const token = jwt.sign({ locationName }, process.env.secret_key);
          console.log(token);
          // gemmer den som cookie på serveren
          res.cookie("JWT", token, {
            httpOnly: true,
            secure: true,
            samesite: "strict",
          });

          // Send response
          res.json({ token });
        } else {
          res.status(401).json({ message: "Invalid password" });
        }
      });
    }
  );
});

const statusChange = (orderId, status) => {
  db.run(
    `UPDATE orders SET status = '${status}' WHERE id = ?`,
    [orderId],
    (err) => {
      if (err) {
        console.error(err.message);
      }
    }
  );
};

const getOrder = (orderId) => {
  return new Promise((res, rej) => {
    db.get(`SELECT * FROM orders WHERE id = ?`, [orderId], (err, row) => {
      if (err) {
        return console.error(err.message);
      }
      res(row);
    });
  });
};

const statuses = ["accepted", "done", "archived", "rejected"];

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  statuses.forEach((status) => {
    socket.on(status, (orderId) => {
      io.emit(status, orderId);
      statusChange(orderId, status);
      if (status !== "archived") {
        getOrder(orderId).then((order) => {
          sendSMS(order.phoneNum, status);
        });
      }
    });
  });
});



app.use("/public", express.static(path.join(__dirname, "../client/public")));

module.exports = authenticateToken;
