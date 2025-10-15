use std::process::Command;
use tauri::command;

#[command]
pub async fn get_time_from_powershell() -> Result<String, String> {
    // Get current time in HH:MM:SS format from PowerShell
    let output = Command::new("powershell")
        .args(&["-Command", "Get-Date -Format 'HH:mm:ss'"])
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