import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface NetworkAdapter {
  Name: string;
  InterfaceDescription: string;
  ifIndex: number;
  LinkSpeed: string;
}

interface NetworkStat {
  name: string;
  value: number; // bytes per second
}

interface ChartDataPoint {
  timestamp: string;
  [key: string]: number | string;
}

interface NetworkAdapterStore {
  adapters: NetworkAdapter[];
  isLoading: boolean;
  error: string | null;
  fetchAdapters: () => Promise<void>;
  clearAdapters: () => void;
  
  // Real-time speed tracking
  speedData: ChartDataPoint[];
  activeAdapters: string[];
  isMonitoring: boolean;
  speedError: string | null;
  startMonitoring: (updateInterval?: number) => void;
  stopMonitoring: () => void;
  clearSpeedData: () => void;
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

// Parse network stats from PowerShell output
function parseNetworkStats(output: string): NetworkStat[] {
  const lines = output.split("\n").filter(line => line.trim() !== "");
  return lines.map(line => {
    const match = line.match(/^(.*?):\s*([\d.]+)\s*bytes\/sec/);
    if (match) {
      return {
        name: match[1].trim(),
        value: parseFloat(match[2])
      };
    }
    return null;
  }).filter((stat): stat is NetworkStat => stat !== null);
}

export const useNetworkAdapterStore = create<NetworkAdapterStore>()((set, get) => ({
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
  
  // Real-time speed tracking
  speedData: [],
  activeAdapters: [],
  isMonitoring: false,
  speedError: null,
  startMonitoring: (updateInterval = 2000) => {
    if (get().isMonitoring) return; // Already monitoring
    
    set({ isMonitoring: true, speedError: null });
    
    const intervalId = setInterval(async () => {
      try {
        const result = await invoke<string>('get_network_stats');
        const parsedStats = parseNetworkStats(result);
        
        // Update active adapters if they changed
        const currentAdapters = parsedStats.map(stat => stat.name);
        const prevAdapters = get().activeAdapters;
        if (JSON.stringify(currentAdapters) !== JSON.stringify(prevAdapters)) {
          set({ activeAdapters: currentAdapters });
        }

        // Create new data point
        const newPoint: ChartDataPoint = {
          timestamp: new Date().toLocaleTimeString(),
        };

        parsedStats.forEach(stat => {
          newPoint[stat.name] = stat.value;
        });

        // Add to chart data and keep only last 20 points
        set((state) => ({
          speedData: [...state.speedData.slice(-19), newPoint],
          speedError: null
        }));
      } catch (error) {
        console.error('Error fetching network stats:', error);
        set({ speedError: 'Failed to fetch network statistics' });
      }
    }, updateInterval);
    
    // Store interval ID in global scope to allow cleanup
    // @ts-ignore
    window.__networkSpeedInterval = intervalId;
  },
  stopMonitoring: () => {
    // @ts-ignore
    if (window.__networkSpeedInterval) {
      // @ts-ignore
      clearInterval(window.__networkSpeedInterval);
      // @ts-ignore
      delete window.__networkSpeedInterval;
    }
    set({ isMonitoring: false });
  },
  clearSpeedData: () => set({ speedData: [], activeAdapters: [], speedError: null }),
}));
