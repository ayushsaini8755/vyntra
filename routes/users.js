const mongoose = require('mongoose');
const story = require('./story');
const plm = require("passport-local-mongoose").default || require("passport-local-mongoose");
require("dotenv").config();
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch(err => console.log(err));

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  profileImage: String,
  bio: String,
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post"
    }
  ],
  stories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "story"
    }
  ]
});

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);