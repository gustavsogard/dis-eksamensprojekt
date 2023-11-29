const jwt = require("jsonwebtoken");
require("dotenv").config();

// middleware der checker om der er en token og om den er valid
const authenticateToken = (req, res, next) => {
    console.log("Checking for token...");
    const token = req.cookies.JWT;
  
    if (token) {
      jwt.verify(token, process.env.secret_key, (err) => {
        if (err) {
          if (req.path !== "/login") {
          res.redirect("/login");
          }
          console.log("invalid token");
        } else{
            if (req.path === "/login") {
                console.log("token is valid, serving dashboard");
                res.redirect("/");
            }
        }
      })
    } else {
      if (req.path !== "/login") {
        console.log("no token, redirecting to '/login'");
        res.redirect("/login");
      }
    }
    next();
  };

module.exports = authenticateToken;