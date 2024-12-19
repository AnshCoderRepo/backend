import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connetDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n Mongoose Connect!! DB: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        process.exit(1);
    }
}

export default connetDB