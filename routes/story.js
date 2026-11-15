const mongoose = require('mongoose');

const storySchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    datecreated: {
        type: Date,
        default: Date.now,
        expires: 600  //1min * 10 = 60*10
    },
    description: String,
    storyImage: String
});

module.exports = mongoose.model("story", storySchema);
