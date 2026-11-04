import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelected] = useState(
    localStorage.getItem("selectedProject") || ""
  );

  const setSelectedProject = (id) => {
    setSelected(id);
    localStorage.setItem("selectedProject", id);
  };

  const refreshProjects = async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
      const missing =
        selectedProject &&
        selectedProject !== "none" &&
        !data.find((p) => p._id === selectedProject);
      if (missing) setSelectedProject("");
    } catch (err) {
      console.log("Could not load projects");
    }
  };

  useEffect(() => {
    if (user) refreshProjects();
    else setProjects([]);
  }, [user]);

  return (
    <ProjectContext.Provider
      value={{ projects, selectedProject, setSelectedProject, refreshProjects }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export const useProjects = () => useContext(ProjectContext);