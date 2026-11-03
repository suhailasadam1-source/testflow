import { Calendar, Flag, Pencil, Trash2 } from "lucide-react";

const statusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  completed: "Completed",
};

export default function TaskCard({ task, onEdit, onDelete }) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const overdue =
    task.deadline &&
    task.status !== "completed" &&
    new Date(task.deadline) < today;

  return (
    <div className={"task-card priority-border-" + task.priority}>
      <div className="task-top">
        <h3>{task.title}</h3>
        <span className={"badge priority-" + task.priority}>
          <Flag size={12} /> {task.priority}
        </span>
      </div>

      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-meta">
        <span className={"badge status-" + task.status}>
          {statusLabels[task.status]}
        </span>
        {task.deadline && (
          <span className={overdue ? "due overdue" : "due"}>
            <Calendar size={14} />
            {new Date(task.deadline).toLocaleDateString(undefined, {
              timeZone: "UTC",
            })}
            {overdue ? " (overdue)" : ""}
          </span>
        )}
      </div>

      <div className="task-actions">
        <button className="btn-small" onClick={() => onEdit(task)}>
          <Pencil size={14} /> Edit
        </button>
        <button className="btn-small btn-danger" onClick={() => onDelete(task._id)}>
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}