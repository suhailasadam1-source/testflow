import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, LayoutGrid, List } from "lucide-react";
import api from "../services/api";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import Board from "../components/Board";
import ProjectBar from "../components/ProjectBar";
import { useProjects } from "../context/ProjectContext";

const statusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  completed: "Completed",
};

export default function Tasks() {
  const { selectedProject, refreshProjects } = useProjects();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [view, setView] = useState(localStorage.getItem("view") || "board");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    sort: "newest",
    overdue: false,
  });

  const hasFilters =
    filters.search || filters.status || filters.priority || filters.overdue;

  const fetchTasks = useCallback(async () => {
    try {
      const params = {
        project: selectedProject,
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
        sort: filters.sort,
        overdue: filters.overdue ? "true" : "",
      };
      const { data } = await api.get("/tasks", { params });
      setTasks(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, [filters, selectedProject]);

  useEffect(() => {
    const timer = setTimeout(fetchTasks, 300);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  const changeView = (next) => {
    setView(next);
    localStorage.setItem("view", next);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "", priority: "", sort: "newest", overdue: false });
  };

  const openCreate = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleSave = async (formData) => {
    if (editingTask) {
      await api.put("/tasks/" + editingTask._id, formData);
      toast.success("Task updated");
    } else {
      await api.post("/tasks", formData);
      toast.success("Task created");
    }
    closeForm();
    fetchTasks();
    refreshProjects();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete("/tasks/" + id);
      setTasks(tasks.filter((t) => t._id !== id));
      toast.success("Task deleted");
      refreshProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete task");
    }
  };

  const handleMove = async (task, status) => {
    const previous = tasks;
    setTasks(tasks.map((t) => (t._id === task._id ? { ...t, status } : t)));
    try {
      await api.put("/tasks/" + task._id, { status });
      toast.success(task.title + " moved to " + statusLabels[status]);
    } catch (err) {
      setTasks(previous);
      toast.error(err.response?.data?.message || "Could not move the task");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Tasks</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={view === "board" ? "active" : ""}
              onClick={() => changeView("board")}
            >
              <LayoutGrid size={16} /> Board
            </button>
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => changeView("list")}
            >
              <List size={16} /> List
            </button>
          </div>
          <button className="btn" onClick={openCreate}>+ New Task</button>
        </div>
      </div>
      <ProjectBar />

      <div className="filter-bar">
        <input
          type="text"
          name="search"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={handleFilterChange}
        />
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select name="priority" value={filters.priority} onChange={handleFilterChange}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select name="sort" value={filters.sort} onChange={handleFilterChange}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="deadline">By deadline</option>
        </select>
        {hasFilters && (
          <button className="btn btn-light" onClick={clearFilters}>Clear</button>
        )}
      </div>

      <div className="chips">
        <button
          className={"chip" + (filters.priority === "high" ? " active" : "")}
          onClick={() =>
            setFilters({
              ...filters,
              priority: filters.priority === "high" ? "" : "high",
            })
          }
        >
          High priority
        </button>
        <button
          className={"chip" + (filters.overdue ? " active" : "")}
          onClick={() => setFilters({ ...filters, overdue: !filters.overdue })}
        >
          Overdue
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <div className="task-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="task-card skeleton" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>{hasFilters ? "No tasks match your filters" : "No tasks yet"}</h3>
          <p>
            {hasFilters
              ? "Try changing or clearing the filters."
              : "Click + New Task to create your first one."}
          </p>
        </div>
      ) : view === "board" ? (
        <Board
          tasks={tasks}
          onMove={handleMove}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="task-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <TaskForm task={editingTask} onSave={handleSave} onClose={closeForm} />
      )}
    </div>
  );
}