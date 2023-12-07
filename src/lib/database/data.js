const uuidv4 = require("uuid").v4;

//Api Keys for external providers
const api_keys = [
    {
      api_key: "1234",
      external_name: "UberEats",
    },
    {
      api_key: "5678",
      external_name: "JustEat",
    },
];

//Dummy orders
const orders = [
    {
      id: uuidv4(),
      status: "created",
      customer_name: "Donald",
      customer_phone: "+4520381866",
      store_name: "Copenhagen",
      external_api_key: "none",
    },
    {
      id: uuidv4(),
      status: "created",
      customer_name: "Trump",
      customer_phone: "+4520389422",
      store_name: "Copenhagen",
      external_api_key: "none",
    },
];

//Dommy stores
const stores = [
    { id: uuidv4(), store_name: "Copenhagen", password: "testCPH" },
    { id: uuidv4(), store_name: "London", password: "testLD" },
    { id: uuidv4(), store_name: "New York", password: "testNY" },
];

//Joe Products
const products = [
    { id: uuidv4(), product_name: "Sports Juice" },
    { id: uuidv4(), product_name: "Energizer" },
    { id: uuidv4(), product_name: "Green Tonic" },
    { id: uuidv4(), product_name: "Tunacado" },
    { id: uuidv4(), product_name: "Spicy Tuna" },
    { id: uuidv4(), product_name: "JOEs Club" },
    { id: uuidv4(), product_name: "Latte" },
    { id: uuidv4(), product_name: "Americano" },
    { id: uuidv4(), product_name: "Flat White" },
    { id: uuidv4(), product_name: "Cappucino" },
    { id: uuidv4(), product_name: "Brownie" },
    { id: uuidv4(), product_name: "Cookie" },
    { id: uuidv4(), product_name: "Ginger Shot" },
];

//Dummy orders and products mapping
const order_products = [
    { order_id: orders[0].id, product_id: products[0].id, quantity: 2 },
    { order_id: orders[0].id, product_id: products[1].id, quantity: 1 },
    { order_id: orders[0].id, product_id: products[2].id, quantity: 1 },
    { order_id: orders[1].id, product_id: products[3].id, quantity: 1 },
    { order_id: orders[1].id, product_id: products[4].id, quantity: 1 },
    { order_id: orders[1].id, product_id: products[5].id, quantity: 1 },
];

module.exports = { api_keys, orders, stores, products, order_products };