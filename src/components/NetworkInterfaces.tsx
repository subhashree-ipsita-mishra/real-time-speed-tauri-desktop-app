import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { RefreshCw, Wifi, AlertCircle, Loader } from "lucide-react";

function NetworkInterfaces() {
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchNetworkInterfaces() {
    try {
      setLoading(true);
      setError(null);
      const networkInterfaces: string[] = await invoke(
        "get_list_of_network_interfaces"
      );
      setInterfaces(networkInterfaces);
    } catch (err) {
      setError("Failed to fetch network interfaces: " + (err as Error).message);
      console.error("Error fetching network interfaces:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNetworkInterfaces();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center">
            <Wifi className="mr-2 h-6 w-6" />
            Network Interfaces
          </h2>
          <button
            onClick={fetchNetworkInterfaces}
            disabled={loading}
            className={`p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 ${
              loading ? "animate-pulse" : ""
            }`}
          >
            <RefreshCw
              className={`h-5 w-5 text-white ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader className="animate-spin h-8 w-8 text-blue-500" />
            <span className="mt-3 text-gray-600 text-sm">
              Scanning network interfaces...
            </span>
          </div>
        )}

        {error && (
          <div
            className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-4 flex items-start"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-800 text-sm">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {interfaces.length === 0 ? (
              <div className="text-center py-6">
                <Wifi className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-1 text-base font-medium text-gray-900">
                  No interfaces found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No network interfaces were detected on your system.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {interfaces.map((iface, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow transition-all duration-200 flex items-center"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Wifi className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3 overflow-hidden">
                      <div className="text-base font-medium text-gray-900 truncate">
                        {iface}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
                        Active Interface
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={fetchNetworkInterfaces}
              disabled={loading}
              className={`inline-flex items-center px-3 py-1.5 rounded font-medium text-sm ${
                loading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white shadow hover:shadow-md transition-all duration-200"
              }`}
            >
              <RefreshCw
                className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NetworkInterfaces;
