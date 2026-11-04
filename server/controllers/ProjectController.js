import Project from "../models/project.js";
import Task from "../models/Task.js";

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    const counts = await Task.aggregate([
      { $match: { user: req.user._id, project: { $ne: null } } },
      {
        $group: {
          _id: "$project",
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
    ]);

    const map = {};
    counts.forEach((c) => {
      map[c._id.toString()] = c;
    });

    const result = projects.map((p) => {
      const c = map[p._id.toString()];
      return {
        ...p.toObject(),
        taskCount: c ? c.total : 0,
        doneCount: c ? c.done : 0,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }
    const project = await Project.create({
      user: req.user._id,
      name,
      description,
      color,
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { name, description, color } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (color !== undefined) project.color = color;

    res.json(await project.save());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    await Task.deleteMany({ project: project._id, user: req.user._id });
    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};