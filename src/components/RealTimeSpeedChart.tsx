import React, { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useNetworkAdapterStore, getAdapterType, interfaceTypeToString } from "../store/network-adapter-store";
import { Wifi, EthernetPort, Radio, Smartphone } from "lucide-react";

interface RealTimeSpeedChartProps {
  updateInterval?: number;
  maxDataPoints?: number; // Maximum number of data points to display
}

// Function to format bytes to human-readable format (KB, MB, GB)
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B/s";

  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Function to format bytes for Y-axis ticks
const formatYAxis = (value: number): string => {
  return formatBytes(value);
};

const RealTimeSpeedChart: React.FC<RealTimeSpeedChartProps> = ({
  updateInterval = 2000, // Update every 2 seconds
  maxDataPoints = 20, // Keep only last 20 data points
}) => {
  const {
    speedData,
    activeAdapters,
    isMonitoring,
    speedError,
    startMonitoring,
    stopMonitoring,
    adapters,
  } = useNetworkAdapterStore();

  const [displayData, setDisplayData] = useState<any[]>([]);
  const chartRef = useRef<any>(null);

  // Start monitoring when component mounts
  useEffect(() => {
    startMonitoring(updateInterval, maxDataPoints);

    // Cleanup when component unmounts
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring, updateInterval, maxDataPoints]);

  // Process new data efficiently
  useEffect(() => {
    if (speedData.length > 0) {
      // Use only the latest data points to prevent chart from becoming too crowded
      const newData = [...speedData].slice(-maxDataPoints);
      setDisplayData(newData);
    }
  }, [speedData, maxDataPoints]);

  // Prepare chart data with all adapters
  const chartLines = activeAdapters.map((adapter) => (
    <Line
      key={adapter}
      type="monotone"
      dataKey={adapter}
      stroke={`hsl(${activeAdapters.indexOf(adapter) * 137.5}, 70%, 50%)`} // Generate distinct colors
      strokeWidth={2}
      dot={false}
      activeDot={{ r: 6 }}
      isAnimationActive={false} // Disable animation for better performance
    />
  ));

  // Function to normalize names for comparison (case-insensitive, remove special chars)
  const normalizeName = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Function to find matching adapter for a network stat by name/description
  const getMatchingAdapter = (statName: string) => {
    // Debug logging
    console.log("getMatchingAdapter called with:", statName);
    console.log("Available adapters:", adapters);
    
    // First try exact name match
    const exactMatch = adapters.find(adapter => 
      normalizeName(adapter.Name) === normalizeName(statName)
    );
    if (exactMatch) {
      console.log("Found exact match:", exactMatch);
      return exactMatch;
    }
    
    // Then try matching against InterfaceDescription
    const descMatch = adapters.find(adapter => 
      normalizeName(adapter.InterfaceDescription).includes(normalizeName(statName)) || 
      normalizeName(statName).includes(normalizeName(adapter.InterfaceDescription))
    );
    if (descMatch) {
      console.log("Found description match:", descMatch);
      return descMatch;
    }
    
    console.log("No match found for:", statName);
    return null;
  };

  // Function to get the appropriate icon for adapter type
  const getAdapterIcon = (adapterName: string) => {
    const matchingAdapter = getMatchingAdapter(adapterName);
    if (matchingAdapter) {
      const type = interfaceTypeToString(matchingAdapter.InterfaceType);
      switch (type) {
        case "WiFi":
          return <Wifi size={12} className="mr-1" />;
        case "Ethernet":
        case "Fast Ethernet":
          return <EthernetPort size={12} className="mr-1" />;
        case "Cellular":
          return <Smartphone size={12} className="mr-1" />;
        case "WiMAX":
          return <Radio size={12} className="mr-1" />;
        default:
          return <Radio size={12} className="mr-1" />; // Default icon
      }
    }
    return <Radio size={12} className="mr-1" />; // Default icon if adapter not found
  };

  // Remove debugging logs for production
  // Function to get the adapter type name for display
  const getAdapterTypeDisplay = (adapterName: string): string => {
    const matchingAdapter = getMatchingAdapter(adapterName);
    if (matchingAdapter) {
      return interfaceTypeToString(matchingAdapter.InterfaceType);
    }
    return "Unknown";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        Real-Time Network Speed
      </h2>

      {speedError && (
        <div className="text-red-500 text-center mb-4">Error: {speedError}</div>
      )}

      {isMonitoring && speedData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Collecting initial data...
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              ref={chartRef}
              data={displayData}
              margin={{ top: 5, right: 30, left: 50, bottom: 60 }} // Increased left margin from 30 to 50
              // Optimize re-rendering
              style={{ fontSize: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                angle={-45}
                textAnchor="end"
                height={70} // Increased height for better timestamp display
                tick={{ fontSize: 10 }}
              />
              <YAxis
                label={{
                  value: "Speed",
                  angle: -90,
                  position: "left",
                  offset: 20, // Add offset to move label further left
                  style: { textAnchor: "middle", fontSize: 12 },
                }}
                tick={{ fontSize: 10 }}
                tickFormatter={formatYAxis}
              />
              <Tooltip
                formatter={(value) => [formatBytes(Number(value)), "Speed"]}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="top"
                height={40}
                wrapperStyle={{ paddingBottom: "10px", fontSize: 12 }}
              />
              {chartLines}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Network adapter list moved below the chart */}
      <div className="mt-6">
        <div className="text-sm">
          <p className="font-medium text-gray-700 mb-2">Active Network Adapters:</p>
          {activeAdapters.length > 0 ? (
            <div className="space-y-2">
              {activeAdapters.map((adapter, index) => {
                const matchingAdapter = getMatchingAdapter(adapter);
                const icon = matchingAdapter ? getAdapterIcon(adapter) : 
                             <Radio size={16} className="mr-2 text-gray-500" />;
                const type = matchingAdapter ? getAdapterTypeDisplay(adapter) : "Unknown";
                
                return (
                  <div
                    key={index}
                    className="p-2 rounded border flex items-center justify-between bg-white"
                    style={{
                      borderLeft: `4px solid hsl(${
                        activeAdapters.indexOf(adapter) * 137.5
                      }, 70%, 50%)`,
                    }}
                  >
                    <div className="flex items-center">
                      {icon}
                      <div>
                        <span className="font-medium">{adapter}</span>
                        <span className="ml-2 text-xs bg-gray-200 rounded px-2 py-0.5">
                          {type}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic py-2">No network adapters detected</p>
          )}
        </div>

        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>
            <p>
              Update interval: {updateInterval / 1000}s | Max points:{" "}
              {maxDataPoints}
            </p>
          </div>
          <div className="flex items-center">
            <span
              className={`inline-block w-3 h-3 rounded-full mr-2 ${
                isMonitoring ? "bg-green-500" : "bg-gray-500"
              }`}
            ></span>
            <span>{isMonitoring ? "Monitoring" : "Stopped"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeSpeedChart;
