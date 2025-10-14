use crate::models::NetworkInterfaceInfo;
use crate::network::{
    get_all_interfaces, 
    get_active_interfaces, 
    get_internet_connected_interfaces as network_get_internet_connected_interfaces
};

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub fn get_all_network_interfaces() -> Result<Vec<NetworkInterfaceInfo>, String> {
    get_all_interfaces()
}

#[tauri::command]
pub fn get_active_network_interfaces() -> Result<Vec<NetworkInterfaceInfo>, String> {
    get_active_interfaces()
}

#[tauri::command]
pub fn get_internet_connected_interfaces() -> Result<Vec<NetworkInterfaceInfo>, String> {
    network_get_internet_connected_interfaces()
}