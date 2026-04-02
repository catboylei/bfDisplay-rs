//im gonna be real i dont understand this lmao
mod utils;
mod constants;
mod bf_interpreter;

use std::{error::Error};
use std::sync::atomic::Ordering;
use async_trait::async_trait;
use rmpv::Value;
use tokio::fs::File as TokioFile;
use nvim_rs::{
    compat::tokio::Compat, create::tokio as create, Handler, Neovim,
};
use crate::bf_interpreter::{BrainfuckInterpreter, RpcResult};
use crate::constants::{COLUMNS, DEFAULT_INPUT};
use crate::utils::{cleanup_contents, format_cell_display, format_output};

#[derive(Clone)]
struct NeovimHandler {}

#[async_trait]
impl Handler for NeovimHandler {
    type Writer = Compat<TokioFile>;

    async fn handle_notify(
        &self,
        name: String,
        args: Vec<Value>,
        neovim: Neovim<Compat<TokioFile>>,
    ) {
        match name.as_ref() {
            "evaluate" => {
                let code = args[0].as_str().unwrap_or("").to_string();
                let cursor = &args[1];
                let commands = cleanup_contents(&code, cursor);
                let mut interp = BrainfuckInterpreter::new();
                let interp_result = interp.execute(&commands, DEFAULT_INPUT.read().unwrap().to_string(), false);

                let result = RpcResult {
                    display_lines: format_cell_display(&interp_result),
                    pointer: interp_result.pointer,
                    inf_loop_warning: interp_result.infinite_loop_warning,
                    output: Vec::new()
                };

                // actually send data via nvim_exec_lua
                neovim
                    .exec_lua("require('bfDisplay-rs').on_rpc_return_evaluate(...)", vec![Value::from(result)], )
                    .await
                    .ok();
            }
            "interpret" => {
                let code = args[0].as_str().unwrap_or("").to_string();
                let cursor = &args[1];
                let input = args.get(2).and_then(|v| v.as_str()).unwrap_or("").to_string();
                let commands = cleanup_contents(&code, cursor);
                let mut interp = BrainfuckInterpreter::new();
                let interp_result = interp.execute(&commands, input, true);

                let result = format_output(interp_result.output, interp_result.infinite_loop_warning);
                
                // actually send data via nvim_exec_lua
                neovim
                    .exec_lua("require('bfDisplay-rs').on_rpc_return_interpret(...)", vec![Value::Array(result.iter().map(|s| Value::from(s.as_str())).collect())], )
                    .await
                    .ok();
            }
            "ping" => {
                eprintln!("received ping");
                neovim
                    .exec_lua("require('bfDisplay-rs').receive_ping(...)", vec![Value::from("pong")], )
                    .await
                    .ok();
                eprintln!("sent pong");
            }
            "update_columns" => {
                COLUMNS.store(args[0].as_i64().unwrap_or(200) as i32, Ordering::Relaxed);
            }
            "update_input" => {
                let mut input = DEFAULT_INPUT.write().unwrap();
                *input = args[0].as_str().unwrap_or("meow").to_string();
                drop(input);
            }
            _ => {}
        }
    }
}

// error handling slop
#[tokio::main]
async fn main() {
    let handler: NeovimHandler = NeovimHandler {};
    let (nvim, io_handler) = create::new_parent(handler).await.unwrap();

    match io_handler.await {
        Err(joinerr) => eprintln!("Error joining IO loop: '{}'", joinerr),
        Ok(Err(err)) => {
            if !err.is_reader_error() {
                nvim.err_writeln(&format!("Error: '{}'", err))
                    .await
                    .unwrap_or_else(|e| { eprintln!("Well, dang... '{}'", e); });
            }

            if !err.is_channel_closed() {
                eprintln!("Error: '{}'", err);
                let mut source = err.source();

                while let Some(e) = source {
                    eprintln!("Caused by: '{}'", e);
                    source = e.source();
                }
            }
        }
        Ok(Ok(())) => {}
    }
}