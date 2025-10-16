import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import {
  useNetworkAdapterStore,
  interfaceTypeToString,
} from "../store/network-adapter-store";
import { Network, Wifi, EthernetPort, Radio, Smartphone } from "lucide-react";

// Function to format bytes to human-readable format (KB, MB, GB)
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B/s";

  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Function to normalize names for comparison (case-insensitive, remove special chars)
const normalizeName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Function to parse network stats
const parseNetworkStats = (
  stats: string
): { name: string; value: number }[] => {
  if (!stats) return [];

  return stats
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const match = line.match(/^(.*?):\s*([\d.]+)\s*bytes\/sec/);
      if (match) {
        return {
          name: match[1].trim(),
          value: parseFloat(match[2]),
        };
      }
      return null;
    })
    .filter((stat): stat is { name: string; value: number } => stat !== null);
};

export default function NetworkCard() {
  const [networkStats, setNetworkStats] = useState<
    { name: string; value: number }[]
  >([]);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  // Get the adapter information from the store to match with the stats
  const { adapters, fetchAdapters } = useNetworkAdapterStore();

  useEffect(() => {
    // Fetch adapters when component mounts to have adapter info available
    fetchAdapters().catch((error) =>
      console.error("Error fetching adapters:", error)
    );

    // Clean up interval when component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId as number);
      }
    };
  }, [intervalId, fetchAdapters]);

  // Function to find matching adapter for a network stat by name/description
  const getMatchingAdapter = (statName: string) => {
    // First try exact name match
    const exactMatch = adapters.find(
      (adapter) => normalizeName(adapter.Name) === normalizeName(statName)
    );
    if (exactMatch) return exactMatch;

    // Then try matching against InterfaceDescription
    const descMatch = adapters.find(
      (adapter) =>
        normalizeName(adapter.InterfaceDescription).includes(
          normalizeName(statName)
        ) ||
        normalizeName(statName).includes(
          normalizeName(adapter.InterfaceDescription)
        )
    );
    if (descMatch) return descMatch;

    return null;
  };

  // Function to get the appropriate icon for adapter type
  const getAdapterIcon = (adapterType: number) => {
    const type = interfaceTypeToString(adapterType);
    switch (type) {
      case "WiFi":
        return <Wifi size={16} className="mr-2 text-blue-500" />;
      case "Ethernet":
      case "Fast Ethernet":
        return <EthernetPort size={16} className="mr-2 text-green-500" />;
      case "Cellular":
        return <Smartphone size={16} className="mr-2 text-purple-500" />;
      case "WiMAX":
        return <Radio size={16} className="mr-2 text-orange-500" />;
      default:
        return <Network size={16} className="mr-2 text-gray-500" />; // Generic network icon
    }
  };

  const toggleNetworkTracking = async () => {
    if (isTracking) {
      // Stop tracking
      if (intervalId) {
        clearInterval(intervalId as number);
        setIntervalId(null);
      }
      setIsTracking(false);
      setNetworkStats([]);
    } else {
      // Start tracking
      try {
        // Get initial stats
        const initialStatsString = await invoke<string>("get_network_stats");
        const initialStats = parseNetworkStats(initialStatsString);
        setNetworkStats(initialStats);

        // Set up interval to update stats every 2 seconds (network stats change frequently)
        const id = window.setInterval(async () => {
          try {
            const updatedStatsString = await invoke<string>(
              "get_network_stats"
            );
            const updatedStats = parseNetworkStats(updatedStatsString);
            setNetworkStats(updatedStats);
          } catch (error) {
            console.error("Error updating network stats:", error);
            setNetworkStats([]);
            // Stop tracking if there's an error
            setIsTracking(false);
            if (intervalId) {
              clearInterval(intervalId as number);
              setIntervalId(null);
            }
          }
        }, 2000); // Update every 2 seconds

        setIntervalId(id);
        setIsTracking(true);
      } catch (error) {
        console.error("Error starting network tracking:", error);
      }
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        Real-time Network Stats
      </h2>
      <div className="text-sm text-left text-gray-600 mb-4 bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
        {isTracking && networkStats.length > 0 ? (
          <div className="space-y-2">
            {networkStats
              .filter((stat) => {
                return adapters
                  .map((adapter) => adapter.InterfaceDescription.toLowerCase())
                  .includes(stat.name.toLowerCase());
              })
              .map((stat, index) => {
                const matchingAdapter = getMatchingAdapter(stat.name);
                const icon = matchingAdapter ? (
                  getAdapterIcon(matchingAdapter.InterfaceType)
                ) : (
                  <Network size={16} className="mr-2 text-gray-500" />
                );
                const type = matchingAdapter
                  ? interfaceTypeToString(matchingAdapter.InterfaceType)
                  : "Unknown";

                return (
                  <div
                    key={index}
                    className={`p-2 rounded border ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {icon}
                        <div>
                          <span className="font-medium truncate max-w-[150px]">
                            {stat.name}
                          </span>
                          <span className="ml-1 text-xs bg-gray-200 rounded px-1.5 py-0.5">
                            {type}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-700">
                        {formatBytes(stat.value)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : isTracking ? (
          <div className="text-center py-4 text-gray-500">
            Collecting data...
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Click the button to start
          </div>
        )}
      </div>
      <button
        onClick={toggleNetworkTracking}
        className={`${
          isTracking
            ? "bg-red-500 hover:bg-red-600"
            : "bg-teal-500 hover:bg-teal-600"
        } text-white font-medium py-2 px-4 rounded-lg w-full transition-colors duration-200`}
      >
        {isTracking ? "Stop Network Tracking" : "Start Network Tracking"}
      </button>
    </div>
  );
}
