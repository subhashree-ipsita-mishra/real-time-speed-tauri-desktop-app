use std::process::Command;
use tauri::command;

#[command]
pub async fn get_network_adapters() -> Result<String, String> {
    // Get network adapters that are currently up using PowerShell
    // Output as CSV for easier parsing
    // Added InterfaceType to identify if it's WiFi, Ethernet, etc.
    let output = Command::new("powershell")
        .args(&["-Command", "Get-NetAdapter | Where-Object Status -eq 'Up' | Select-Object Name, InterfaceDescription, ifIndex, LinkSpeed, InterfaceType | ConvertTo-Csv -NoTypeInformation"])
        .output()
        .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;

    let stdout = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to parse output: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8(output.stderr)
            .unwrap_or_else(|_| "Failed to parse error output".to_string());
        return Err(format!("PowerShell script failed: {}", stderr));
    }

    // Clean up the output by removing any trailing newline or carriage return
    Ok(stdout.trim().to_string())
}