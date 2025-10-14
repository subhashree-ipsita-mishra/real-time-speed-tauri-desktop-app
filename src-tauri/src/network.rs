use crate::models::NetworkInterfaceInfo;
use netdev::interface::get_interfaces;
use std::net::{TcpStream, SocketAddr};
use std::time::Duration;

pub fn get_all_interfaces() -> Result<Vec<NetworkInterfaceInfo>, String> {
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

pub fn get_active_interfaces() -> Result<Vec<NetworkInterfaceInfo>, String> {
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

pub fn get_internet_connected_interfaces() -> Result<Vec<NetworkInterfaceInfo>, String> {
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