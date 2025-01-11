import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// generate access and refresh tokens function  as it will be always use
const gennerateAccessAndRefreshTokens = async (userId)=> {
    try {
        const user = await User.findById(userId)
        const accessToken=user.gennerateAccessToken()
        const refreshToken = user.gennerateRefreshToken()
        user.refreshToken = refreshToken // adding values to the obejct
        await user.save({ validateBeforeSave: false }) // save the object
        return { accessToken, refreshToken }
        
    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens")
    }
 }


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
        field?.trim() == "")
    ) {
        throw new ApiError(400, 'All fields are required') 
    }
    // find user name matching email
    const existedUser = await User.findOne({ 
        $or: [{ email }, { username }]
    })
    if (existedUser) {
        throw new ApiError(400, 'User already exists')
    }
    // Safely access the file path of the uploaded avatar from the request object.
    // req.files may contain the uploaded files, and "avatar" is the key used to upload the file.
    // The optional chaining (?.) ensures the code doesn't throw an error if "files" or "avatar" is undefined.
    // [0]?.path retrieves the path of the first file in case multiple files were uploaded.
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar  file is required")
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
        avatar: avatar?.url || "",
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
// login user code
const loginUser = asyncHandler(async (req, res) => {
    // req body-> data from frontend
    // check for empty fields
    // usermail or username
    // find the user 
    // check if user exists
    // check if password is correct
    // generate access token and refresh token and give to user
    // send response back cookies
    const { email, password, username } = req.body
    if (!email || !username) {
        throw new ApiError(404, 'Username or email is required')
    }
    const user = await User.findOne({
        $or: [{ email }, { username }]// finds value either mail or username
    });
    if (!user) {
        throw new ApiError(404, 'User not found')
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(400, 'Invalid password')
    }
    const { accessToken, refreshToken } = await gennerateAccessAndRefreshTokens(user._id)
    // optional step to updaet the user from  database
    const loggedinUSer = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure:true
    }
    return res
        .status(200)
        .cookie("accesToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json( // returna json object as response
            new ApiResponse(200, {
                user: accessToken,refreshToken,loggedinUSer
            },"User looged in Successfully"))

});

//logout user
const logoutUSer = asyncHandler(async (req, res) => { 
    awiat User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly: true,
        secure:true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
})
export { registerUser, loginUser ,logoutUSer} 
