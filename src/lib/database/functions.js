const { db } = require("./init");
// Opdatering af status på en ordre
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

// Henter ordrer fra databasen
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