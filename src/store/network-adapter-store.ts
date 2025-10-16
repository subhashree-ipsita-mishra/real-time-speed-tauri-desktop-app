import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface NetworkAdapter {
  Name: string;
  InterfaceDescription: string;
  ifIndex: number;
  LinkSpeed: string;
  InterfaceType: number; // Numeric interface type from PowerShell (e.g., 6 for Ethernet, 71 for WiFi)
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
  maxDataPoints: number;
  startMonitoring: (updateInterval?: number, maxDataPoints?: number) => void;
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

      if (cleanValues.length < 5) return null;

      return {
        Name: cleanValues[0] || "",
        InterfaceDescription: cleanValues[1] || "",
        ifIndex: parseInt(cleanValues[2]) || 0,
        LinkSpeed: cleanValues[3] || "",
        InterfaceType: parseInt(cleanValues[4]) || 0,
      };
    })
    .filter((adapter): adapter is NetworkAdapter => adapter !== null);
}

// Function to convert interface type to readable string
export const interfaceTypeToString = (type: number): string => {
  switch (type) {
    case 6:   // Ethernet
      return "Ethernet";
    case 71:  // IEEE 802.11 Wireless LAN
      return "WiFi";
    case 24:  // Fast Ethernet (100Base-T)
      return "Fast Ethernet";
    case 62:  // WiMAX
      return "WiMAX";
    case 151: // WWANPP Interface
      return "Cellular";
    default:
      return `Type ${type}`; // Generic type for unknown interface types
  }
};

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

// Function to get adapter type by name
export const getAdapterType = (adapters: NetworkAdapter[], adapterName: string): string => {
  const adapter = adapters.find(adapter => adapter.Name === adapterName);
  if (adapter) {
    return interfaceTypeToString(adapter.InterfaceType);
  }
  return "Unknown";
};

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
  maxDataPoints: 20,
  startMonitoring: (updateInterval = 2000, maxDataPoints = 20) => {
    if (get().isMonitoring) return; // Already monitoring
    
    set({ isMonitoring: true, speedError: null, maxDataPoints });
    
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

        // Add to chart data and keep only the specified number of points
        set((state) => ({
          speedData: [...state.speedData.slice(-(maxDataPoints - 1)), newPoint],
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
