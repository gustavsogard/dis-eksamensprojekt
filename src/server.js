const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const secret_key = "Joe's secret key";


app.use(cookieParser());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const http = require("http").Server(app)
const io = require("socket.io")(http)
const host = "localhost"
const path = require("path")

http.listen(port, host, () => {
    console.log('Server running...')
})

const orders = [
    { id: 1, status: 'created', customer: 'Donald', products: [
        { id: 1, name: 'Avocado Sandwich' },
        { id: 2, name: 'Juice' },
    ] },
    { id: 2, status: 'created', customer: 'Donald', products: [
        { id: 1, name: 'Avocado Sandwich' },
    ] },
]

// 3 stores med 3 hashede passwords
const stores = [
    { id: uuidv4(), store_name: 'Copenhagen', password: 'testCPH'},
    { id: uuidv4(), store_name: 'London', password: 'testLD'},
    { id: uuidv4(), store_name: 'New York', password: 'testNY'}
]

// SQLite database
const db = new sqlite3.Database("./db.sqlite");

db.serialize(function () {
  console.log("Creating databases if they don't exist");
  db.run(
    "CREATE TABLE IF NOT EXISTS stores (id text PRIMARY KEY , store_name text NOT NULL UNIQUE, password text NOT NULL)"
  )
  db.run(
    "CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, status TEXT NOT NULL, customer TEXT NOT NULL, products TEXT NOT NULL)"
    );
  
// laver 10 salt rounds  
const salt_rounds = 10;
// hasher storepassword, og tjekker om store allerede findes i databasen
(async () => {
    stores.forEach(async (store) => {
        db.get(`SELECT * FROM stores WHERE store_name = ?`, [store.store_name], (err, row) => {
            if (err) {
                console.error(err.message);
            }
            if (row) {
                return;
            } else {
                db.run(
                    `INSERT INTO stores VALUES (?, ?, ?)`,
                    [store.id, store.store_name, bcrypt.hashSync(store.password, salt_rounds)]
                );
            }
        });
    });
})();
(async () => {
    // Check if orders already exist
    db.get('SELECT COUNT(*) as count FROM orders', (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (row.count > 0) {
            return;
        }
        else {
            orders.forEach(async (order) => {
                db.run(
                    'INSERT INTO orders VALUES (?, ?, ?, ?)',
                    [order.id, order.status, order.customer, JSON.stringify(order.products)]
                );
            });
        }
    });
})();
});


// middleware der checker om der er en token og om den er valid
const authenticateToken = (req, res, next) => {
    console.log("Checking for token...");
    const token = req.cookies.JWT;
    // Check om der er en token, og om requested path er login siden
    if(req.path === '/login') {

        if(token){
            console.log("User has token");
            jwt.verify(token, secret_key, (err,) => {
                if (err) {
                    return res.status(403).json({ message: "Invalid token" });
                } else {
                    // hvis der er en valid token sendes personen til dashboardet.
                    console.log("valid token, redirecting to '/'");
                    res.redirect('/');
                } 
            });
        } else{
            console.log("No token, serving '/login");
            // middlewaren afsluttes og personen bliver sendt videre
            next()
            return
        }
    }
    // hvis ingen token findes skrives fejl
    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }
    // Check om token er valid
    jwt.verify(token, secret_key, (err,) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }
      next();
    });
  };

app.route("/login")
  .get(authenticateToken ,(req, res) => res.sendFile(path.join(__dirname, '../client/login.html')))
  

app.route("/")
  .get(authenticateToken ,(req, res) => {
    console.log("token is valid, serving dashboard");
      // dette gør at der bliver tjekket for token, hvis der er en korrekt token bliver orders vist
    res.sendFile(path.join(__dirname, '../client/index.html'))
  })
  
  
app.route("/orders")
    .get((req, res) => {  
        res.json(orders)
    })
    .post((req, res) => {
        const order = req.body
        order.id = orders.length + 1
        order.status = "created"
        orders.push(order)
        io.emit("newOrder", order)
        res.json(order)
  });

// verifyPassword() for copenhagen function
app.route("/authentication")
.post((req, res) => {
    const password = req.body.password;
    const locationName = req.body.locationName;
// først tjekke om location findes i databasen og hvis den gør, så tjekke om passwordet er korrekt
    db.get(`SELECT password FROM stores WHERE store_name = ?`, [locationName], (err, row) => {
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
                const token = jwt.sign({ locationName }, secret_key,);
                console.log(token);
                // gemmer den som cookie på serveren
               res.cookie('JWT', token, { httpOnly: true, secure: true, samesite: 'strict' });

                // Send response
                res.json({ token });
            } else {
                res.status(401).json({ message: "Invalid password" });
            }
        });
    });
});





const statusChange = ((orderId, status) => {
    db.serialize(() => {
        db.run(`UPDATE orders SET status = '${status}' WHERE id = ?`, [orderId], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    })
})

io.on("connection", socket => {
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })

    socket.on('orderAccepted', orderId => {
        io.emit('orderAccepted', orderId);
        statusChange(orderId, 'progress');
        orders.find(order => order.id == orderId).status = 'progress';
    })

    socket.on("orderFinished", orderId => {
        io.emit("orderFinished", orderId);
        statusChange(orderId, 'done');
        orders.find(order => order.id == orderId).status = 'done';
    });

    socket.on("orderArchived", orderId => {
        io.emit("orderArchived", orderId);
        statusChange(orderId, 'archived');
        orders.find(order => order.id == orderId).status = 'archived';
    })

    socket.on("orderRejected", orderId => {
        io.emit("orderRejected", orderId);
        statusChange(orderId, 'rejected');
        orders.find(order => order.id == orderId).status = 'rejected';
    })
})








app.use('/public', express.static(path.join(__dirname, '../client/public')));

module.exports = authenticateToken;