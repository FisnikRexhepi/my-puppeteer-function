const express = require("express");
const serverless = require("serverless-http");
const app = express();
const router = express.Router();

//Get all students
router.get("/", (req, res) => {
  res.send("App is running..");
});

//Create new record
router.post("/add", (req, res) => {
  res.send("New record added.");
});

app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);
