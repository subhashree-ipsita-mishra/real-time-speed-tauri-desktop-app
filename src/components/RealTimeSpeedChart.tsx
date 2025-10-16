import React, { useEffect } from 'react';
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
}

const RealTimeSpeedChart: React.FC<RealTimeSpeedChartProps> = ({ 
  updateInterval = 2000 // Update every 2 seconds
}) => {
  const {
    speedData,
    activeAdapters,
    isMonitoring,
    speedError,
    startMonitoring,
    stopMonitoring
  } = useNetworkAdapterStore();

  // Start monitoring when component mounts
  useEffect(() => {
    startMonitoring(updateInterval);
    
    // Cleanup when component unmounts
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring, updateInterval]);

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
              data={speedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ 
                  value: 'Bytes per Second', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 12 }
                }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [`${Number(value).toLocaleString()} bytes/s`, 'Speed']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="top" 
                height={40}
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              {chartLines}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600 flex justify-between items-center">
        <div>
          <p className="mb-1">Active Network Adapters: {activeAdapters.join(', ') || 'None detected'}</p>
          <p>Update interval: {updateInterval / 1000}s</p>
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