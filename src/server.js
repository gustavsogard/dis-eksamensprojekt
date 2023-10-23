const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000

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

io.on("connection", socket => {
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })

    socket.on('orderAccepted', orderId => {
        io.emit('orderAccepted', orderId);
        orders.find(order => order.id == orderId).status = 'progress';
    })

    socket.on("orderFinished", orderId => {
        io.emit("orderFinished", orderId);
        orders.find(order => order.id == orderId).status = 'done';
    });

    socket.on("orderArchived", orderId => {
        io.emit("orderArchived", orderId);
        orders.find(order => order.id == orderId).status = 'archived';
    })

    socket.on("orderRejected", orderId => {
        io.emit("orderRejected", orderId);
        orders.find(order => order.id == orderId).status = 'rejected';
    })
})

app.get('/', (req, res) => {
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

app.use('/public', express.static(path.join(__dirname, '../client/public')));
