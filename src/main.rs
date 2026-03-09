//im gonna be real i dont understand this lmao
mod utils;
mod constants;
mod bf_interpreter;

use std::{error::Error};
use async_trait::async_trait;
use rmpv::Value;
use tokio::fs::File as TokioFile;
use nvim_rs::{
    compat::tokio::Compat, create::tokio as create, Handler, Neovim,
};
use crate::bf_interpreter::BrainfuckInterpreter;
use crate::utils::cleanup_contents;
// todo switch to a notify so its not blocking + detect infinite loops with time of execution

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
                eprintln!("eval request received");
                let code = args[0].as_str().unwrap_or("").to_string();
                let cursor = &args[1];
                let commands = cleanup_contents(&code, cursor);
                let mut interp = BrainfuckInterpreter::new();
                let result = interp.execute(&commands, String::from(""), false);

                // actually send data via nvim_exec_lua
                neovim
                    .exec_lua("require('bfDisplay-rs')._on_result(...)", vec![Value::from(result)], )
                    .await
                    .ok();
            }
            "interpret" => {
                eprintln!("interpret received, args len={}", args.len());
                let code = args[0].as_str().unwrap_or("").to_string();
                let cursor = &args[1];
                let input = &args[2];
                let commands = cleanup_contents(&code, cursor);
                let mut interp = BrainfuckInterpreter::new();
                let result = interp.execute(&commands, input.as_str().unwrap_or("").to_string(), true);

                // actually send data via nvim_exec_lua
                neovim
                    .exec_lua("require('bfDisplay-rs')._on_result_interpret(...)", vec![Value::from(result)], )
                    .await
                    .ok();
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