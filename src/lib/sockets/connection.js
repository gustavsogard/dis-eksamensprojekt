require("dotenv").config();
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const sendSMS = require("../sms");
const emitToLocation = require("./emitter");
const { statusChange, getOrder } = require("../database/functions");

const socketLocationMapping = new Map();
const statuses = ["accepted", "done", "archived", "rejected"];

const ioCallbackFunction = (io) => (socket) => {
    let cookies = socket.handshake.headers.cookie;
    if (cookies) {
        cookies = cookie.parse(cookies);
        console.log('cookies', cookies)
        const token = cookies.JWT;

        jwt.verify(token, process.env.secret_key, (err, decoded) => {
            if (err) {
                console.error("Authentication error: ", err);
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

    socket.on("disconnect", () => {
        socketLocationMapping.delete(socket.id);
        console.log("user disconnected");
    });

    statuses.forEach((status) => {
        socket.on(status, (orderId) => {
            let locationName = socketLocationMapping.get(socket.id);
            emitToLocation(io, socketLocationMapping, locationName, status, orderId);
            statusChange(orderId, status);
            if (status !== "archived") {
                getOrder(orderId).then((order) => {
                    sendSMS(order.phoneNum, status);
                });
            }
        });
    });
};

module.exports = { ioCallbackFunction, socketLocationMapping };