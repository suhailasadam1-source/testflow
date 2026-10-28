import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    sort: "newest",
    overdue: false,
  });

  const hasFilters =
    filters.search || filters.status || filters.priority || filters.overdue;

  const fetchTasks = useCallback(async (signal) => {
    try {
      const params = {
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
        sort: filters.sort,
        overdue: filters.overdue ? "true" : "",
      };
      const { data } = await api.get("/tasks", { params, signal });
      if (signal?.aborted) return;
      setTasks(data);
      setError("");
    } catch (err) {
      if (!signal?.aborted) {
        setError(err.response?.data?.message || "Could not load tasks");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => fetchTasks(controller.signal), 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetchTasks]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({ ...filters, [name]: type === "checkbox" ? checked : value });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      priority: "",
      sort: "newest",
      overdue: false,
    });
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
    } else {
      await api.post("/tasks", formData);
    }
    closeForm();
    fetchTasks();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete("/tasks/" + id);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete task");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Tasks</h1>
        <button className="btn" onClick={openCreate}>+ New Task</button>
      </div>

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
        <label className="check">
          <input
            type="checkbox"
            name="overdue"
            checked={filters.overdue}
            onChange={handleFilterChange}
          />
          Overdue only
        </label>
        {hasFilters && (
          <button className="btn btn-light" onClick={clearFilters}>Clear</button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="empty">
          {hasFilters
            ? "No tasks match your filters."
            : "No tasks yet. Create your first one!"}
        </p>
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