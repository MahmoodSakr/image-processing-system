const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const moment = require("moment");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const flash = require("connect-flash");
const session = require("express-session");
const express_messages = require("express-messages");
const imagesRouteFile = require("./routes/images");
const usersRouterFile = require("./routes/users");
const userModel = require("./models/user");
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
  console.log("The current traffic is : ", req.path);
  res.locals.messages = express_messages(req, res); // flash middleware
  if (req.cookies.token) {
    userObj = await jwt.verify(req.cookies.token, "secretkey");
    // get this user from the DB
    user = await userModel.findById(userObj._id); // the user owner of the cookie
    // If the user is already existed in the db
    if (user) {
      app.locals.user = user;
      next();
    } else {
      // No user in the Db, so remove the cookie and login route is redirect
      app.locals.user = null;
      res.clearCookie("token");
      req.flash(
        "danger",
        "This user is not authenticated ! Please sign in with another user"
      );
      res.redirect("/users/login");
    }
  } else {
    console.log("No user is logined yet");
    app.locals.user = null;
    next();
  }
});
app.get("/", (req, res) => {
  res.render("uploadImage");
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
