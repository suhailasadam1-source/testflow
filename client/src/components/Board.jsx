import { useState } from "react";
import { Calendar, Pencil, Trash2 } from "lucide-react";

const columns = [
  { key: "todo", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function Board({ tasks, onMove, onEdit, onDelete }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState("");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const handleDrop = (status) => {
    const task = tasks.find((t) => t._id === dragId);
    if (task && task.status !== status) onMove(task, status);
    setDragId(null);
    setOverCol("");
  };

  return (
    <div className="board">
      {columns.map((col) => {
        const items = tasks.filter((t) => t.status === col.key);
        return (
          <div
            key={col.key}
            className={"board-col" + (overCol === col.key ? " over" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.key);
            }}
            onDragLeave={() => setOverCol("")}
            onDrop={() => handleDrop(col.key)}
          >
            <div className="board-col-head">
              <span>{col.label}</span>
              <span className="count">{items.length}</span>
            </div>

            {items.map((task) => {
              const overdue =
                task.deadline &&
                task.status !== "completed" &&
                new Date(task.deadline) < today;
              return (
                <div
                  key={task._id}
                  className={"board-card" + (dragId === task._id ? " dragging" : "")}
                  draggable
                  onDragStart={() => setDragId(task._id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol("");
                  }}
                >
                  <p className="board-title">{task.title}</p>
                  <span className={"badge priority-" + task.priority}>
                    {task.priority}
                  </span>
                  {task.deadline && (
                    <p className={overdue ? "due overdue" : "due"}>
                      <Calendar size={14} />
                      {new Date(task.deadline).toLocaleDateString(undefined, {
                        timeZone: "UTC",
                      })}
                    </p>
                  )}
                  <select
                    value={task.status}
                    onChange={(e) => onMove(task, e.target.value)}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="task-actions">
                    <button className="btn-small" onClick={() => onEdit(task)}>
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn-small btn-danger"
                      onClick={() => onDelete(task._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {items.length === 0 && <p className="board-empty">Drop tasks here</p>}
          </div>
        );
      })}
    </div>
  );
}