import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend  { can get data from postman for verification}
    // validation checks empty fields, email format, password length, etc,
    // check if user already exists in database - can be checked from email and username
    // for images a, check for avatar
    // upload them to cloudinary server,check avatar
    // create user object - create entry call in DB
    // remove password and refresh token feild from response
    // check for response / user creation 
    // send response back to frontend
    
    const { fullName, username, email, password } = req.body
    if ([fullName, username, email, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, 'All fields are required') 
    }
    // find user name matching email
    const existedUser = await User.findOne({ 
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(400, 'User already exists')
    }
    // Safely access the file path of the uploaded avatar from the request object.
    // req.files may contain the uploaded files, and "avatar" is the key used to upload the file.
    // The optional chaining (?.) ensures the code doesn't throw an error if "files" or "avatar" is undefined.
    // [0]?.path retrieves the path of the first file in case multiple files were uploaded.
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload avatar on cloudinary server
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    
    // upload cover image on cloudinary server
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // check for avatar
    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar")
    }
    // create user object and store in DB
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url ,
        coverImage: coverImage?.url || ""
    })
    // remove password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Failed to create user")
    }
    // throw response if user is created

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )
})

export { registerUser } 
