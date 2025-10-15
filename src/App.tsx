import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";

export default function App() {
  const [message, setMessage] = useState<string>("Click the button to fetch data");

  const fetchData = async () => {
    try {
      const result = await invoke<string>("greet");
      setMessage(result);
    } catch (error) {
      console.error("Error calling greet command:", error);
      setMessage("Error loading message");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-auto mt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Tauri App</h1>
        <p className="text-gray-600 text-lg text-center mb-6">{message}</p>
        <button 
          onClick={fetchData}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg w-full transition-colors duration-200"
        >
          Fetch Data from Rust
        </button>
      </div>
    </div>
  );
}
