import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// CLOUDINARY CONFIG SETTING
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECERT // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file in cloudinary

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })
        // file has been uploaded successfully
        console.log("file uploaded successfully on cloudinary", response.url);
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath) //  remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}
// clouudinary.v2.uploader.upload("",
//     { public_id: "" },
//     function (error, result) { console.log(result) })

export {uploadOnCloudinary}