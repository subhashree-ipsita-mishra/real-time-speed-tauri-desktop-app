// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use network_interface::{NetworkInterface, NetworkInterfaceConfig};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_list_of_network_interfaces() -> Result<Vec<String>, String> {
    match NetworkInterface::show() {
        Ok(interfaces) => {
            let interface_names: Vec<String> = interfaces
                .into_iter()
                .map(|interface| interface.name)
                .collect();
            Ok(interface_names)
        }
        Err(e) => Err(format!("Failed to get network interfaces: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_list_of_network_interfaces])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}