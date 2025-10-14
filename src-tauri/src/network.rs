use crate::models::{NetworkInterfaceInfo, SpeedTestResult};
use netdev::interface::get_interfaces;
use std::net::{TcpStream, SocketAddr};
use std::time::{Duration, Instant};
use std::time::SystemTime;

// Speed test constants
const DOWNLOAD_URL: &str = "http://speedtest.tele2.net/1MB.zip";
const UPLOAD_URL: &str = "http://httpbin.org/post";

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

// Real speed test implementation
pub fn perform_speed_test() -> Result<SpeedTestResult, String> {
    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();
    
    // Test ping first
    let ping = test_ping().unwrap_or(0.0);
    
    // Test download speed
    let download_speed = match test_download_speed() {
        Ok(speed) => speed,
        Err(_) => 0.0, // Return 0 if test fails
    };
    
    // Test upload speed
    let upload_speed = match test_upload_speed() {
        Ok(speed) => speed,
        Err(_) => 0.0, // Return 0 if test fails
    };
    
    Ok(SpeedTestResult {
        download_speed,
        upload_speed,
        ping,
        timestamp,
    })
}

fn test_download_speed() -> Result<f64, Box<dyn std::error::Error>> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()?;
        
    let start_time = Instant::now();
    
    let response = client.get(DOWNLOAD_URL).send()?;
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()).into());
    }
    
    let bytes = response.bytes()?;
    
    let duration = start_time.elapsed().as_secs_f64();
    if duration == 0.0 {
        return Err("Download completed too quickly to measure".into());
    }
    
    let speed_mbps = (bytes.len() as f64 * 8.0) / (duration * 1_000_000.0);
    
    Ok(speed_mbps)
}

fn test_upload_speed() -> Result<f64, Box<dyn std::error::Error>> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()?;
        
    let start_time = Instant::now();
    
    // Create 1MB of test data
    let test_data: Vec<u8> = vec![0; 1024 * 1024];
    
    let response = client
        .post(UPLOAD_URL)
        .body(test_data)
        .send()?;
        
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()).into());
    }
    
    let duration = start_time.elapsed().as_secs_f64();
    if duration == 0.0 {
        return Err("Upload completed too quickly to measure".into());
    }
    
    let speed_mbps = (1024.0 * 1024.0 * 8.0) / (duration * 1_000_000.0);
    
    Ok(speed_mbps)
}

fn test_ping() -> Result<f64, Box<dyn std::error::Error>> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()?;
        
    let start_time = Instant::now();
    
    let response = client.get("https://httpbin.org/get").send()?;
    
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()).into());
    }
    
    let duration = start_time.elapsed().as_millis() as f64;
    
    Ok(duration)
}