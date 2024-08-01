const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passport_local_mongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,

        // https://mongoosejs.com/docs/validation.html#the-unique-option-is-not-a-validator
        // This will cause MongoDB to throw an error for duplicate emails, which
        // will then get caught and thrown again by Mongoose.
        unique: true
    }
});

// This adds a username property (which will be unique and will cause Passport
// to throw an error for duplicate usernames) and a password property (to store
// the hashed password), along with adding various static methods, to the
// schema.
UserSchema.plugin(passport_local_mongoose);

module.exports = mongoose.model("User", UserSchema);
