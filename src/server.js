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
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'))
})

app.get('/orders', (req, res) => {
    res.json(orders);
});

app.use('/public', express.static(path.join(__dirname, '../client/public')));
