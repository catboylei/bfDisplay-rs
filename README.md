# bfDisplay-rs 

A Neovim plugin for live brainfuck debugging, powered by a Rust backend via msgpack-RPC.

As you move your cursor through a .bf file, the plugin displays the state of the tape up to that point in the top split, 
showing cell indices, values, the pointer position, and a warning if an infinite loop is detected.

Also includes a simple interpreter that handles i/o, through neovim user commands

![readme.png](assets/readme.png)

Note: this delegates all interpreting logic to a **non-blocking** rust binary, for speed and so that stuff like infinite loops dont lag out nvim.

After you have the plugin installed, just run ```:BfrsStart``` in nvim while viewing a ```.bf```  file to initiate the display :3

**Disclaimers:**
- the lua code is "written" by compiling ts into lua through [TypeScriptToLua](https://github.com/TypeScriptToLua/TypeScriptToLua)
- with more complex code, this kinda starts to fall apart since reinterpreting your code every time you type a character is bad\
*if you really wanna, you can just increase the step limit dont complain if it breaks or is slow tho*

---

## Installation

You may either manually install the files, or install it through lazy.nvim

if you opt for a manual installation, the baseline is you need **BOTH** compiled files in your nvim plugins directory, 
as well as calling the plugin in your init.lua.


### Option 1 - lazy.nvim (recommended)

Add this to your lazy plugins: 
```lua
{ "catboylei/bfDisplay-rs", build = "bash lazy-install.sh", opts = {} }
```
Once that is added, run :Lazy in nvim to open the lazy gui, where you can rebuild, update or debug this plugin!

Note: the build step is necessary, it downloads the actual binaries from releases since 
lazy obviously does not natively support compiling rust

### Option 2 - Manual Download

Go into [Releases](https://github.com/catboylei/bfDisplay-rs/releases), grab both the ```bfDisplay-rs.lua``` and the ```bfDisplay``` binary,
and simply place them in ```~/.config/nvim/lua/```

Then add to ```init.lua```:
```lua
require("bfDisplay-rs").setup()
```

### Option 3 - Manual Compilation (requires tstl and cargo)

This is the better option if you wish to edit constants or other customizations, simply clone the repo and then run the Makefile:

```bash
git clone https://github.com/catboylei/bfDisplay-rs.git
# cd into the main directory
make build
```
The makefile only serves to run cargo & tstl, then cp the compiled files into the nvim directory.

Then add to ```init.lua```:
```lua
require("bfDisplay-rs").setup()
```

---

## Brainfuck spec compliance + specificities

- correctly passed all compliance tests from https://brainfuck.org/
- Tape has 30,000 cells, each holding an unsigned wrapping 8 bit integer
- Pointer wraps around when going under 0 or over 29,999
- Unmatched brackets are silently ignored\
*this allows the debugger to work correctly as code is being written and is intentional*
- Live approximative infinite loop detection (max step limit, default is 1,000,000) 
- Step limit of the interpreter is 1,000,000,000

---

## Commands

```
:BfrsStart -- Force start the plugin
:BfrsStop -- Force stop the plugin
:BfrsPing -- Check if the backend is reached
:BfrsRun <input> -- Display output with given input 
```
---

## Customization

This plugin comes with various customization constants, that you can edit by running :BfrsConfig

They will default to the values listed here if the custom value is wrong.
```lua
return {
    ENABLED = true, -- whether the plugin setups at all
    AUTOSTART = true,  -- whether to autostart when opening a file with the below extensions
    PATTERNS = {"*.bf", "*.b", "*.brainfuck"}, -- file extensions (you can also use * for all)
    DISPLAY_ROWS = 1 -- amount of rows that the live cell display should show
}
```

---
## Examples

Running rot13 from [brainfuck.org](https://brainfuck.org/rot13.b) with "~mlk zyx" as input:
![img.png](assets/img.png)
Running numwarp from [brainfuck.org](https://brainfuck.org/numwarp.b) with "6" as input:
![img_1.png](assets/img_1.png)

## Todos

- add syntax highlighting (toggleable and with advanced options or else theres no point)
- add color to the cell the pointer is at
- linter... ?
- default input for cell display
- step through debug :3
- pull custom constants from a generated file
- color constants, toggle cell display constant
- move all commands under :Bfrs master command
- update readme screenshots
- optimize lua compilation cus this shit laggy af
- have interpret return printable value of control chars