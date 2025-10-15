import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface NetworkAdapter {
  Name: string;
  InterfaceDescription: string;
  ifIndex: number;
  LinkSpeed: string;
}

interface NetworkAdapterStore {
  adapters: NetworkAdapter[];
  isLoading: boolean;
  error: string | null;
  fetchAdapters: () => Promise<void>;
  clearAdapters: () => void;
}

// Simple CSV parser function
function parseCSV(csvString: string): NetworkAdapter[] {
  const lines = csvString.split("\n");
  if (lines.length < 2) return []; // Need at least header and one data line

  return lines
    .slice(1) // Skip header line
    .filter((line) => line.trim() !== "")
    .map((line) => {
      // Split by comma, but handle quoted values that might contain commas
      const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      const cleanValues = values.map((value) => {
        return value.trim().replace(/^"|"$/g, ""); // Remove leading/trailing quotes
      });

      if (cleanValues.length < 4) return null;

      return {
        Name: cleanValues[0] || "",
        InterfaceDescription: cleanValues[1] || "",
        ifIndex: parseInt(cleanValues[2]) || 0,
        LinkSpeed: cleanValues[3] || "",
      };
    })
    .filter((adapter): adapter is NetworkAdapter => adapter !== null);
}

export const useNetworkAdapterStore = create<NetworkAdapterStore>()((set) => ({
  adapters: [],
  isLoading: false,
  error: null,
  fetchAdapters: async () => {
    try {
      set({ isLoading: true, error: null });
      const result = await invoke<string>("get_network_adapters");

      const adapters = parseCSV(result);

      set({ adapters, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  clearAdapters: () => set({ adapters: [], error: null }),
}));
