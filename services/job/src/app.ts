import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jobRoutes from "./routes/job.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/job", jobRoutes);

export default app;
