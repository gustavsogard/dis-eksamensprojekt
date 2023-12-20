require("dotenv").config();

const express = require("express");
const router = express.Router();

const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const authenticateToken = require("../lib/auth");
// gør at serveren kan læse cookies og json
router.use(cookieParser());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
// index route som tjekker for token, hvis der er en korrekt token bliver index vist
// ellers håndteres det i authenticateToken
router.route("/").get(authenticateToken, (req, res) => {
    // dette gør at der bliver tjekket for token, hvis der er en korrekt token bliver orders vist
    res.sendFile(path.join(__dirname, "../../client/index.html"));
  });
  
module.exports = router;