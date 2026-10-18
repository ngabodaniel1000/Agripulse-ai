import { create } from "zustand";
type State = {
  region: string;
  season: string;
  category: string;
  search: string;
  role: string;
  setRegion: (v: string) => void;
  setSeason: (v: string) => void;
  setCategory: (v: string) => void;
  setSearch: (v: string) => void;
  setRole: (v: string) => void;
};
export const useDashboard = create<State>((set) => ({
  region: "All Rwanda",
  season: "All seasons",
  category: "All crops",
  search: "",
  role: "NISR Analyst",
  setRegion: (region) => set({ region }),
  setSeason: (season) => set({ season }),
  setCategory: (category) => set({ category }),
  setSearch: (search) => set({ search }),
  setRole: (role) => set({ role }),
}));
