use tauri_plugin_opener;

#[tauri::command]
async fn greet() -> String {
    "Hello from Rust backend!".to_string()
}

#[tauri::command]
async fn run_powershell_script() -> Result<String, String> {
    use std::process::Command;
    
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            run_powershell_script
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}