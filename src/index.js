// require('dotenv').config({path:'./env'})
// Importing required modules
import express from 'express';


import { app } from "./app.js";
//const app = express();
import dotenv from "dotenv"
import connetDB from "./db/index.js";
dotenv.config({
     path: './.env' // where the.env file is located
 })
connetDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`server is running at ${process.env.PORT}`);
            
        })
    })
    .catch((error)=> {
    console.log("MongoDB Connection fail",error);
    
})







/* First Apporach

import express from "express";
const app=express();
//Comment:this is a ifi statement to directly connect monogoDB data base
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        // listners error event
        app.on("error", (error) => {
            console.log("Unable to talk", error);
            throw error
            
        })
        app.listen(process.env.PORT, () => {
            console.log(`app listening on ${process.env.PORT}`);     
        })
    }
    catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
})()
*/