const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user");
const router = express.Router();
// -------------- Upload a file -----------------
var userImgDir = "";
var original_imageName = "";
var timeNow; // get time now in millisecond
var storage = multer.diskStorage({
  // specify the destination folder path
  destination: function (req, file, callback) {
    userImgDir = path.join(
      __dirname,
      "..",
      "uploadedImages",
      req.app.locals.user._id
    );
    console.log("user Obj who access/owner of the folder", userImgDir);
    callback(null, userImgDir);
  },
  // specify the file name after be uploaded to be created in the directory created above
  filename: function (req, file, callback) {
    timeNow = new Date().getTime();
    arr = file.originalname.split(".");
    imgExt = arr[arr.length - 1].toLowerCase();
    original_imageName = timeNow + "_" + 0 + "." + imgExt;
    console.log("original_imageName", original_imageName);
    callback(null, original_imageName);
  },
});
// Returns middleware that processes a the selected file from the form which its field name the file form element field name.
// fileFormField : is the file field name of the form
// Instantiate the multer middle ware to provide the mechanism for uploading the files with diff format
var upload = multer({ storage: storage }).single("fileFormField");
// -------------- Routes ----------------------

function authentication(req, res, next) {
  if (req.app.locals.user) {
    userImgDir = path.join(
      __dirname,
      "..",
      "uploadedImages",
      req.app.locals.user._id
    );
    next();
  } else {
    req.flash("danger", "Sorry, you must login firstly !");
    res.redirect("/users/login");
  }
}

router.get("/", authentication, async (req, res) => {
  const userImgDirectory = fs.opendirSync(userImgDir);
  var imgPathArr = [];
  for await (const imageFile of userImgDirectory) {
    imgPathArr.push(imageFile.name);
  }
  console.log(
    imgPathArr.length > 0
      ? `There are ${imgPathArr.length} images in your profile`
      : `Your image profile is empty`
  );
  console.log("imgPathArr before sorting", imgPathArr);
  imgPathArr.sort();
  console.log("imgPathArr after sorting", imgPathArr);
  res.render("images", { imgPathArr: imgPathArr });
});

router.get("/uploadImage", (req, res) => {
  res.render("uploadImage");
});

router.post("/uploadImage", authentication, (req, res) => {
  // receive the ajax submit sending when the file form button is clicked
  upload(req, res, async (err) => {
    // Begins working with sharp process to process the uploaded image file
    try {
      // path of the original one
      const original_img_path = path.join(userImgDir, original_imageName);

      // apply sharp process on the original image to produce a buffer for the image 1
      const img1Buffer = await sharp(original_img_path)
        .resize(500, 500)
        .toBuffer();

      const img_1_path = path.join(
        userImgDir,
        timeNow + "_" + 1 + "." + imgExt
      );
      // Create an image with the image 6 buffer on the specified path
      fs.writeFileSync(img_1_path, img1Buffer);

      // apply sharp process on the original image to produce a buffer for the image 2
      const img2Buffer = await sharp(img1Buffer).blur().toBuffer();

      const img_2_path = path.join(
        userImgDir,
        timeNow + "_" + 2 + "." + imgExt
      );
      // Create an image with the image 2 buffer on the specified path
      fs.writeFileSync(img_2_path, img2Buffer);

      // apply sharp process on the original image to produce a buffer for the image 3
      const img3Buffer = await sharp(img1Buffer).greyscale().toBuffer();

      const img_3_path = path.join(
        userImgDir,
        timeNow + "_" + 3 + "." + imgExt
      );
      // Create an image with the image 3 buffer on the specified path
      fs.writeFileSync(img_3_path, img3Buffer);

      // apply sharp process on the original image to produce a buffer for the image 4
      const img4Buffer = await sharp(img1Buffer).sharpen().toBuffer();

      const img_4_path = path.join(
        userImgDir,
        timeNow + "_" + 4 + "." + imgExt
      );
      // Create an image with the image 4 buffer on the specified path
      fs.writeFileSync(img_4_path, img4Buffer);

      // apply sharp process on the original image to produce a buffer for the image 5
      const img5Buffer = await sharp(img1Buffer).rotate(180).toBuffer();

      const img_5_path = path.join(
        userImgDir,
        timeNow + "_" + 5 + "." + imgExt
      );
      // Create an image with the image 5 buffer on the specified path
      fs.writeFileSync(img_5_path, img5Buffer);

      // the ajax response (success)
      res.end("The image file has been uploaded and processed successfully.");
    } catch (error) {
      // the ajax response (error)
      console.error("Error during uploading the image ! : >> ", error.message);
      return res.end(
        "Error during uploading the image ! : error >> " + error.message
      );
    }
  });
});

router.get("/delete/:id/:imgTime", authentication, async (req, res) => {
  if (req.app.locals.user._id == req.params.id) {
    img2BeDelete_0 = path.join(userImgDir, req.params.imgTime);
    img2BeDelete_1 = img2BeDelete_0.replace("_0", "_1");
    img2BeDelete_2 = img2BeDelete_0.replace("_0", "_2");
    img2BeDelete_3 = img2BeDelete_0.replace("_0", "_3");
    img2BeDelete_4 = img2BeDelete_0.replace("_0", "_4");
    img2BeDelete_5 = img2BeDelete_0.replace("_0", "_5");
    fs.unlinkSync(img2BeDelete_0);
    fs.unlinkSync(img2BeDelete_1);
    fs.unlinkSync(img2BeDelete_2);
    fs.unlinkSync(img2BeDelete_3);
    fs.unlinkSync(img2BeDelete_4);
    fs.unlinkSync(img2BeDelete_5);
    res.redirect("/images/");
  } else {
    res.clearCookie("token");
    req.flash("danger", "This user is not authorized to delete this image");
    req.flash("danger", "An automatic logout is done");
    res.redirect("/users/login");
  }
});

router.get("/info", authentication, async (req, res) => {
  const userImgDirectory = await fs.opendirSync(
    path.join(__dirname, "..", "uploadedImages", userObj._id)
  );
  var i = 0; // img index [1:6]
  var output = "<h2><u>The uploaded images details</u></h2>";
  for await (const imageFile of userImgDirectory) {
    i += 1;
    output += "<h3>" + i + " : " + imageFile.name + "</h3>";
    console.log(i + " : " + imageFile.name);
  }
  if (i > 0) {
    output += "<hr>";
    output +=
      "<h1> <u>The total uploaded images number is : </u>" + i / 6 + "</h1>";
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
