import { ping_backend, setupSyntax } from './utils';
import { getConfigOrDefault, openConfigFile, updateOrCreateConfig } from './config';
import { state } from './state';
import {createCellWindow, closeCellWindow, closeWarningWindow, closeOutputWindow, updateWarningWindow,} from './ui';
import { send_rpc_evaluate, send_rpc_interpret } from './rpc';

export function setup(): void {
    if (!getConfigOrDefault("ENABLED")) return;
    updateOrCreateConfig();

    vim.api.nvim_create_user_command('Bfrs', ((input: any) => {
        const cmd = input.fargs[1];
        if (cmd === 'run') { send_rpc_interpret(input.fargs[2]);}
        else if (cmd === 'start') {start();}
        else if (cmd === 'stop') {stop();}
        else if (cmd === 'config') {openConfigFile();}
        else if (cmd === 'ping') {ping_backend();}
    }) as any, {nargs: '+'});

    if (getConfigOrDefault("AUTOSTART")) {
        state.autostart_id = vim.api.nvim_create_autocmd('BufEnter' as any, {
            pattern: getConfigOrDefault("PATTERNS"),
            callback: () => {
                if (state.job_id === null) {
                    vim.api.nvim_command('Bfrs start');
                }
            },
        });
    }
}

export function start(): void {
    if ( state.job_id != null ) return;
    vim.api.nvim_buf_set_option(0, 'filetype', 'brainfuck' as any); // apply syntax highlight
    setupSyntax()

    state.job_id = vim.fn.jobstart([state.script_dir + '/bfDisplay'], {
        rpc: true,
        env: { RUST_BACKTRACE: 'full' },
        on_exit: (_: unknown, code: number) => {
            vim.api.nvim_notify('Plugin exited with code: ' + code, vim.log.levels.INFO, {});
        },
        on_stderr: (_: unknown, data: string[]) => {
            const filtered = data.filter((line) => line !== '');
            if (filtered.length === 0) return;
            vim.fn.writefile(filtered, '/tmp/bfDisplay.log', 'a');
        },
    });

    vim.fn.rpcnotify(state.job_id, 'update_columns', state.columns);

    state.main_window_id = vim.api.nvim_get_current_win();
    createCellWindow();
    send_rpc_evaluate()

    // here goes the autocmds
    vim.api.nvim_create_autocmd('WinEnter' as any, {
            callback: () => {
                if (
                    vim.api.nvim_get_current_win() === state.cell_win_id &&
                    vim.api.nvim_win_is_valid(state.main_window_id!)
                ) {
                    vim.api.nvim_set_current_win(state.main_window_id!);
                }
            },
        }
    );
    vim.api.nvim_create_autocmd([ "CursorMoved", "CursorMovedI", "TextChanged", "TextChangedI" ] as any, {
        pattern: getConfigOrDefault("PATTERNS"),
        callback: send_rpc_evaluate
    });
    vim.api.nvim_create_autocmd("QuitPre" as any, {
        callback: stop
    })
    vim.api.nvim_create_autocmd("WinResized" as any, {
        callback: () => {
            if (state.job_id === null) return;
            state.columns = vim.api.nvim_get_option('columns') as any as number;
            state.lines = vim.api.nvim_get_option('lines') as any as number;

            vim.fn.rpcnotify(state.job_id, 'update_columns', state.columns)
            send_rpc_evaluate()
            updateWarningWindow()
            closeOutputWindow() // the warning window can go explode i am lazy
        }
    })

    vim.api.nvim_notify('Bfrs started, job_id: ' + state.job_id, vim.log.levels.INFO, {});
}

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
    closeCellWindow(); // kill tape display
    closeWarningWindow(); // kill warning window (if one)
    closeOutputWindow();  // kill output window (if one)
    vim.api.nvim_buf_set_option(0, 'filetype', 'unknown' as any); // remove syntax highlight
}