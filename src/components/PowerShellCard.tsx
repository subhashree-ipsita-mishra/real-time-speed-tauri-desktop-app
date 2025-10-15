import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

interface PowerShellCardProps {
  initialMessage?: string;
}

export default function PowerShellCard({ initialMessage = "Click the button to run PowerShell script" }: PowerShellCardProps) {
  const [powershellOutput, setPowershellOutput] = useState<string>(initialMessage);

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
  );
}