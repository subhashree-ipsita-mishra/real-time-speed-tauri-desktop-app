import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

export default function NetworkCard() {
  const [networkStats, setNetworkStats] = useState<string>("Click the button to start");
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clean up interval when component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const toggleNetworkTracking = async () => {
    if (isTracking) {
      // Stop tracking
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setIsTracking(false);
      setNetworkStats("Click the button to start");
    } else {
      // Start tracking
      try {
        // Get initial stats
        const initialStats = await invoke<string>("get_network_stats");
        setNetworkStats(initialStats);
        
        // Set up interval to update stats every 2 seconds (network stats change frequently)
        const id = setInterval(async () => {
          try {
            const updatedStats = await invoke<string>("get_network_stats");
            setNetworkStats(updatedStats);
          } catch (error) {
            console.error("Error updating network stats:", error);
            setNetworkStats("Error getting network stats");
            // Stop tracking if there's an error
            setIsTracking(false);
            if (intervalId) {
              clearInterval(intervalId);
              setIntervalId(null);
            }
          }
        }, 2000); // Update every 2 seconds
        
        setIntervalId(id);
        setIsTracking(true);
      } catch (error) {
        console.error("Error starting network tracking:", error);
        setNetworkStats("Error starting network tracking");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Real-time Network Stats</h2>
      <pre className="text-sm text-center text-gray-600 mb-4 bg-gray-50 p-3 rounded overflow-x-auto max-h-32">
        {networkStats}
      </pre>
      <button 
        onClick={toggleNetworkTracking}
        className={`${isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'} text-white font-medium py-2 px-4 rounded-lg w-full transition-colors duration-200`}
      >
        {isTracking ? "Stop Network Tracking" : "Start Network Tracking"}
      </button>
    </div>
  );
}