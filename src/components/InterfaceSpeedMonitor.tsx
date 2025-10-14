import React, { useState, useEffect } from "react";

interface InterfaceSpeedData {
  interface_name: string;
  rx_speed: number; // Mbps
  tx_speed: number; // Mbps
  timestamp: number; // Unix timestamp
}

interface NetworkInterface {
  name: string;
  description: string;
  is_up: boolean;
  is_loopback: boolean;
  ip_addresses: string[];
}

const InterfaceSpeedMonitor: React.FC = () => {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>("");
  const [speedData, setSpeedData] = useState<InterfaceSpeedData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available network interfaces
  useEffect(() => {
    const fetchInterfaces = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const allInterfaces: NetworkInterface[] = await invoke(
          "get_all_network_interfaces"
        );
        setInterfaces(allInterfaces);

        // Select the first non-loopback interface by default
        const nonLoopback = allInterfaces.find((iface) => !iface.is_loopback);
        if (nonLoopback) {
          setSelectedInterface(nonLoopback.name);
        } else if (allInterfaces.length > 0) {
          setSelectedInterface(allInterfaces[0].name);
        }
      } catch (err) {
        setError("Failed to fetch network interfaces");
        console.error(err);
      }
    };

    fetchInterfaces();
  }, []);

  const monitorInterfaceSpeed = async () => {
    if (!selectedInterface) return;

    setIsMonitoring(true);
    setError(null);

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const data: InterfaceSpeedData = await invoke(
        "get_interface_speed_data",
        {
          interfaceName: selectedInterface,
        }
      );
      setSpeedData(data);
    } catch (err) {
      setError("Failed to monitor interface speed");
      console.error(err);
    } finally {
      setIsMonitoring(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Interface Speed Monitor
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Monitor the real-time transmit (TX) and receive (RX) speeds of a
        specific network interface.
      </p>

      {interfaces.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Network Interface
          </label>
          <select
            value={selectedInterface}
            onChange={(e) => setSelectedInterface(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          >
            {interfaces
              .filter((iface) => iface.is_up)
              .map((iface) => (
                <option key={iface.name} value={iface.name}>
                  {iface.name}{" "}
                  {iface.description ? `(${iface.description})` : ""}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="flex flex-col items-center justify-center mb-8">
        <button
          onClick={monitorInterfaceSpeed}
          disabled={isMonitoring || !selectedInterface}
          className={`px-6 py-3 rounded-lg font-medium text-white ${
            isMonitoring || !selectedInterface
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 transform hover:scale-105 transition-all duration-200"
          } transition-colors duration-200`}
        >
          {isMonitoring ? "Monitoring..." : "Monitor Speed"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-fade-in">
          <p className="text-red-700 text-center">{error}</p>
        </div>
      )}

      {speedData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
          <div className="bg-blue-50 rounded-lg p-4 text-center transform transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Receive (RX)
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {speedData.rx_speed.toFixed(2)}{" "}
              <span className="text-lg">Mbps</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Download Speed</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 text-center transform transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Transmit (TX)
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {speedData.tx_speed.toFixed(2)}{" "}
              <span className="text-lg">Mbps</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Upload Speed</p>
          </div>
        </div>
      )}

      {!speedData && !isMonitoring && !error && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Select an interface and click "Monitor Speed" to view real-time
            interface statistics
          </p>
        </div>
      )}
    </div>
  );
};

export default InterfaceSpeedMonitor;
