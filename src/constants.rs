use std::sync::atomic::AtomicI32;

pub const BF_COMMANDS: [char; 8] = ['>', '<', '+', '-', '[', ']', '.', ','];
pub const MAX_STEPS: usize = 1_000_000;
pub const MAX_STEPS_LONG: usize = 1_000_000_000;
pub const CONTROL_CHARS: [&str; 32] = [ // not hashmap because they just correspond to index :3
    "NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL",
    "BS",  "HT",  "LF",  "VT",  "FF",  "CR",  "SO",  "SI",
    "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB",
    "CAN", "EM",  "SUB", "ESC", "FS",  "GS",  "RS",  "US",
];

pub static COLUMNS: AtomicI32 = AtomicI32::new(200);