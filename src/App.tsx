import "./App.css";
import NetworkInterfaces from "./components/NetworkInterfaces";
import { Zap } from "lucide-react";
import { useState } from "react";

function App() {
  const [activeTab, setActiveTab] = useState("network");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 py-4 px-2">
      <div className="max-w-full mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl flex items-center justify-center">
            <Zap className="mr-2 text-yellow-500 h-6 w-6" />
            Real-Time Speed
            <Zap className="ml-2 text-yellow-500 h-6 w-6" />
          </h1>
          <p className="mt-2 mx-auto text-sm text-gray-500 px-4">
            Monitor your network performance
          </p>
        </header>

        <main className="container mx-auto px-2">
          <div className="mb-4 border-b border-gray-200">
            <nav className="flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("network")}
                className={`py-3 px-1 border-b-2 font-medium text-xs ${
                  activeTab === "network"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Network Interfaces
              </button>
              {/* Additional tabs will be added here as needed */}
              <button
                onClick={() => setActiveTab("about")}
                className={`py-3 px-1 border-b-2 font-medium text-xs ${
                  activeTab === "about"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                About
              </button>
            </nav>
          </div>

          <div className="mt-4">
            {activeTab === "network" && <NetworkInterfaces />}
            {activeTab === "about" && (
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <h2 className="text-lg font-bold text-gray-800 mb-2">
                  About This App
                </h2>
                <p className="text-sm text-gray-600">
                  Real-Time Speed is a network monitoring application built with
                  Tauri and React. It provides real-time information about your
                  network interfaces and performance metrics.
                </p>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Real-Time Speed App &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
