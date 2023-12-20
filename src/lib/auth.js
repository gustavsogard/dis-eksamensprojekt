require("dotenv").config();
const jwt = require("jsonwebtoken");

// middleware that checks if the token is valid
const authenticateToken = (req, res, next) => {
    const token = req.cookies.JWT;
  // if the token exists, verify it
    if (token) {
      jwt.verify(token, process.env.secret_key, (err) => {
        if (err) {
          // if the token is invalid, redirect to login
          if (req.path !== "/login") {
          res.redirect("/login");
          }
        } else{
          // if the token is valid, redirect to home
            if (req.path === "/login") {
                res.redirect("/");
            }
        }
      })
    } 
    // if the token does not exist, redirect to login
    else {
      if (req.path !== "/login") {
        res.redirect("/login");
      }
    }
    // call the next middleware
    next();
  };

module.exports = authenticateToken;