require("dotenv").config();

const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { db } = require("../lib/database/init");

router.use(cookieParser());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.route("/authentication").post((req, res) => {
    const password = req.body.password;
    const locationName = req.body.locationName;
    // først tjekke om location findes i databasen og hvis den gør, så tjekke om passwordet er korrekt
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
        const hash = row.password;
  
        bcrypt.compare(password, hash, (err, result) => {
          if (result) {
            const token = jwt.sign({ locationName }, process.env.secret_key);
            // gemmer den som cookie på serveren
            res.cookie("JWT", token, {
              httpOnly: true,
              secure: true,
              samesite: "strict",
            });
  
            // Send response
            res.json({ token });
          } else {
            res.status(401).json({ message: "Invalid password" });
          }
        });
      }
    );
  });

  module.exports = router;