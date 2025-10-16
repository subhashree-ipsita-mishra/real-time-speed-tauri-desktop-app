import "./App.css";
import GreetingCard from "./components/GreetingCard";
import PowerShellCard from "./components/PowerShellCard";
import TimeCard from "./components/TimeCard";
import NetworkCard from "./components/NetworkCard";
import NetworkAdapterCard from "./components/NetworkAdapterCard";
import RealTimeSpeedChart from "./components/RealTimeSpeedChart";
import { useSelectionStore } from "./store/selection-store";

export default function App() {
  const { selectedView, setSelectedView } = useSelectionStore();

  const renderCards = () => {
    if (selectedView === "all") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <GreetingCard />
          <PowerShellCard />
          <TimeCard />
          <NetworkCard />
          <NetworkAdapterCard />
          <div className="lg:col-span-2">
            <RealTimeSpeedChart />
          </div>
        </div>
      );
    }

    const cardMap: Record<string, React.JSX.Element> = {
      greeting: <GreetingCard />,
      powershell: <PowerShellCard />,
      time: <TimeCard />,
      network: <NetworkCard />,
      adapter: <NetworkAdapterCard />,
      speed: <RealTimeSpeedChart />,
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {cardMap[selectedView] || <GreetingCard />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Tauri App</h1>
        <div className="flex items-center">
          <label htmlFor="view-select" className="mr-2 text-gray-700">
            View:
          </label>
          <select
            id="view-select"
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Cards</option>
            <option value="greeting">Greeting</option>
            <option value="powershell">PowerShell</option>
            <option value="time">Time</option>
            <option value="network">Network</option>
            <option value="adapter">Network Adapters</option>
            <option value="speed">Real-Time Speed</option>
          </select>
        </div>
      </div>

      {renderCards()}
    </div>
  );
}
