import { ping_backend } from './utils';
import { getConfigOrDefault, openConfigFile, updateOrCreateConfig } from './config';
import { state } from './state';
import {createCellWindow, closeCellWindow, closeWarningWindow, closeOutputWindow, updateWarningWindow,} from './ui';
import { send_rpc_evaluate, send_rpc_interpret } from './rpc';

export function setup(): void {
    if (!getConfigOrDefault("ENABLED")) return;
    updateOrCreateConfig();

    vim.api.nvim_create_user_command('BfrsPing', (() => ping_backend()) as any, {});
    vim.api.nvim_create_user_command('BfrsRun', ((input: any) => send_rpc_interpret(input.args)) as any, { nargs: '?'});
    vim.api.nvim_create_user_command('BfrsStart', (() => start()) as any, {});
    vim.api.nvim_create_user_command('BfrsStop', (() => stop()) as any, {});
    vim.api.nvim_create_user_command('BfrsConfig', (() => openConfigFile()) as any, {});

    if (getConfigOrDefault("AUTOSTART")) {
        state.autostart_id = vim.api.nvim_create_autocmd('BufEnter' as any, {
            pattern: getConfigOrDefault("PATTERNS"),
            callback: () => {
                if (state.job_id === null) {
                    vim.api.nvim_command('BfrsStart');
                }
            },
        });
    }
}

function start(): void {
    if ( state.job_id != null ) return;

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

function stop(): void {
    if ( state.job_id != null ) {
        vim.fn.jobstop(state.job_id)
        state.job_id = null;
        vim.api.nvim_notify('stopped Bfrs', vim.log.levels.INFO, {});
    }
    if (state.autostart_id !== null) {
        vim.api.nvim_del_autocmd(state.autostart_id);
        state.autostart_id = null;
    }
    closeCellWindow()
    closeWarningWindow()
    closeOutputWindow()
}
