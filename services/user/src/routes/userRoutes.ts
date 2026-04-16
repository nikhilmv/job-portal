import express from "express";
import { myProfile, getUserProfile, updateUserProfile, updateProfilePic, addSkillToUser } from "../controllers/userController.js";
import { isAuth } from "../middlewares/auth.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.get("/me", isAuth, myProfile);
router.get("/:userId", isAuth, getUserProfile);
router.put("/update/profile", isAuth, updateUserProfile);
router.put("/update/pic", isAuth, uploadFile, updateProfilePic);
router.post("/skill/add", isAuth, addSkillToUser);

export default router;