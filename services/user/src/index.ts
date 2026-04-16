import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/user", userRoutes);
app.listen(process.env.PORT, () => {
    console.log(`User service is running on http://localhost:${process.env.PORT}`);
});
