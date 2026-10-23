import Task from "../models/Task.js";
// GET /api/tasks?search=&status=&priority=&overdue=&sort=
export const getTasks = async (req, res) => {
  try {
    const { search, status, priority, overdue, sort } = req.query;  
    const query = { user: req.user._id };

    // Search in title and description (case-insensitive)
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { title: { $regex: safe, $options: "i" } },
        { description: { $regex: safe, $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Only tasks past their deadline and not completed
    if (overdue === "true") {
      query.deadline = { $lt: new Date() };
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
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET /api/tasks/stats
export const getTaskStats = async (req, res) => {
  try {
    const user = req.user._id;
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const [total, todo, inProgress, completed, low, medium, high, overdue, dueSoon] =
      await Promise.all([
        Task.countDocuments({ user }),
        Task.countDocuments({ user, status: "todo" }),
        Task.countDocuments({ user, status: "in-progress" }),
        Task.countDocuments({ user, status: "completed" }),
        Task.countDocuments({ user, priority: "low" }),
        Task.countDocuments({ user, priority: "medium" }),
        Task.countDocuments({ user, priority: "high" }),
        Task.countDocuments({
          user,
          status: { $ne: "completed" },
          deadline: { $lt: now },
        }),
        Task.countDocuments({
          user,
          status: { $ne: "completed" },
          deadline: { $gte: now, $lte: nextWeek },
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
// POST /api/tasks  → create a task
export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, deadline } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await Task.create({
      user: req.user._id,
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

// PUT /api/tasks/:id  → update a task
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { title, description, status, priority, deadline } = req.body;
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

// DELETE /api/tasks/:id  → delete a task
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