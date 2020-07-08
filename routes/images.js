const express = require("express");
const { check, validationResult } = require("express-validator");
const imageModel = require("../models/image");
const jwt = require("jsonwebtoken");
router = express.Router();
//------------Routes---------------
// Show all images
router.get("/", (req, res) => {
  imageModel.find((err, images) => {
    if (err) {
      return res.status(500).json({ errorMessage: err.message });
    }
    if (images.length == 0) {
      return res
        .status(200)
        .json({ message: "No images are existed in the db" });
    } else {
      return res
        .status(200)
        .json({ "All existed images in the Db are ": images });
    }
  });
});
// Add a new image + Authentication
router.post(
  "/add",
  authenticate,
  [
    check(
      "name",
      "Please enter a valid image name as it must not be empty, decimal, or email !"
    )
      .not()
      .isEmpty()
      .not()
      .isDecimal()
      .not()
      .isEmail(),
    check(
      "category",
      "Please enter a valid category name as it must not be empty, decimal, or email !"
    )
      .not()
      .isEmpty()
      .not()
      .isDecimal()
      .not()
      .isEmail(),
    check(
      "productionCompany",
      "Please enter a valid productionCompany name as it must not be empty, decimal, or email !"
    )
      .not()
      .isEmpty()
      .not()
      .isDecimal()
      .not()
      .isEmail(),
    check(
      "productionYear",
      "Please enter a valid productionYear as it must not be empty, letters, or email !"
    )
      .not()
      .isEmpty()
      .isDecimal()
      .not()
      .isEmail(),
  ],
  async (req, res) => {
    // Form validation
    const errors = validationResult(req);
    // check errors
    if (!errors.isEmpty()) {
      return res.json({ errorMessage: errors.array() });
    }
    // No Errors
    // Get the hashed cookies and get the user id to be inserted as a owner id for the image
    try {
      userObj = await jwt.verify(req.cookies.token, "secretkey");
    } catch (error) {
      return res.json({ errorMessage: errors.message });
    }
    // Add a new image
    imageObj = new imageModel();
    imageObj.owner_id = userObj._id;
    imageObj.name = req.body.name;
    imageObj.category = req.body.category;
    imageObj.productionCompany = req.body.productionCompany;
    imageObj.productionYear = req.body.productionYear;
    // insert a new image document in the db
    imageObj.save((err, image) => {
      // error checking
      if (err) {
        return res.status(500).json({ errorMessage: err.message });
      }
      // No Error
      // Check for the adding of a new image document in the db
      // Is the image insertion is done
      if (image != null) {
        console.log("New image is added", image);
        return res.status(201).json({ "New image is added": image });
      } else {
        // Is the image insertion is not done
        return res
          .status(500)
          .json({ message: "The image data is not added to the Db !" });
      }
    });
  }
);
// Search for a image + Authentication
router.get("/:id", authenticate, (req, res) => {
  imageModel.findById(req.params.id, (err, image) => {
    if (err) {
      return res.status(500).json({ errorMessage: err.message });
    } else if (image != null) {
      return res.status(200).json({ "This image is founded ": image });
    } else {
      return res
        .status(500)
        .json({ message: "This image is not founded in the db" });
    }
  });
});

// Edit/Update an existed image + Authentication + Authorization (inside the function)
router.patch("/:id", authenticate, async (req, res) => {
  // search for it before being updated
  try {
    image = await imageModel.findById(req.params.id);
    if (image != null) {
      // Checks for user Authorization
      const userObj = await jwt.verify(req.cookies.token, "secretkey");
      // if the user is authorized to update the image data
      if (image.owner_id == userObj._id) {
        imageModel.updateMany(
          { _id: req.params.id },
          {
            $set: {
              name: req.body.name == null ? image.name : req.body.name,
              category:
                req.body.category == null ? image.category : req.body.category,
              productionCompany:
                req.body.productionCompany == null
                  ? image.productionCompany
                  : req.body.productionCompany,
              productionYear:
                req.body.productionYear == null
                  ? image.productionYear
                  : req.body.productionYear,
            },
          },
          (err, updatedResult) => {
            console.log("updatedResult", updatedResult);
            if (err) {
              return res.status(500).json({ errorMessage: err.message });
            } else if (updatedResult.nModified > 0) {
              return res
                .status(200)
                .json({ message: "The image is updated successfully" });
            } else if (updatedResult.nModified == 0 && updatedResult.ok == 1) {
              return res.status(500).json({
                message:
                  "The inserted image data are existed before, so no updating is done",
              });
            } else {
              return res.status(500).json({
                message:
                  "An error is occurred in during updating the image data !",
              });
            }
          }
        );
      } else {
        // The current user is not authorized
        return res.status(403).json({
          message: "Sorry, this user is not authorized to update this image",
        });
      }
    } else {
      return res.status(500).json({
        message: "This image is not founded in the db to be updated !",
      });
    }
  } catch (err) {
    return res.status(500).json({ errorMessage: err.message });
  }
});

// Delete an existed image + Authentication + Authorization (inside the function)
router.delete("/:id", authenticate, async (req, res) => {
  // search for it before being deleted
  try {
    image = await imageModel.findById(req.params.id);
    if (image != null) {
      // Checks the user authorization
      const userObj = await jwt.verify(req.cookies.token, "secretkey");
      // if the user is authorized to delete the image
      if (image.owner_id == userObj._id) {
        imageModel.deleteMany({ _id: req.params.id }, (err, deletedResult) => {
          if (err) {
            return res.status(500).json({ errorMessage: err.message });
          } else if (deletedResult.deletedCount > 0) {
            return res
              .status(200)
              .json({ message: "This image has been deleted successfully" });
          } else {
            return res
              .status(500)
              .json({ message: "Error on deleting the image" });
          }
        });
      } else {
        // The user is not authorized to delete the image
        return res.status(403).json({
          message: "Sorry, this user is not authorized to delete this image",
        });
      }
    } else {
      return res.status(500).json({
        message: "This image is not founded in the db to be deleted !",
      });
    }
  } catch (err) {
    return res.status(500).json({ errorMessage: err.message });
  }
});

// Create an authentication middleware for protecting the route
async function authenticate(req, res, next) {
  try {
    console.log("The req path / url is : ", req.url);
    if (req.cookies.token) {
      const userObj = await jwt.verify(req.cookies.token, "secretkey");
      console.log("The current user name ", userObj.username);
      console.log("The current user id ", userObj._id);
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Please you have to sign in firstly!" });
    }
  } catch (err) {
    res.status(500).json({ errorMessage: err.message });
  }
}

//----------------------------------
module.exports = router;
