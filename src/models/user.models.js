import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index:true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // using cloudinary url 
        required: true
    },
    coverImage: {
        type: String // using cloudinary url 
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    password: {
        type: String,
        required: [true,'password is required']
    },
    refreshToken: {
        type: String
    }

},{timestamps:true})


// password encryption
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = bcrypt.hash(this.password, 10)
    next()
})

// checking password to be correct 
userSchema.methods.isPasswordCorrect = async  function (password) {
   return await bcrypt.compare(password, this.password)
}

userSchema.methods.gennerateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
        process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
 }
userSchema.methods.gennerateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    },
        process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}
export const User= mongoose.model("User",userSchema)