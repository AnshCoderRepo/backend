import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
//accepting json file- filling form
app.use(express.json({ limit: "20kb" }));

// url data configuration

app.use(express.urlencoded({ extended: true, limt: "20kb" }));

// to process public file
app.use(express.static("public"))

// cookie parser to perform  CRUD operations on cookies

app.use(cookieParser());

// routes import 
import userRouter from './routes/user.routes.js';

// routes declaration
app.use("/api/v1/users", userRouter);



export {app}