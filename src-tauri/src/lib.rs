mod commands;
mod time_commands;

use tauri_plugin_opener;

#[tauri::command]
async fn greet() -> String {
    "Hello from Rust backend!".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::run_powershell_script,
            time_commands::get_time_from_powershell
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}