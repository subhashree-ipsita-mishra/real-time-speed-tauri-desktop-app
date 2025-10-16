import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

export default function TimeCard() {
  const [time, setTime] = useState<string>("Click the button to start");
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clean up interval when component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const toggleTimeTracking = async () => {
    if (isTracking) {
      // Stop tracking
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setIsTracking(false);
      setTime("Click the button to start");
    } else {
      // Start tracking
      try {
        // Get initial time
        const initialTime = await invoke<string>("get_time_from_powershell");
        setTime(initialTime);
        
        // Set up interval to update time every second
        const id = setInterval(async () => {
          try {
            const updatedTime = await invoke<string>("get_time_from_powershell");
            setTime(updatedTime);
          } catch (error) {
            console.error("Error updating time:", error);
            setTime("Error getting time");
            // Stop tracking if there's an error
            setIsTracking(false);
            if (intervalId) {
              clearInterval(intervalId);
              setIntervalId(null);
            }
          }
        }, 1000); // Update every second
        
        setIntervalId(id);
        setIsTracking(true);
      } catch (error) {
        console.error("Error starting time tracking:", error);
        setTime("Error starting time tracking");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Real-time PowerShell Time</h2>
      <p className="text-2xl font-mono text-center text-blue-600 mb-4">{time}</p>
      <button 
        onClick={toggleTimeTracking}
        className={`${isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white font-medium py-2 px-4 rounded-lg w-full transition-colors duration-200`}
      >
        {isTracking ? "Stop Time Tracking" : "Start Time Tracking"}
      </button>
    </div>
  );
}