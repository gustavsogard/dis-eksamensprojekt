const express = require("express");
const router = express.Router();

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../lib/swagger/api-documentation.json");
// swagger route, der viser dokumentationen for api'et
router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(swaggerDocument));

module.exports = router;