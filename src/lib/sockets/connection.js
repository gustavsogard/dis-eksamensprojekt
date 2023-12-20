require("dotenv").config();
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const sendSMS = require("../sms");
const emitToLocation = require("./emitter");
const { statusChange, getOrder } = require("../database/functions");
// Map to store socket id and location name
const socketLocationMapping = new Map();
const statuses = ["accepted", "done", "archived", "rejected"];
// ioCallbackFunction that handles the socket connection
const ioCallbackFunction = (io) => (socket) => {
    let cookies = socket.handshake.headers.cookie;
    if (cookies) {
        cookies = cookie.parse(cookies);
        const token = cookies.JWT;
        // Verify the JWT token, with the env.secret_key
        jwt.verify(token, process.env.secret_key, (err, decoded) => {
            if (err) {
                console.error("Authentication error: ", err);
                // close the connection
                socket.disconnect();
            } else {
                let locationName = decoded.locationName;
                socketLocationMapping.set(socket.id, locationName);
            }
        });
    } else {
        // Handle the case where no cookies are present
        socket.disconnect();
    }
    // Removes the socket from the map when the connection is closed
    socket.on("disconnect", () => {
        socketLocationMapping.delete(socket.id);
    });
    // for each status, listen to the event and emit to the location
    statuses.forEach((status) => {
        socket.on(status, (orderId) => {
            // set the location name based on the socket id
            let locationName = socketLocationMapping.get(socket.id);
            // emit to the location
            emitToLocation(io, socketLocationMapping, locationName, status, orderId);
            // update the status in the database
            statusChange(orderId, status);
            // if the status is not archived, send an sms to the customer
            if (status !== "archived") {
                getOrder(orderId).then((order) => {
                    sendSMS(order.customer_phone, status);
                });
            }
        });
    });
};

module.exports = { ioCallbackFunction, socketLocationMapping };