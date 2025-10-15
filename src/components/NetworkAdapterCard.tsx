import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

export default function NetworkAdapterCard() {
  const [adapterInfo, setAdapterInfo] = useState<string>("Click the button to get adapter info");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAdapterInfo = async () => {
    try {
      setIsLoading(true);
      setAdapterInfo("Fetching adapter information...");
      const result = await invoke<string>("get_network_adapters");
      setAdapterInfo(result);
    } catch (error) {
      console.error("Error getting network adapters:", error);
      setAdapterInfo("Error getting network adapter information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Network Adapters</h2>
      <pre className="text-sm text-left text-gray-600 mb-4 bg-gray-50 p-3 rounded overflow-x-auto max-h-40">
        {adapterInfo}
      </pre>
      <button 
        onClick={fetchAdapterInfo}
        disabled={isLoading}
        className={`${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-amber-500 hover:bg-amber-600'
        } text-white font-medium py-2 px-4 rounded-lg w-full transition-colors duration-200`}
      >
        {isLoading ? "Fetching..." : "Get Active Adapters"}
      </button>
    </div>
  );
}