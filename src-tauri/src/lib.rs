// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use netdev::interface::{get_interfaces, Interface};
use serde::{Deserialize, Serialize};
use std::net::{TcpStream, SocketAddr};
use std::time::Duration;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct NetworkInterfaceInfo {
    name: String,
    description: String,
    is_up: bool,
    is_loopback: bool,
    ip_addresses: Vec<String>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_all_network_interfaces() -> Result<Vec<NetworkInterfaceInfo>, String> {
    match std::panic::catch_unwind(|| {
        let interfaces = get_interfaces();
        let interface_info: Vec<NetworkInterfaceInfo> = interfaces
            .into_iter()
            .map(|interface| {
                // Extract all data at once to avoid borrowing issues
                let name = interface.name.clone();
                let description = interface.description.clone().unwrap_or_default();
                let is_up = interface.is_up();
                let is_loopback = interface.is_loopback();
                let ip_addresses: Vec<String> = interface
                    .ipv4.iter()
                    .map(|ip| ip.addr.to_string())
                    .chain(interface.ipv6.iter().map(|ip| ip.addr.to_string()))
                    .collect();
                
                NetworkInterfaceInfo {
                    name,
                    description,
                    is_up,
                    is_loopback,
                    ip_addresses,
                }
            })
            .collect();
        interface_info
    }) {
        Ok(result) => Ok(result),
        Err(_) => Err("Failed to retrieve network interfaces".to_string()),
    }
}

#[tauri::command]
fn get_active_network_interfaces() -> Result<Vec<NetworkInterfaceInfo>, String> {
    match std::panic::catch_unwind(|| {
        let interfaces = get_interfaces();
        let active_interfaces: Vec<NetworkInterfaceInfo> = interfaces
            .into_iter()
            .filter(|interface| {
                interface.is_up() && !interface.is_loopback()
            })
            .map(|interface| {
                // Extract all data at once to avoid borrowing issues
                let name = interface.name.clone();
                let description = interface.description.clone().unwrap_or_default();
                let is_up = interface.is_up();
                let is_loopback = interface.is_loopback();
                let ip_addresses: Vec<String> = interface
                    .ipv4.iter()
                    .map(|ip| ip.addr.to_string())
                    .chain(interface.ipv6.iter().map(|ip| ip.addr.to_string()))
                    .collect();
                
                NetworkInterfaceInfo {
                    name,
                    description,
                    is_up,
                    is_loopback,
                    ip_addresses,
                }
            })
            .collect();
        active_interfaces
    }) {
        Ok(result) => Ok(result),
        Err(_) => Err("Failed to retrieve active network interfaces".to_string()),
    }
}

#[tauri::command]
fn get_internet_connected_interfaces() -> Result<Vec<NetworkInterfaceInfo>, String> {
    match std::panic::catch_unwind(|| {
        let interfaces = get_interfaces();
        let connected_interfaces: Vec<NetworkInterfaceInfo> = interfaces
            .into_iter()
            .filter(|interface| {
                // First check if the interface is active
                if !interface.is_up() || interface.is_loopback() {
                    return false;
                }
                
                // Check if we can establish an internet connection
                check_internet_connectivity()
            })
            .map(|interface| {
                // Extract all data at once to avoid borrowing issues
                let name = interface.name.clone();
                let description = interface.description.clone().unwrap_or_default();
                let is_up = interface.is_up();
                let is_loopback = interface.is_loopback();
                let ip_addresses: Vec<String> = interface
                    .ipv4.iter()
                    .map(|ip| ip.addr.to_string())
                    .chain(interface.ipv6.iter().map(|ip| ip.addr.to_string()))
                    .collect();
                
                NetworkInterfaceInfo {
                    name,
                    description,
                    is_up,
                    is_loopback,
                    ip_addresses,
                }
            })
            .collect();
        connected_interfaces
    }) {
        Ok(result) => Ok(result),
        Err(_) => Err("Failed to retrieve internet connected interfaces".to_string()),
    }
}

// Note: True interface-specific connectivity testing would require more complex
// routing manipulation which is beyond the scope of this application.
// This simplified version checks general internet connectivity.
fn check_internet_connectivity() -> bool {
    // Try to connect to Google's DNS server (8.8.8.8) on port 53
    let addrs = [
        SocketAddr::from(([8, 8, 8, 8], 53)),  // Google DNS
        SocketAddr::from(([1, 1, 1, 1], 53)),  // Cloudflare DNS
    ];
    
    // Try each address with a timeout
    for addr in &addrs {
        if let Ok(_) = TcpStream::connect_timeout(addr, Duration::from_secs(3)) {
            return true;
        }
    }
    
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_all_network_interfaces,
            get_active_network_interfaces,
            get_internet_connected_interfaces
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}