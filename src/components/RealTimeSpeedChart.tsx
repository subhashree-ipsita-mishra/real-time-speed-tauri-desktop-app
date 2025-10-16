import { EthernetPort, Radio, Smartphone, Wifi } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  interfaceTypeToString,
  useNetworkAdapterStore,
} from "../store/network-adapter-store";

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
    fetchAdapters,
  } = useNetworkAdapterStore();

  const [displayData, setDisplayData] = useState<any[]>([]);
  const chartRef = useRef<any>(null);
  // State to track which adapters are visible in the chart
  const [visibleAdapters, setVisibleAdapters] = useState<Set<string>>(
    new Set()
  );
  // State for aggregate speed toggle (default enabled)
  const [showAggregateSpeed, setShowAggregateSpeed] = useState<boolean>(true);

  // State for chart type
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line");

  // Start monitoring and fetch adapters when component mounts
  useEffect(() => {
    startMonitoring(updateInterval, maxDataPoints);
    // Also fetch adapter details to get interface types for icons
    fetchAdapters().catch((error) =>
      console.error("Error fetching adapters:", error)
    );

    // Cleanup when component unmounts
    return () => {
      stopMonitoring();
    };
  }, [
    startMonitoring,
    stopMonitoring,
    fetchAdapters,
    updateInterval,
    maxDataPoints,
  ]);

  // Process new data efficiently
  useEffect(() => {
    if (speedData.length > 0) {
      // Use only the latest data points to prevent chart from becoming too crowded
      const newData = [...speedData].slice(-maxDataPoints);
      setDisplayData(newData);
    }
  }, [speedData, maxDataPoints]);

  // Initialize visible adapters when activeAdapters change
  useEffect(() => {
    const filtered = activeAdapters.filter((activeAdapter) => {
      return adapters
        .map((adapter) => adapter.InterfaceDescription.toLowerCase())
        .includes(activeAdapter.toLowerCase());
    });

    // Set all filtered adapters as visible by default
    setVisibleAdapters(new Set(filtered));
  }, [activeAdapters, adapters]);

  // Toggle adapter visibility
  const toggleAdapterVisibility = (adapterName: string) => {
    setVisibleAdapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(adapterName)) {
        newSet.delete(adapterName);
      } else {
        newSet.add(adapterName);
      }
      return newSet;
    });
  };

  // Toggle aggregate speed visibility
  const toggleAggregateSpeed = () => {
    setShowAggregateSpeed((prev) => !prev);
  };

  // Prepare chart data with filtered adapters
  const filteredAdapters = activeAdapters.filter((activeAdapter) => {
    return adapters
      .map((adapter) => adapter.InterfaceDescription.toLowerCase())
      .includes(activeAdapter.toLowerCase());
  });

  // Calculate aggregate speed for visible adapters
  const displayDataWithAggregate = displayData.map((dataPoint) => {
    if (!showAggregateSpeed) return dataPoint;

    const aggregateValue = filteredAdapters
      .filter((adapter) => visibleAdapters.has(adapter))
      .reduce((sum, adapter) => {
        const value = dataPoint[adapter] || 0;
        return sum + (typeof value === "number" ? value : 0);
      }, 0);

    return {
      ...dataPoint,
      "Aggregate Speed": aggregateValue,
    };
  });

  const chartLines = filteredAdapters
    .filter((adapter) => visibleAdapters.has(adapter)) // Only show visible adapters
    .map((adapter) => (
      <Line
        key={adapter}
        type="monotone"
        dataKey={adapter}
        stroke={`hsl(${filteredAdapters.indexOf(adapter) * 137.5}, 70%, 50%)`} // Generate distinct colors
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 6 }}
        isAnimationActive={false} // Disable animation for better performance
      />
    ));

  // Add aggregate speed line if enabled
  if (showAggregateSpeed) {
    chartLines.push(
      <Line
        key="Aggregate Speed"
        type="monotone"
        dataKey="Aggregate Speed"
        stroke="#6b7280" // Gray color
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 6 }}
        isAnimationActive={false}
        strokeDasharray="4 4" // Dashed line to differentiate
      />
    );
  }

  // Function to normalize names for comparison (case-insensitive, remove special chars)
  const normalizeName = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

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

  // Function to render chart based on selected type
  const renderChart = () => {
    const commonProps = {
      ref: chartRef,
      data: displayDataWithAggregate, // Use data with aggregate speed
      margin: { top: 5, right: 30, left: 50, bottom: 60 },
      style: { fontSize: 12 },
    };

    const commonElements = (
      <>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          angle={-45}
          textAnchor="end"
          height={70}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          label={{
            value: "Speed",
            angle: -90,
            position: "left",
            offset: 20,
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
      </>
    );

    switch (chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            {commonElements}
            {filteredAdapters
              .filter((adapter) => visibleAdapters.has(adapter))
              .map((adapter) => (
                <Bar
                  key={adapter}
                  dataKey={adapter}
                  fill={`hsl(${
                    filteredAdapters.indexOf(adapter) * 137.5
                  }, 70%, 50%)`}
                  isAnimationActive={false}
                />
              ))}
            {showAggregateSpeed && (
              <Bar
                key="Aggregate Speed"
                dataKey="Aggregate Speed"
                fill="#6b7280"
                isAnimationActive={false}
              />
            )}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            {commonElements}
            {filteredAdapters
              .filter((adapter) => visibleAdapters.has(adapter))
              .map((adapter) => (
                <Area
                  key={adapter}
                  type="monotone"
                  dataKey={adapter}
                  stroke={`hsl(${
                    filteredAdapters.indexOf(adapter) * 137.5
                  }, 70%, 50%)`}
                  fill={`hsl(${
                    filteredAdapters.indexOf(adapter) * 137.5
                  }, 70%, 50%)`}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              ))}
            {showAggregateSpeed && (
              <Area
                key="Aggregate Speed"
                type="monotone"
                dataKey="Aggregate Speed"
                stroke="#6b7280"
                fill="#6b7280"
                fillOpacity={0.3}
                strokeWidth={2}
                strokeDasharray="4 4"
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        );
      case "line":
      default:
        return (
          <LineChart {...commonProps}>
            {commonElements}
            {chartLines}
          </LineChart>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Chart header with title and chart type selector */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Real-Time Network Speed
        </h2>
        <div className="relative">
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline text-sm"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="area">Area Chart</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

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
            {renderChart()}
          </ResponsiveContainer>
        </div>
      )}

      {/* Network adapter list moved below the chart */}
      <div className="mt-6">
        <div className="text-sm">
          <p className="font-medium text-gray-700 mb-2">
            Active Network Adapters:
          </p>
          {/* Aggregate Speed Toggle */}
          <div className="flex items-center justify-between p-2 bg-gray-100 rounded border mb-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>
              <span className="font-medium text-sm">Aggregate Speed</span>
            </div>
            <div className="ml-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showAggregateSpeed}
                  onChange={toggleAggregateSpeed}
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          {filteredAdapters.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filteredAdapters.map((adapter, index) => {
                const matchingAdapter = getMatchingAdapter(adapter);
                const icon = matchingAdapter ? (
                  getAdapterIcon(adapter)
                ) : (
                  <Radio size={16} className="mr-2 text-gray-500" />
                );
                const type = matchingAdapter
                  ? getAdapterTypeDisplay(adapter)
                  : "Unknown";
                const isVisible = visibleAdapters.has(adapter);

                return (
                  <div
                    key={index}
                    className="flex items-center p-2 bg-gray-100 rounded border"
                    style={{
                      borderLeft: `4px solid hsl(${
                        filteredAdapters.indexOf(adapter) * 137.5
                      }, 70%, 50%)`,
                    }}
                  >
                    {icon}
                    <div className="flex-1">
                      <span className="font-medium text-sm">{adapter}</span>
                      <div className="text-xs bg-gray-200 rounded px-1.5 py-0.5 ml-1">
                        {type}
                      </div>
                    </div>
                    <div className="ml-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isVisible}
                          onChange={() => toggleAdapterVisibility(adapter)}
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic py-2">
              No network adapters detected
            </p>
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
