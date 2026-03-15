import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Project } from "../types";

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  setProjects: (projects: Project[]) => void;
  setActiveProject: (id: string) => void;
  activeProject: () => Project | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      setProjects: (projects) => set({ projects }),
      setActiveProject: (id) => set({ activeProjectId: id }),
      activeProject: () =>
        get().projects.find((p) => p.id === get().activeProjectId),
    }),
    {
      name: "infratrace-project",
      partialize: (state) => ({ activeProjectId: state.activeProjectId }),
    }
  )
);
