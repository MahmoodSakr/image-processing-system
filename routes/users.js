const express = require("express");
const userModel = require("../models/user");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const router = express.Router();
//-------------Routes---------------
function authentication(req, res, next) {
  if (req.app.locals.user) {
    next();
  } else {
    req.flash("danger", "Sorry, you must login firstly !");
    res.redirect("/users/login");
  }
}

router.get("/login", (req, res) => {
  if (req.app.locals.user) {
    res.render("images");
  } else {
    res.render("login");
  }
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.post(
  "/signup",
  [
    check("email", "Email must be a written in a valid format and not be empty")
      .not()
      .isEmpty()
      .isEmail(),
    check("username", "Username must not be empty or decimal")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check(
      "password",
      "Password must not be empty and its length included from 4 up to 8 chars"
    )
      .not()
      .isEmpty()
      .isLength({ min: 4, max: 8 }),
    check("password2", "The two passwords are not matched").custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  async (req, res) => {
    // User sign up form validation
    errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Sign up request validation errors : ", errors.array());
      errors.array().forEach((error) => {
        req.flash("danger", error.msg);
      });
      return res.redirect("/users/signup");
      // return res.status(400).json({ errorMessage: errors.array() });
    }
    // Create a new user
    user = new userModel();
    user._id = uuid.v4();
    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;
    // insert a new user in the db
    user.save(async (err, user) => {
      // error
      if (err) {
        return res.status(500).json({ errorMessage: err.message });
      }
      // if the user not be added
      if (user == null) {
        return res
          .status(500)
          .json({ message: "Cant add a new user to the db" });
      }
      // user is added on the db
      dirPath = path.join(__dirname, "..", "uploadedImages", user._id);
      fs.mkdirSync(dirPath);
      console.log("New user has been added : ", user);
      res.clearCookie("token");
      req.flash(
        "info",
        `${user.username} 's account has been registered successfully`
      );
      return res.redirect("/users/login");
      // return res.status(201).json({ "New user has been added": user });
    });
  }
);

// handle the user login post request from the sign-in form
router.post(
  "/login",
  [
    check("username", "User name must not be empty or decimal")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check(
      "password",
      "Password must not be empty and contain from 4 up to 8 chars"
    )
      .not()
      .isEmpty()
      .isLength({ min: 4, max: 8 }),
  ],
  async (req, res) => {
    try {
      // User login form validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Login request validation errors", errors.array());
        errors.array().forEach((error) => {
          req.flash("danger", error.msg);
        });
        return res.redirect("/users/login");
        // return res.status(400).json({ errorMessage: errors.array() });
      }
      // Search for user data
      // if u need to use bcrypt to hash the password before the query filter, u have to do that here
      user = await userModel.findOne({
        username: req.body.username,
        password: req.body.password,
      });
      if (user == null) {
        // User not founded
        req.flash(
          "danger",
          "User is not found Or may you entered a wrong user credential !"
        );
        res.clearCookie("token");
        return res.redirect("/users/login");
        // return res.status(404).json({
        //   message: "This user is not founded, please sign up firstly !",
        // });
      } else {
        // User is existed
        // if folder of this user is not found, create a new folder for him
        usersImgDir = path.join(__dirname, "..", "uploadedImages", user._id);
        if (!fs.existsSync(usersImgDir)) {
          fs.mkdirSync(usersImgDir);
          console.log(
            "A new img folder is created for the user -- because his folder was not founded !"
          );
        }

        // return res.status(200).json({
        //   message: "This user is logined successfully.",
        //   "User details": user,
        // });
        // Store its username and id as a cookies to be used in the authentication and authorization processes
        userObj = {};
        userObj._id = user._id;
        userObj.username = user.username;
        var token = await jwt.sign(userObj, "secretkey");
        // for each logined use data, a jwt token is stored in the user/client  browser as a cookie
        res.cookie("token", token);
        req.flash("info", `Welcome ${userObj.username}`);
        return res.redirect("/images/uploadImage");
      }
    } catch (err) {
      return res.status(500).json({ errorMessage: err.message });
    }
  }
);

router.get("/logout", authentication, (req, res) => {
  console.log("The signed out userObj", req.app.locals.user);
  req.flash("info", `${req.app.locals.user.username} has been logout now`);
  req.app.locals.user = null;
  res.clearCookie("token");
  return res.redirect("/users/login");
  // return res
  //   .status(200)
  //   .json({ message: userObj.username + " has been signed out" });

  // return res.status(200).json({
  //   message: "No user is logined in before, please sign in !",
  // });
});

// Get all users
router.get("/", (req, res) => {
  userModel.find((err, users) => {
    if (err) {
      return res.status(500).json({ errorMessage: err.message });
    } else if (users.length == 0) {
      return res.status(500).json({ message: "No users are existed in Db" });
    }
    return res.status(200).json({ "All existed users in db": users });
  });
});

router.get("/:id", authentication, (req, res) => {
  userModel.findById(req.params.id, (err, user) => {
    if (err) {
      res.status(500).json({ errorMessage: err.message });
    } else if (user == null) {
      res.status(200).json({ message: "This user is not founded in db !" });
    } else {
      res.status(200).json({
        message: `This user is founded in db and its name is ${user.username}`,
      });
    }
  });
});

// Delete user
router.delete("/delete/:id", deleting_authorization, async (req, res) => {
  try {
    // find him before deleting process
    userModel.findByIdAndDelete(
      { _id: req.params.id },
      (err, deletedResult) => {
        if (err) {
          return res.json({ errorMessage: err.message });
        } else if (deletedResult.deletedCount == 0) {
          return res.json({ message: "User deleting operation is not done !" });
        } else if (deletedResult.deletedCount > 0) {
          res.clearCookie("token");
          return res.json({
            message: `User ${user.username} has been deleted successfully.`,
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ errorMessage: error.message });
  }
});

async function deleting_authorization(req, res, next) {
  try {
    //checks authentication
    if (req.app.locals.user) {
      // checks authorization
      if (req.app.locals.user._id == req.params.id) {
        console.log(
          `The logined user ${userObj.username} is authorized to delete his data`
        );
        next();
      } else {
        console.log(
          `The logined user ${userObj.username} is not authorized to delete other user data`
        );
        return res.status(403).json({
          message: `This user ${userObj.username} is not authorized to delete other user data`,
        });
      }
    } else {
      return res.status(403).json({
        message:
          "No user is currently logined, so the deleting process is not authorized totally!",
      });
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: error.message,
    });
  }
}

module.exports = router;
