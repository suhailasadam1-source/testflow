import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function StatCard({ label, value, className }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className={"stat-value " + (className || "")}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/tasks/stats")
      .then((res) => setStats(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load statistics")
      );
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p>Loading...</p>;

  const completion = stats.total
    ? Math.round((stats.byStatus.completed / stats.total) * 100)
    : 0;

  const priorities = [
    { label: "High", value: stats.byPriority.high, cls: "bar-high" },
    { label: "Medium", value: stats.byPriority.medium, cls: "bar-medium" },
    { label: "Low", value: stats.byPriority.low, cls: "bar-low" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user.name}</h1>
        <Link to="/tasks" className="btn">View tasks</Link>
      </div>

      <div className="stats-grid">
        <StatCard label="Total tasks" value={stats.total} />
        <StatCard label="To do" value={stats.byStatus.todo} />
        <StatCard label="In progress" value={stats.byStatus.inProgress} />
        <StatCard label="Completed" value={stats.byStatus.completed} className="success" />
        <StatCard label="Overdue" value={stats.overdue} className="danger" />
        <StatCard label="Due in 7 days" value={stats.dueSoon} />
      </div>

      <div className="panel">
        <h3>Progress</h3>
        <div className="progress">
          <div className="progress-fill" style={{ width: completion + "%" }} />
        </div>
        <p className="muted">{completion}% of your tasks are completed</p>
      </div>

      <div className="panel">
        <h3>Tasks by priority</h3>
        {priorities.map((p) => (
          <div className="bar-row" key={p.label}>
            <span className="bar-label">{p.label}</span>
            <div className="bar-track">
              <div
                className={"bar-fill " + p.cls}
                style={{
                  width: (stats.total ? (p.value / stats.total) * 100 : 0) + "%",
                }}
              />
            </div>
            <span className="bar-value">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}