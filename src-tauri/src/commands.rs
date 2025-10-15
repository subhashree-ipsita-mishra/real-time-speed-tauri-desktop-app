use std::process::Command;
use tauri::command;

#[command]
pub async fn run_powershell_script() -> Result<String, String> {
    // Example PowerShell script - you can customize this as needed
    let output = Command::new("powershell")
        .args(&["-Command", "Get-Date; Write-Output 'Hello from PowerShell!'"])
        .output()
        .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;

    let stdout = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to parse output: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8(output.stderr)
            .unwrap_or_else(|_| "Failed to parse error output".to_string());
        return Err(format!("PowerShell script failed: {}", stderr));
    }

    Ok(stdout)
}