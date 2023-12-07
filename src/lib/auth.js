require("dotenv").config();
const jwt = require("jsonwebtoken");

// middleware der checker om der er en token og om den er valid
const authenticateToken = (req, res, next) => {
    const token = req.cookies.JWT;
  
    if (token) {
      jwt.verify(token, process.env.secret_key, (err) => {
        if (err) {
          if (req.path !== "/login") {
          res.redirect("/login");
          }
        } else{
            if (req.path === "/login") {
                res.redirect("/");
            }
        }
      })
    } else {
      if (req.path !== "/login") {
        res.redirect("/login");
      }
    }
    next();
  };

module.exports = authenticateToken;