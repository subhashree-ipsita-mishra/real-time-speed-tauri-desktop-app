use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NetworkInterfaceInfo {
    pub name: String,
    pub description: String,
    pub is_up: bool,
    pub is_loopback: bool,
    pub ip_addresses: Vec<String>,
}