const uuidv4 = require("uuid").v4;

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
        phoneNum: "+4520381866",
        external_api_key: "none",
    },
    {
        id: uuidv4(),
        status: "created",
        customer: "Donald",
        products: [{ id: 1, name: "Avocado Sandwich" }],
        store_name: "Copenhagen",
        phoneNum: "+4520389422",
        external_api_key: "none",
    },
];


const external_providers = [
    {
        api_key: "1234",
        external_name: "UberEats",
    },
    {
        api_key: "5678",
        external_name: "JustEat",
    },
];

// 3 stores med 3 hashede passwords
const stores = [
    { id: uuidv4(), store_name: "Copenhagen", password: "testCPH" },
    { id: uuidv4(), store_name: "London", password: "testLD" },
    { id: uuidv4(), store_name: "New York", password: "testNY" },
];

module.exports = { orders, external_providers, stores };