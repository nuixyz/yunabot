const mongoose = require("mongoose");

const stickerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  addedBy: { type: String, required: true },
});

module.exports = mongoose.model("Sticker", stickerSchema);
