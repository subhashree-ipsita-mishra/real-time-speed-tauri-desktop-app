import { useNetworkAdapterStore, interfaceTypeToString } from "../store/network-adapter-store";
import { Wifi, EthernetPort, Radio, Smartphone, Network } from "lucide-react";

// Function to get the appropriate icon for adapter type
const getAdapterIcon = (adapterType: number) => {
  const type = interfaceTypeToString(adapterType);
  switch (type) {
    case "WiFi":
      return <Wifi size={16} className="mr-2 text-blue-500" />;
    case "Ethernet":
    case "Fast Ethernet":
      return <EthernetPort size={16} className="mr-2 text-green-500" />;
    case "Cellular":
      return <Smartphone size={16} className="mr-2 text-purple-500" />;
    case "WiMAX":
      return <Radio size={16} className="mr-2 text-orange-500" />;
    default:
      return <Network size={16} className="mr-2 text-gray-500" />; // Generic network icon
  }
};

export default function NetworkAdapterCard() {
  const { adapters, isLoading, error, fetchAdapters, clearAdapters } = useNetworkAdapterStore();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Network Adapters</h2>
      <div className="text-sm text-left text-gray-600 mb-4 bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
        {error && <div className="text-red-500">Error: {error}</div>}
        {isLoading ? (
          <div>Fetching adapter information...</div>
        ) : adapters.length > 0 ? (
          <div className="space-y-3">
            {adapters.map((adapter, index) => (
              <div 
                key={index} 
                className={`p-3 rounded border ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <div className="flex items-center mb-1">
                  {getAdapterIcon(adapter.InterfaceType)}
                  <span className="font-medium">{adapter.Name}</span>
                  <span className="ml-2 text-xs bg-gray-200 rounded px-2 py-0.5">
                    {interfaceTypeToString(adapter.InterfaceType)}
                  </span>
                </div>
                <div className="text-xs ml-6 text-gray-600">
                  <div><span className="font-medium">Description:</span> {adapter.InterfaceDescription}</div>
                  <div><span className="font-medium">Speed:</span> {adapter.LinkSpeed}</div>
                  <div><span className="font-medium">Index:</span> {adapter.ifIndex}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>Click the button to get adapter info</div>
        )}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={fetchAdapters}
          disabled={isLoading}
          className={`${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-amber-500 hover:bg-amber-600'
          } text-white font-medium py-2 px-3 rounded-lg flex-1 transition-colors duration-200`}
        >
          {isLoading ? "Fetching..." : "Get Active Adapters"}
        </button>
        <button 
          onClick={clearAdapters}
          className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200"
        >
          Clear
        </button>
      </div>
    </div>
  );
}