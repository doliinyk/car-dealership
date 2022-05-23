require("dotenv")
	.config();

const express = require("express");
const favicon = require("serve-favicon");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(favicon(path.join(__dirname, "/../public/img/icons/logo512_light.png")));

module.exports = {
	app,
	port
};