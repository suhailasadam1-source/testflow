import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
} from "../controllers/taskcontroller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // every task route requires login
router.get("/stats", getTaskStats);
router.route("/").get(getTasks).post(createTask);
router.route("/:id").put(updateTask).delete(deleteTask);

export default router;