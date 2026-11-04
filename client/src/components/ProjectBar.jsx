import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../services/api";
import { useProjects } from "../context/ProjectContext";

const colors = ["#4f46e5", "#0ea5e9", "#22c55e", "#eab308", "#ef4444", "#a855f7"];

export default function ProjectBar() {
  const { projects, selectedProject, setSelectedProject, refreshProjects } =
    useProjects();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: colors[0] });
  const [error, setError] = useState("");

  const current = projects.find((p) => p._id === selectedProject);

  const openNew = () => {
    setForm({ name: "", description: "", color: colors[0] });
    setError("");
    setEditing({});
  };

  const openEdit = () => {
    setForm({
      name: current.name,
      description: current.description || "",
      color: current.color,
    });
    setError("");
    setEditing(current);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing._id) {
        await api.put("/projects/" + editing._id, form);
        toast.success("Project updated");
      } else {
        const { data } = await api.post("/projects", form);
        setSelectedProject(data._id);
        toast.success("Project created");
      }
      setEditing(null);
      refreshProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save project");
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this project and all its tasks?")) return;
    try {
      await api.delete("/projects/" + current._id);
      setSelectedProject("");
      toast.success("Project deleted");
      refreshProjects();
    } catch (err) {
      toast.error("Could not delete project");
    }
  };

  return (
    <div className="project-bar">
      <div className="project-chips">
        <button
          className={"project-chip" + (selectedProject === "" ? " active" : "")}
          onClick={() => setSelectedProject("")}
        >
          All projects
        </button>

        {projects.map((p) => (
          <button
            key={p._id}
            className={"project-chip" + (selectedProject === p._id ? " active" : "")}
            onClick={() => setSelectedProject(p._id)}
          >
            <span className="dot" style={{ background: p.color }} />
            {p.name}
            <span className="chip-count">{p.taskCount}</span>
          </button>
        ))}

        <button
          className={"project-chip" + (selectedProject === "none" ? " active" : "")}
          onClick={() => setSelectedProject("none")}
        >
          No project
        </button>

        <button className="project-chip add" onClick={openNew}>
          <Plus size={14} /> New project
        </button>
      </div>

      {current && (
        <div className="project-actions">
          <button className="btn-small" onClick={openEdit}>
            <Pencil size={14} /> Edit project
          </button>
          <button className="btn-small btn-danger" onClick={remove}>
            <Trash2 size={14} /> Delete project
          </button>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing._id ? "Edit project" : "New project"}</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={save}>
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <label>Description</label>
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <label>Colour</label>
              <div className="swatches">
                {colors.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={"swatch" + (form.color === c ? " selected" : "")}
                    style={{ background: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}