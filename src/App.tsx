import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";

export default function App() {
  const [greetingMessage, setGreetingMessage] = useState<string>("Click the button to fetch data");
  const [powershellOutput, setPowershellOutput] = useState<string>("Click the button to run PowerShell script");

  const fetchData = async () => {
    try {
      const result = await invoke<string>("greet");
      setGreetingMessage(result);
    } catch (error) {
      console.error("Error calling greet command:", error);
      setGreetingMessage("Error loading message");
    }
  };

  const runPowerShellScript = async () => {
    try {
      setPowershellOutput("Running PowerShell script...");
      const result = await invoke<string>("run_powershell_script");
      setPowershellOutput(result);
    } catch (error) {
      console.error("Error running PowerShell script:", error);
      setPowershellOutput("Error running PowerShell script");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Tauri App</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Greeting Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Rust Greeting</h2>
          <p className="text-gray-600 mb-4 text-center">{greetingMessage}</p>
          <button 
            onClick={fetchData}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg w-full transition-colors duration-200"
          >
            Fetch Data from Rust
          </button>
        </div>

        {/* PowerShell Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">PowerShell Script</h2>
          <p className="text-gray-600 mb-4 text-center">{powershellOutput}</p>
          <button 
            onClick={runPowerShellScript}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg w-full transition-colors duration-200"
          >
            Run PowerShell Script
          </button>
        </div>
      </div>
    </div>
  );
}
