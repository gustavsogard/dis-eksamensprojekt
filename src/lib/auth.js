require("dotenv").config();
const jwt = require("jsonwebtoken");

// middleware der tjekker om token er gyldig
const authenticateToken = (req, res, next) => {
    const token = req.cookies.JWT;
  // hvis token eksisterer, verificer det
    if (token) {
      jwt.verify(token, process.env.secret_key, (err) => {
        if (err) {
          // hvis token er ugyldig, omdiriger til login
          if (req.path !== "/login") {
          res.redirect("/login");
          }
        } else{
          // hvis token er gyldig, omdiriger til hjemmesiden
            if (req.path === "/login") {
                res.redirect("/");
            }
        }
      })
    } 
    // hvis token ikke eksisterer, omdiriger til login
    else {
      if (req.path !== "/login") {
        res.redirect("/login");
      }
    }
    // kald næste middleware
    next();
  };

module.exports = authenticateToken;