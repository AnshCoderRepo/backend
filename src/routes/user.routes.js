import { Router } from "express";
import { loginUser ,registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"; 
import { veriyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

// Additional routes can be added here...
router.route("/login").post(loginUser)

// Securedroutes
router.route("/logout").post(veriyJWT, logoutUser)


export default router