use std::collections::HashMap;
use crate::constants::{MAX_STEPS, MAX_STEPS_LONG};

pub struct InterpreterResult {
    pub tape: [u8; 30_000],
    pub pointer: usize,
    pub infinite_loop_warning: bool,
    pub output: String
}

pub struct BrainfuckInterpreter {
    tape: [u8; 30_000],
    pointer: usize,
    loops: HashMap<usize, usize>, // bidirectional: [ -> ] and ] -> [
    pc: usize,
    steps: usize,
    output: String,
    input: Vec<u8>,
}

impl BrainfuckInterpreter {
    pub fn new() -> Self {
        BrainfuckInterpreter {
            tape: [0u8; 30_000],
            pointer: 0,
            loops: HashMap::new(),
            pc: 0,
            steps: 0,
            output: String::from(""),
            input: Vec::new()
        }
    }

    pub fn execute(&mut self, code: &[char], input: String, do_long: bool) -> InterpreterResult {
        self.tape = [0u8; 30_000];
        self.pointer = 0;
        self.pc = 0;
        self.steps = 0;
        self.loops = HashMap::new();
        self.input = input.bytes().collect();

        self.map_loops(code);

        let infinite_loop_warning = self.run_code(code, do_long);

        InterpreterResult {
            tape: self.tape,
            pointer: self.pointer,
            infinite_loop_warning,
            output: self.output.clone()
        }
    }

    // map loops into self.loops and ignore unmatched brackets
    fn map_loops(&mut self, code: &[char]) {
        let mut stack: Vec<usize> = Vec::new();
        for (i, &ch) in code.iter().enumerate() {
            match ch {
                '[' => stack.push(i),
                ']' => {
                    if let Some(start) = stack.pop() {
                        self.loops.insert(start, i); // [ -> ]
                        self.loops.insert(i, start); // ] -> [
                    }
                }
                _ => {}
            }
        }
    }

    fn run_code(&mut self, chars: &[char], do_long: bool) -> bool {
        let steps = if do_long { MAX_STEPS_LONG } else { MAX_STEPS };

        while self.pc < chars.len() {
            if self.steps >= steps { return true; } // infinite loop detected or too many instructions in which case uh make the const bigger idk
            self.steps += 1;

            match chars[self.pc] {
                '>' => { self.pointer = (self.pointer + 1) % self.tape.len() } // increase pointer by 1, wrapping at the length of the tape (so 30k)
                '<' => { self.pointer = (self.pointer + self.tape.len() - 1) % self.tape.len() } // kinda evil math to do the same as above but minus
                '+' => self.tape[self.pointer] = self.tape[self.pointer].wrapping_add(1),
                '-' => self.tape[self.pointer] = self.tape[self.pointer].wrapping_sub(1),
                '[' => { if self.tape[self.pointer] == 0 { if let Some(&target) = self.loops.get(&self.pc) { self.pc = target; } else { break; } } }
                ']' => { if self.tape[self.pointer] > 0 { if let Some(&target) = self.loops.get(&self.pc) { self.pc = target; } } }
                '.' => { self.output.push(self.tape[self.pointer] as char) }
                ',' => { 
                    if self.input.is_empty() {
                        self.tape[self.pointer] = 0;
                    } else {
                        self.tape[self.pointer] = self.input.remove(0);
                    }
                }
                _ => {}
            }
            self.pc += 1;
        }
        false
    }
}