import React, { useState } from "react";

interface SpeedTestResult {
  download_speed: number;
  upload_speed: number;
  ping: number;
  timestamp: number;
}

const SpeedTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  const runSpeedTest = async () => {
    setIsTesting(true);
    setError(null);
    setResult(null);
    setProgress("Testing download speed...");

    try {
      // Import the Tauri command
      const { invoke } = await import("@tauri-apps/api/core");

      // Run the speed test
      const speedTestResult: SpeedTestResult = await invoke("run_speed_test");
      setResult(speedTestResult);
      setProgress("");
    } catch (err) {
      setError("Failed to run speed test. Please try again.");
      setProgress("");
      console.error(err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Network Speed Test
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Check your current network performance including download, upload speeds
        and ping.
      </p>

      <div className="flex flex-col items-center justify-center mb-8">
        <button
          onClick={runSpeedTest}
          disabled={isTesting}
          className={`px-6 py-3 rounded-lg font-medium text-white ${
            isTesting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 transform hover:scale-105 transition-all duration-200"
          } transition-colors duration-200 mb-4`}
        >
          {isTesting ? "Testing..." : "Check Speed"}
        </button>

        {isTesting && progress && (
          <div className="text-gray-600 text-sm animate-pulse">{progress}</div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-fade-in">
          <p className="text-red-700 text-center">{error}</p>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
          <div className="bg-blue-50 rounded-lg p-4 text-center transform transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Download
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {result.download_speed.toFixed(2)}{" "}
              <span className="text-lg">Mbps</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Megabits per second</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 text-center transform transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Upload
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {result.upload_speed.toFixed(2)}{" "}
              <span className="text-lg">Mbps</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Megabits per second</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 text-center transform transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Ping</h3>
            <p className="text-3xl font-bold text-purple-600">
              {result.ping.toFixed(2)} <span className="text-lg">ms</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Milliseconds</p>
          </div>
        </div>
      )}

      {!result && !isTesting && !error && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Click "Check Speed" to run a network speed test
          </p>
        </div>
      )}

      {result && (
        <div className="mt-6 text-center text-xs text-gray-500">
          Test completed at {new Date(result.timestamp * 1000).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default SpeedTest;
