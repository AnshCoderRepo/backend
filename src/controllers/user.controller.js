import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// generate access and refresh tokens function  as it will be always use
const gennerateAccessAndRefreshTokens = async (userId)=> {
    try {
        const user = await User.findById(userId)
        const accessToken = user.gennerateAccessToken() 
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
    if (!email && !username) {
        throw new ApiError(400, "Username or email is required")
    }
    const user = await User.findOne({
        $or: [{ email }, { username }]// finds value either mail or username
    });
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password")
    }
    const { accessToken, refreshToken } = await gennerateAccessAndRefreshTokens(user._id)
    // optional step to update the user from  database
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
                user: loggedinUSer, accessToken,refreshToken
            },"User looged in Successfully"))

});

//logout user
const logoutUser = asyncHandler(async (req, res) => { 
    await User.findByIdAndUpdate(
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

// refresh access token

const refreshAccessToken = asyncHandler(async (req, res) => { 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorized request")
    }
    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure:true
        }
       const {accessToken,newRefeshToken}= await gennerateAccessAndRefreshTokens(user._id)
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefeshToken, options)
            .json(
                new ApiResponse(200, {accessToken,refreshToken:newRefeshToken}, "Access token refreshed successfully")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
    
})

const changeCurrentPassword = asyncHandler(async (req, res) => { 
    const { oldPassword, newPassword } = req.body
    
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully")
    )

})

const getCurrentUser = asyncHandler(async (req, res) => { 
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current User fetched successfully")
    )
})

const updateAccoutDetails = asyncHandler(async (req, res) => { 
    const { fullName, email } = req.body

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user=User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true,
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User Account details updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => { 
    const avatarLocalPath = req.file?.path
    // image directly to database
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required/ missing")
    }
    // upload on cloudinary server
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar on cloud")
    }
    // update user avatar in database
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar?.url 
            }
        },
        {
            new: true
        }
    ).select("-password")
    return res
        .status(200)
        .json(new ApiResponse(200, user, "User Avatar updated successfully"))
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    // image directly to database
    if (!avatarLocalPath) {
        throw new ApiError(400, "Cover Image file is required/ missing")
    }
    // upload on cloudinary server
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage) {
        throw new ApiError(400, "Failed to upload avatar on cloud")
    }
    // update user avatar in database
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage:coverImage?.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User Cover Image updated successfully")
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccoutDetails,
    updateUserAvatar,
    updateUserCoverImage
} 
