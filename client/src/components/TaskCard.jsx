const statusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  completed: "Completed",
};

export default function TaskCard({ task, onEdit, onDelete }) {
  const overdue =
    task.deadline &&
    task.status !== "completed" &&
    new Date(task.deadline) < new Date();

  return (
    <div className="task-card">
      <div className="task-top">
        <h3>{task.title}</h3>
        <span className={"badge priority-" + task.priority}>{task.priority}</span>
      </div>

      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-meta">
        <span className={"badge status-" + task.status}>
          {statusLabels[task.status]}
        </span>
        {task.deadline && (
          <span className={overdue ? "due overdue" : "due"}>
            Due: {new Date(task.deadline).toLocaleDateString(undefined, { timeZone: "UTC" })}
          </span>
        )}
      </div>

      <div className="task-actions">
        <button className="btn-small" onClick={() => onEdit(task)}>Edit</button>
        <button className="btn-small btn-danger" onClick={() => onDelete(task._id)}>
          Delete
        </button>
      </div>
    </div>
  );
}