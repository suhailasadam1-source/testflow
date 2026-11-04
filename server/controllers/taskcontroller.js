import Task from "../models/Task.js";
import Project from "../models/project.js";

const startOfToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const ownsProject = async (projectId, userId) => {
  if (!projectId) return true;
  const found = await Project.findOne({ _id: projectId, user: userId });
  return Boolean(found);
};

// GET /api/tasks?search=&status=&priority=&overdue=&sort=&project=
export const getTasks = async (req, res) => {
  try {
    const { search, status, priority, overdue, sort, project } = req.query;
    const query = { user: req.user._id };

    if (project === "none") query.project = null;
    else if (project) query.project = project;

    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { title: { $regex: safe, $options: "i" } },
        { description: { $regex: safe, $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (overdue === "true") {
      query.deadline = { $lt: startOfToday() };
      query.status = { $ne: "completed" };
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      deadline: { deadline: 1 },
    };

    const tasks = await Task.find(query).sort(
      sortOptions[sort] || sortOptions.newest
    );

    if (sort === "deadline") {
      tasks.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline - b.deadline;
      });
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, deadline, project } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!(await ownsProject(project, req.user._id))) {
      return res.status(400).json({ message: "Invalid project" });
    }

    const task = await Task.create({
      user: req.user._id,
      project: project || null,
      title,
      description,
      status,
      priority,
      deadline,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { title, description, status, priority, deadline, project } = req.body;

    if (project !== undefined) {
      if (!(await ownsProject(project, req.user._id))) {
        return res.status(400).json({ message: "Invalid project" });
      }
      task.project = project || null;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;

    const updated = await task.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/tasks/stats?project=
export const getTaskStats = async (req, res) => {
  try {
    const { project } = req.query;
    const base = { user: req.user._id };
    if (project === "none") base.project = null;
    else if (project) base.project = project;

    const today = startOfToday();
    const nextWeek = new Date(today);
    nextWeek.setUTCDate(today.getUTCDate() + 7);

    const count = (extra) => Task.countDocuments({ ...base, ...extra });

    const [total, todo, inProgress, completed, low, medium, high, overdue, dueSoon] =
      await Promise.all([
        count({}),
        count({ status: "todo" }),
        count({ status: "in-progress" }),
        count({ status: "completed" }),
        count({ priority: "low" }),
        count({ priority: "medium" }),
        count({ priority: "high" }),
        count({ status: { $ne: "completed" }, deadline: { $lt: today } }),
        count({
          status: { $ne: "completed" },
          deadline: { $gte: today, $lte: nextWeek },
        }),
      ]);

    res.json({
      total,
      byStatus: { todo, inProgress, completed },
      byPriority: { low, medium, high },
      overdue,
      dueSoon,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};