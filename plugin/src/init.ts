import { ping_backend, setupSyntax } from './utils';
import { getConfigOrDefault, openConfigFile, updateOrCreateConfig } from './config';
import { state } from './state';
import {createCellWindow, closeCellWindow, closeWarningWindow, closeOutputWindow, updateWarningWindow,} from './ui';
import { send_rpc_evaluate, send_rpc_interpret } from './rpc';

// initial setup of the plugin, called in init.lua
export function setup(): void {
    updateOrCreateConfig();
    if (!getConfigOrDefault("ENABLED")) return; // abort module setup if toggled off in settings

    vim.api.nvim_create_user_command('Bfrs', ((input: any) => { // setup all commands for the plugin
        const cmd = input.fargs[1];
        if (cmd === 'run') { send_rpc_interpret(input.fargs[2]);}
        else if (cmd === 'start') {start();}
        else if (cmd === 'stop') {stop();}
        else if (cmd === 'config') {openConfigFile();}
        else if (cmd === 'ping') {ping_backend();}
        else if (cmd === 'default') {vim.fn.rpcnotify(state.job_id, "update_input", input.fargs[2]);}
    }) as any, {nargs: '+'});

    if (getConfigOrDefault("AUTOSTART")) { // set up the autostart if option is true
        state.autostart_id = vim.api.nvim_create_autocmd('BufEnter' as any, {
            pattern: getConfigOrDefault("PATTERNS"),
            callback: () => {if (state.job_id === null) {vim.api.nvim_command('Bfrs start');}},
        });
    }
}

// actual start of the plugin, called on :Bfrs start OR autostart set up above
export function start(): void {
    if ( state.job_id != null ) return; // abort start if already running

    vim.api.nvim_buf_set_option(0, 'filetype', 'brainfuck' as any); // apply syntax highlight
    setupSyntax()

    state.job_id = vim.fn.jobstart([state.script_dir + '/bfDisplay'], { // connect to the rust backend
        rpc: true,
        env: { RUST_BACKTRACE: 'full' },
        on_stderr: (_: unknown, data: string[]) => { // log all rust errors (and eprintln) to /tmp/bfDisplay.log
            const filtered = data.filter((line) => line !== '');
            if (filtered.length === 0) return;
            vim.fn.writefile(filtered, '/tmp/bfDisplay.log', 'a');
        },
    });

    vim.fn.rpcnotify(state.job_id, 'update_columns', state.columns); // store width of nvim window in backend
    vim.fn.rpcnotify(state.job_id, 'update_input', 'meow') // set the default input

    state.main_window_id = vim.api.nvim_get_current_win(); // store main window id

    createCellWindow(); // init cell display
    send_rpc_evaluate()

    // here goes the autocmds
    vim.api.nvim_create_autocmd('WinEnter' as any, { // make cell display not clickable (send u back if u do)
            callback: () => {
                if (vim.api.nvim_get_current_win() === state.cell_win_id &&
                    vim.api.nvim_win_is_valid(state.main_window_id!)
                ) {vim.api.nvim_set_current_win(state.main_window_id!);}
            },
        }
    );
    vim.api.nvim_create_autocmd([ "CursorMoved", "CursorMovedI", "TextChanged", "TextChangedI" ] as any, { // if anything happens, request cell display update
        pattern: getConfigOrDefault("PATTERNS"),
        callback: send_rpc_evaluate
    });
    vim.api.nvim_create_autocmd("QuitPre" as any, { // call cleanup function when :q or :qa or whatever
        callback: stop
    })
    vim.api.nvim_create_autocmd("WinResized" as any, { // update... things when nvim resized
        callback: () => {
            if (state.job_id === null) return;
            state.columns = vim.api.nvim_get_option('columns') as any as number;
            state.lines = vim.api.nvim_get_option('lines') as any as number;

            vim.fn.rpcnotify(state.job_id, 'update_columns', state.columns)
            send_rpc_evaluate()
            updateWarningWindow()
            closeOutputWindow()
        }
    })

    vim.api.nvim_notify('Bfrs started, job_id: ' + state.job_id, vim.log.levels.INFO, {});
}

// cleanup function
export function stop(): void {
    if (state.job_id != null) { // kill backend
        vim.fn.jobstop(state.job_id);
        state.job_id = null;
        vim.api.nvim_notify('stopped Bfrs', vim.log.levels.INFO, {});
    }
    if (state.autostart_id !== null) { // remove autostart
        vim.api.nvim_del_autocmd(state.autostart_id);
        state.autostart_id = null;
    }
    closeCellWindow(); // kill tape display (if one)
    closeWarningWindow(); // kill warning window (if one)
    closeOutputWindow();  // kill output window (if one)
    vim.api.nvim_buf_set_option(0, 'filetype', 'unknown' as any); // remove syntax highlight
}