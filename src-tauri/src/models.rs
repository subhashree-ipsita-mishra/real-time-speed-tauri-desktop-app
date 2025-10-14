use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NetworkInterfaceInfo {
    pub name: String,
    pub description: String,
    pub is_up: bool,
    pub is_loopback: bool,
    pub ip_addresses: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SpeedTestResult {
    pub download_speed: f64, // Mbps
    pub upload_speed: f64,   // Mbps
    pub ping: f64,           // ms
    pub timestamp: u64,      // Unix timestamp
}