// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod models;
mod network;
mod commands;

use tauri_plugin_opener;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::get_all_network_interfaces,
            commands::get_active_network_interfaces,
            commands::get_internet_connected_interfaces,
            commands::run_speed_test,
            commands::get_interface_speed_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}