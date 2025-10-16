import React, { useEffect, useRef, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useNetworkAdapterStore } from '../store/network-adapter-store';

interface RealTimeSpeedChartProps {
  updateInterval?: number;
  maxDataPoints?: number; // Maximum number of data points to display
}

// Function to format bytes to human-readable format (KB, MB, GB)
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B/s';
  
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Function to format bytes for Y-axis ticks
const formatYAxis = (value: number): string => {
  return formatBytes(value);
};

const RealTimeSpeedChart: React.FC<RealTimeSpeedChartProps> = ({ 
  updateInterval = 2000, // Update every 2 seconds
  maxDataPoints = 20 // Keep only last 20 data points
}) => {
  const {
    speedData,
    activeAdapters,
    isMonitoring,
    speedError,
    startMonitoring,
    stopMonitoring
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
  const chartLines = activeAdapters.map(adapter => (
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Real-Time Network Speed</h2>
      
      {speedError && (
        <div className="text-red-500 text-center mb-4">
          Error: {speedError}
        </div>
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
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              // Optimize re-rendering
              style={{ fontSize: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                label={{ 
                  value: 'Speed', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 12 }
                }}
                tick={{ fontSize: 10 }}
                tickFormatter={formatYAxis}
              />
              <Tooltip 
                formatter={(value) => [formatBytes(Number(value)), 'Speed']}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="top" 
                height={40}
                wrapperStyle={{ paddingBottom: '10px', fontSize: 12 }}
              />
              {chartLines}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600 flex justify-between items-center">
        <div>
          <p className="mb-1">Active Network Adapters: {activeAdapters.join(', ') || 'None detected'}</p>
          <p>Update interval: {updateInterval / 1000}s | Max points: {maxDataPoints}</p>
        </div>
        <div className="flex items-center">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isMonitoring ? 'bg-green-500' : 'bg-gray-500'}`}></span>
          <span>{isMonitoring ? 'Monitoring' : 'Stopped'}</span>
        </div>
      </div>
    </div>
  );
};

export default RealTimeSpeedChart;