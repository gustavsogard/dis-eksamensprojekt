const { db } = require("./init");

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

module.exports = { statusChange, getOrder };