const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    verified: { type: Boolean },
    otp: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Users", UserSchema);
