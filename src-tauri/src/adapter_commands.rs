use std::process::Command;
use tauri::command;

#[command]
pub async fn get_network_adapters() -> Result<String, String> {
    // Get network adapters that are currently up using PowerShell
    // Output as CSV for easier parsing
    // Added InterfaceType to identify if it's WiFi, Ethernet, etc.
    let ps_script = r#"
    Get-NetAdapter | 
    Where-Object { 
        $_.Status -eq "Up" -and 
        $_.InterfaceDescription -notlike "*Virtual*" -and
        $_.InterfaceDescription -notlike "*VMware*" -and
        $_.InterfaceDescription -notlike "*Hyper-V*" -and
        $_.InterfaceDescription -notlike "*Loopback*" -and
        $_.InterfaceDescription -notlike "*VirtualBox*" -and
        $_.Name -notlike "*Bluetooth*" -and
        $_.Name -notlike "*isatap*" -and
        $_.Name -notlike "*teredo*" -and
        $_.Name -notlike "*6TO4*" -and
        $_.MediaConnectionState -eq "Connected"
    } | 
    Sort-Object LinkSpeed -Descending |
    Select-Object -First 3 Name, InterfaceDescription, ifIndex, LinkSpeed, InterfaceType | 
    ConvertTo-Csv -NoTypeInformation
    "#;
    let output = Command::new("powershell")
        .args(&["-Command", ps_script])
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