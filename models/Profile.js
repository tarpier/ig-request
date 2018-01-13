const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
  updated: { type: Date, default: Date.now },
  id: String,
  fullName: String,
  userName: String,
  follows: Number,
  followedBy: Number,
  bio: String,
  totalMedia: Number,
  amount: Number,
  like: Number,
  comments: Number,
  media: []
});

module.exports = mongoose.model("Profile", ProfileSchema);
