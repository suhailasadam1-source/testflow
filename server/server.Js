import express from "express";
import cors from "cors"
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskroutes.js";
dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });
connectDB();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.get("/", (req, res) => {
    res.json({ message: "Taskflow API is running" });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
