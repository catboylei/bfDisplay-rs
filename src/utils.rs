use rmpv::Value;
use crate::bf_interpreter::InterpreterResult;
use crate::constants::BF_COMMANDS;

pub fn cleanup_contents(content: &str, cursor_pos: &Value) -> Vec<char> {
    content
        .chars()
        .filter(|c| BF_COMMANDS.contains(c))
        .take(get_command_offset(content, cursor_pos))
        .collect()
}

// get amount of commands before cursor pos
// yeah this is a terrible way to do it but im tired
// todo fix
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

impl From<InterpreterResult> for Value {
    fn from(result: InterpreterResult) -> Value {
        Value::Map(vec![
            (Value::from("tape"), Value::Array(result.tape.iter().map(|&v| Value::from(v)).collect())),
            (Value::from("pointer"), Value::from(result.pointer)),
            (Value::from("warning"), Value::from(result.infinite_loop_warning))
        ])
    }
}