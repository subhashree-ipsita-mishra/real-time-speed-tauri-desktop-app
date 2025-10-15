import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

interface GreetingCardProps {
  initialMessage?: string;
}

export default function GreetingCard({ initialMessage = "Click the button to fetch data" }: GreetingCardProps) {
  const [greetingMessage, setGreetingMessage] = useState<string>(initialMessage);

  const fetchData = async () => {
    try {
      const result = await invoke<string>("greet");
      setGreetingMessage(result);
    } catch (error) {
      console.error("Error calling greet command:", error);
      setGreetingMessage("Error loading message");
    }
  };

  return (
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
  );
}