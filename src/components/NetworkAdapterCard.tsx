import { useNetworkAdapterStore } from "../store/network-adapter-store";

export default function NetworkAdapterCard() {
  const { adapters, isLoading, error, fetchAdapters, clearAdapters } = useNetworkAdapterStore();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Network Adapters</h2>
      <div className="text-sm text-left text-gray-600 mb-4 bg-gray-50 p-3 rounded overflow-x-auto max-h-40">
        {error && <div className="text-red-500">Error: {error}</div>}
        {isLoading ? (
          <div>Fetching adapter information...</div>
        ) : adapters.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Index</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {adapters.map((adapter, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-1 whitespace-nowrap text-sm">{adapter.Name}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-sm">{adapter.InterfaceDescription}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-sm">{adapter.ifIndex}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-sm">{adapter.LinkSpeed}</td>
                </tr>
              ))}
            </tbody>
          </table>
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