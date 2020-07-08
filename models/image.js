const mongoose = require("mongoose");
imagesSchema = new mongoose.Schema({
  owner_id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  productionCompany: { type: String, required: true },
  productionYear: { type: Number, required: true },
});
module.exports = mongoose.model("images", imagesSchema);
