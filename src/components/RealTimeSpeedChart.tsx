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

  // Function to get the appropriate icon for adapter type
  const getAdapterIcon = (adapterName: string) => {
    const adapter = adapters.find(adapter => adapter.Name === adapterName);
    if (adapter) {
      const type = interfaceTypeToString(adapter.InterfaceType);
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
        <div className="mb-2 text-sm">
          <p className="font-medium text-gray-700">Active Network Adapters:</p>
          {activeAdapters.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {activeAdapters.map((adapter, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-gray-100 rounded text-xs flex items-center"
                  style={{
                    borderLeft: `3px solid hsl(${
                      activeAdapters.indexOf(adapter) * 137.5
                    }, 70%, 50%)`,
                  }}
                >
                  {getAdapterIcon(adapter)}
                  <span>{adapter}</span>
                  <span className="ml-1 text-[0.6rem] text-gray-500">
                    ({getAdapterType(adapters, adapter)})
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No network adapters detected</p>
          )}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600">
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
