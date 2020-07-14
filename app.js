const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const imagesRouteFile = require("./routes/images");
const usersRouterFile = require("./routes/users");
const path = require("path");
const moment = require("moment");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const flash = require("connect-flash");
const session = require("express-session");
const express_messages = require("express-messages");
//---------Create express application-------------
var app = express();
dotenv.config();
//--------------Middlewares-----------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "uploadedImages")));
app.use(
  session({
    secret: process.env.secretKey,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = express_messages(req, res);
  next();
});
//---------------MongoDB Connection---------------
mongoose.connect(process.env.DbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
dbConnection = mongoose.connection;
dbConnection.once("open", () => {
  console.log("Db is connected successfully");
});
dbConnection.on("error", (error) => {
  console.error("Error is occurred during Db connection as : ", error.message);
});
//---------------Views-------------
app.set("view engine", "ejs"); // specify the used template engine
app.set("views", path.join(__dirname, "views")); // set the path of the views folder
//------------Routes---------------
app.use(async (req, res, next) => {
  if (req.cookies.token) {
    userObj = await jwt.verify(req.cookies.token, "secretkey");
    res.locals.user = userObj;
    console.log("Current user is : ", userObj);
  } else {
    console.log("No user is logined");
    res.locals.user = null;
  }
  next();
});
app.get("/", (req, res) => {
  res.render("login");
});
app.use("/images", imagesRouteFile);
app.use("/users", usersRouterFile);
//otherwise ... the bad request
app.use((req, res) => {
  res.render("badRequest");
});
//------------Launching the server---------------
var PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server is started listening to port number ${PORT} at time: ${moment()}`
  );
});
