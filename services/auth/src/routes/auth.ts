import express from "express";
import { register, loginUser } from "../controllers/auth.js";
import uploadFile from "../middleware/multer.js";


const router = express.Router();

router.post("/register", uploadFile, register)
router.post("/login", loginUser);
export default router;
