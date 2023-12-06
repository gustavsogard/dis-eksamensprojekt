const express = require("express");
const router = express.Router();

const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const authenticateToken = require("../lib/auth");

router.use(cookieParser());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.route("/login").get(authenticateToken, (req, res) =>
    res.sendFile(path.join(__dirname, "../../client/login.html"))
);

module.exports = router;
