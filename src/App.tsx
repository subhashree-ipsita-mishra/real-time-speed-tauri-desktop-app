import "./App.css";
import GreetingCard from "./components/GreetingCard";
import PowerShellCard from "./components/PowerShellCard";
import TimeCard from "./components/TimeCard";
import NetworkCard from "./components/NetworkCard";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Tauri App</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <GreetingCard />
        <PowerShellCard />
        <TimeCard />
        <NetworkCard />
      </div>
    </div>
  );
}
