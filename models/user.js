var mongoose = require("mongoose");
usersSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  imgCounter: { type: Number, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});
module.exports = mongoose.model("users", usersSchema);
