require("dotenv").config();

const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { db } = require("../lib/database/init");
// cookieParser middleware
router.use(cookieParser());
// bodyParser middleware
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
// authentication route
router.route("/authentication").post((req, res) => {
    // password defineres fra body og lokation fra body
    const password = req.body.password;
    const locationName = req.body.locationName;
    // tager password og lokation og sammenligner med databasen
    db.get(
      `SELECT password FROM stores WHERE store_name = ?`,
      [locationName],
      (err, row) => {
        if (err) {
          return res.status(500).json({ message: "Server error" });
        }
        if (!row) {
          return res.status(401).json({ message: "Invalid location" });
        }
        // hash bliver defineret som passwordet fra databasen
        const hash = row.password;
        // sammenligner det hashede password fra databasen med det indtastede password
        bcrypt.compare(password, hash, (err, result) => {
          if (result) {
            const token = jwt.sign({ locationName }, process.env.secret_key);
            // cookien sættes som JWT, med httpOnly, secure og samesite
            res.cookie("JWT", token, {
              httpOnly: true,
              secure: true,
              samesite: "strict",
            });
  
            // Sender JWT til klienten
            res.json({ token });
          } else {
            res.status(401).json({ message: "Invalid password" });
          }
        });
      }
    );
  });

  module.exports = router;