use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=src/");
    // runs after every build
    Command::new("cp")
        .args(["-f /home/lei/CLionProjects/untitled/target/debug/bfDisplay", "/home/lei/.config/nvim/lua/bfDisplay"])
        .output()
        .ok();
    println!("moved the guy")
}