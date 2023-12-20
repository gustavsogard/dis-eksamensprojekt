const { db } = require("./init");
// statusChange that updates the status of an order
const statusChange = (orderId, status) => {
    db.run(
      `UPDATE orders SET status = ? WHERE id = ?`,
      [status, orderId],
      (err) => {
        if (err) {
          console.error(err.message);
        }
      }
    );
  };

// getOrder that returns an order based on the orderId
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

module.exports = { statusChange, getOrder };