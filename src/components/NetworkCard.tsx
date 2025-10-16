import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import { Network, ArrowUp, ArrowDown } from "lucide-react";

// Function to format bytes to human-readable format (KB, MB, GB)
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B/s";

  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Function to parse network stats
const parseNetworkStats = (stats: string): { name: string; value: number }[] => {
  if (!stats) return [];
  
  return stats.split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const match = line.match(/^(.*?):\s*([\d.]+)\s*bytes\/sec/);
      if (match) {
        return {
          name: match[1].trim(),
          value: parseFloat(match[2])
        };
      }
      return null;
    })
    .filter((stat): stat is { name: string; value: number } => stat !== null);
};

export default function NetworkCard() {
  const [networkStats, setNetworkStats] = useState<{ name: string; value: number }[]>(
    []
  );
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  useEffect(() => {
    // Clean up interval when component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId as number);
      }
    };
  }, [intervalId]);

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
            const updatedStatsString = await invoke<string>("get_network_stats");
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
            {networkStats.map((adapter, index) => (
              <div 
                key={index} 
                className={`p-2 rounded border ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Network size={16} className="mr-2 text-blue-500" />
                    <span className="font-medium truncate max-w-[180px]">{adapter.name}</span>
                  </div>
                  <span className="font-semibold text-gray-700">{formatBytes(adapter.value)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : isTracking ? (
          <div className="text-center py-4 text-gray-500">Collecting data...</div>
        ) : (
          <div className="text-center py-4 text-gray-500">Click the button to start</div>
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
