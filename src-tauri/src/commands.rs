use crate::models::{NetworkInterfaceInfo, SpeedTestResult, InterfaceSpeedData};
use crate::network::{
    get_all_interfaces, 
    get_active_interfaces, 
    get_internet_connected_interfaces as network_get_internet_connected_interfaces,
    perform_speed_test,
    monitor_interface_speed
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

#[tauri::command]
pub fn run_speed_test() -> Result<SpeedTestResult, String> {
    perform_speed_test()
}

#[tauri::command]
pub fn get_interface_speed_data(interface_name: &str) -> Result<InterfaceSpeedData, String> {
    monitor_interface_speed(interface_name)
}
