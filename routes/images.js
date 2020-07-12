const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user");
const router = express.Router();
// -------------- Upload a file -----------------
var original_imageName = "";
var storage = multer.diskStorage({
  // specify the destination folder path
  destination: async function (req, file, callback) {
    userObj = await jwt.verify(req.cookies.token, "secretkey");
    console.log("userObj who access/owner of the folder", userObj);
    callback(null, path.join(__dirname, "..", "uploadedImages"));
  },
  // specify the file name after be uploaded
  filename: function (req, file, callback) {
    arr = file.originalname.split(".");
    imgExt = arr[arr.length - 1];
    original_imageName = global.imgCounter + "_" + 0 + "." + imgExt;
    console.log("original_imageName", original_imageName);
    callback(null, original_imageName);
  },
});
// Returns middleware that processes a the selected file from the form which its field name the file form element field name.
// fileFormField : is the file field name of the form
var upload = multer({ storage: storage }).single("fileFormField");
// -------------- Routes ----------------------
function checkAuthentication(req, res, next) {
  if (req.cookies.token) {
    next();
  } else {
    res.send("No authenticated user is logined");
  }
}

router.get("/uploadImage", checkAuthentication, (req, res) => {
  res.render("uploadImage");
});

router.post("/uploadImage", checkAuthentication, (req, res) => {
  // receive the ajax submit sending when the file form button is clicked
  upload(req, res, async (err) => {
    // the ajax response (error)
    if (err) {
      return res.end("Error occurred during uploading the image file !");
    }
    // Begins working with sharp process to process the uploaded image file
    try {
      // path of the original one
      const original_img_path = path.join(
        __dirname,
        "..",
        "uploadedImages",
        userObj._id,
        original_imageName
      );

      // apply sharp process on the original image to produce a buffer for the image 1
      const img1Buffer = await sharp(original_img_path)
        .resize(500, 500)
        .toBuffer();

      const img_1_path = path.join(
        __dirname,
        "..",
        "uploadedImages",
        userObj._id,
        global.imgCounter + "_" + 1 + "." + imgExt
      );
      // Create an image with the image 6 buffer on the specified path
      fs.writeFileSync(img_1_path, img1Buffer);

      // apply sharp process on the original image to produce a buffer for the image 2
      const img2Buffer = await sharp(img1Buffer).blur().toBuffer();

      const img_2_path = path.join(
        __dirname,
        "..",
        "uploadedImages",
        userObj._id,
        global.imgCounter + "_" + 2 + "." + imgExt
      );
      // Create an image with the image 2 buffer on the specified path
      fs.writeFileSync(img_2_path, img2Buffer);

      // apply sharp process on the original image to produce a buffer for the image 3
      const img3Buffer = await sharp(img1Buffer).greyscale().toBuffer();

      const img_3_path = path.join(
        __dirname,
        "..",
        "uploadedImages",
        userObj._id,
        global.imgCounter + "_" + 3 + "." + imgExt
      );
      // Create an image with the image 3 buffer on the specified path
      fs.writeFileSync(img_3_path, img3Buffer);

      // apply sharp process on the original image to produce a buffer for the image 4
      const img4Buffer = await sharp(img1Buffer).sharpen().toBuffer();

      const img_4_path = path.join(
        __dirname,
        "..",
        "uploadedImages",
        userObj._id,
        global.imgCounter + "_" + 4 + "." + imgExt
      );
      // Create an image with the image 4 buffer on the specified path
      fs.writeFileSync(img_4_path, img4Buffer);

      // apply sharp process on the original image to produce a buffer for the image 5
      const img5Buffer = await sharp(img1Buffer).rotate(180).toBuffer();

      const img_5_path = path.join(
        __dirname,
        "..",
        "uploadedImages",
        userObj._id,
        global.imgCounter + "_" + 5 + "." + imgExt
      );
      // Create an image with the image 5 buffer on the specified path
      fs.writeFileSync(img_5_path, img5Buffer);

      // apply sharp process on the original image to produce a buffer for the image 6
      const img6Buffer = await sharp(img1Buffer).resize(250, 250).toBuffer();

      const img_6_path = path.join(
        __dirname,
        "..",
        "uploadedImages",
        userObj._id,
        global.imgCounter + "_" + 6 + "." + imgExt
      );
      // Create an image with the image 6 buffer on the specified path
      fs.writeFileSync(img_6_path, img6Buffer);

      // update the img counter for the user
      updatedResult = await userModel.updateOne(
        { _id: userObj._id },
        { $inc: { imgCounter: +1 } }
      );
      global.imgCounter += 1;
      console.log("updatedResult.nModified", updatedResult.nModified);
      console.log("updatedResult.ok", updatedResult.ok);
      // the ajax response (success)
      res.end("Image file has been uploaded successfully.");
    } catch (error) {
      console.error("error : ", error.message);
    }
  });
});

router.get("/", checkAuthentication, async (req, res) => {
  const imagesDirectory = await fs.opendirSync(
    path.join(__dirname, "..", "uploadedImages", userObj._id)
  );
  var imgPathArr = [];
  for await (const imageFile of imagesDirectory) {
    imgPathArr.push(imageFile.name);
  }
  console.log("All images are: ", imgPathArr);
  res.render("images", { imgPathArr: imgPathArr });
});

router.get("/info", async (req, res) => {
  const imagesDirectory = await fs.opendirSync(
    path.join(__dirname, "..", "uploadedImages", userObj._id)
  );
  var i = 0; // img index [1:7]
  var output = "<h2><u>The uploaded images details</u></h2>";
  for await (const imageFile of imagesDirectory) {
    output += "<h3>" + ++i + " : " + imageFile.name + "</h3>";
    console.log(i + " : " + imageFile.name);
  }
  if (i > 0) {
    output += "<hr>";
    output +=
      "<h1> <u>The total uploaded images number is : </u>" + i / 7 + "</h1>";
    output +=
      '<h3> <a href="/images/uploadImage"> Return to upload an image</a> </h3>';
    res.send(output);
  } else {
    res.send(
      '<h1>No images are uploaded yet !</h1><h3> <a href="/images/uploadImage"> Return to upload an image</a> </h3>'
    );
  }
});
//-----------------------------------------------------
module.exports = router;
