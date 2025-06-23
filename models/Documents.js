const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  text: String,
  matches: Array,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Document", documentSchema);
