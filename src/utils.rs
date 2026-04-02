use std::sync::atomic::Ordering;
use rmpv::Value;
use crate::bf_interpreter::{InterpreterResult, RpcResult};
use crate::constants::{BF_COMMANDS, COLUMNS, CONTROL_CHARS, DEFAULT_INPUT};

pub fn cleanup_contents(content: &str, cursor_pos: &Value) -> Vec<char> {
    content
        .chars()
        .filter(|c| BF_COMMANDS.contains(c))
        .take(get_command_offset(content, cursor_pos))
        .collect()
}

// get amount of commands before cursor pos
pub fn get_command_offset(content: &str, cursor_pos: &Value) -> usize {
    let cursor_row = cursor_pos[0].as_u64().unwrap_or(0) as usize; // 1-indexed
    let cursor_col = cursor_pos[1].as_u64().unwrap_or(0) as usize; // 0-indexed
    let mut count = 0;

    for (row, line) in content.lines().enumerate() {
        let row = row + 1; // make 1-indexed to match nvim (lua)
        let end_col = if row == cursor_row { cursor_col } else { line.len() };
        for col in 0..end_col {
            if BF_COMMANDS.contains(&line.chars().nth(col).unwrap_or(' ')) { count += 1; }
        }
        if row == cursor_row { break; }
    }
    count
}

pub fn format_cell_display(result: &InterpreterResult) -> Vec<String> {
    let cell_width: usize = 8;
    let cells_per_row: usize = (COLUMNS.load(Ordering::Relaxed) / cell_width as i32 ) as usize;
    let tape = result.tape;
    let ptr = result.pointer;
    let mut display_lines: Vec<String> = Vec::new();

    let mut row = 0;
    while row * cells_per_row < tape.len() {
        let slice = &tape[row * cells_per_row .. ((row + 1) * cells_per_row).min(tape.len())];

        let cell_nums: Vec<String> = slice.iter().enumerate().map(|(i, _)| fmt(row * cells_per_row + i)).collect();
        let cell_vals: Vec<String> = slice.iter().map(|&v| fmt(v as usize)).collect();
        let cell_ascii: Vec<String> = slice.iter().map(|&v| fmt_ascii(v as usize)).collect();
        let ptr_row: Vec<&str> = slice.iter().enumerate().map(|(i, _)| if row * cells_per_row + i == ptr { "   ^    " } else { "        " }).collect();

        display_lines.push(cell_nums.join("|"));
        display_lines.push(cell_vals.join("|"));
        display_lines.push(cell_ascii.join("|"));
        display_lines.push(ptr_row.join(""));
        display_lines.push(fmt_input(DEFAULT_INPUT.read().unwrap().to_string(), COLUMNS.load(Ordering::Relaxed)));

        row += 1;
    }

    display_lines
}

fn fmt_input(input: String, width: i32) -> String {
    let meow = format!("Default input: \"{input}\"");
    let len = meow.len();
    let w = width as usize;

    let left = (w - len) / 2;
    let right = w - len - left;
    " ".repeat(left) + &meow + &" ".repeat(right)
}

fn fmt(n: usize) -> String {
    let s = n.to_string();
    let left = (7 - s.len() + 1) / 2;
    let right = 7 - s.len() - left;
    " ".repeat(left) + &*s + &*" ".repeat(right)
}

fn fmt_ascii(n: usize) -> String {
    let paws;
    let s: &str = if n >= 32 && n <= 126 {
        paws = (n as u8 as char).to_string();
        &paws
    } else if n <= 31 { CONTROL_CHARS[n] }
    else if n == 127 { "DEL" }
    else { "?" };

    let left = (7 - s.len() + 1) / 2;
    let right = 7 - s.len() - left;
    " ".repeat(left) + &*s + &*" ".repeat(right)
}

pub fn format_output(output: String, warning: bool) -> Vec<String> {
    let width = (COLUMNS.load(Ordering::Relaxed) as f64 * 0.3).floor() as usize;

    let mut centered_lines = Vec::new();
    for line in output.split("\n") {
        centered_lines.push(format!("{:^width$}", line))
    }

    if warning { centered_lines.push("timed out :c".to_string())}

    centered_lines
}

impl From<RpcResult> for Value {
    fn from(result: RpcResult) -> Value {
        Value::Map(vec![
            (Value::from("cell_display"), Value::Array(result.display_lines.iter().map(|s| Value::from(s.as_str())).collect())),
            (Value::from("pointer"), Value::from(result.pointer)),
            (Value::from("warning"), Value::from(result.inf_loop_warning)),
            (Value::from("output"), Value::Array(result.display_lines.iter().map(|s| Value::from(s.as_str())).collect()))
        ])
    }
}