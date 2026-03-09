import { ping } from './utils';
import { AUTOSTART, PATTERNS } from './constants';
import { state } from './state';
import { createCellWindow, updateCellDisplay } from './ui';

export function setup(): void {
    vim.api.nvim_create_user_command('BfrsPing', (() => ping()) as any, {});
    vim.api.nvim_create_user_command('BfrsStart', (() => start()) as any, {});
    vim.api.nvim_create_user_command('BfrsStop', (() => stop()) as any, {});

    if (AUTOSTART) {
        vim.api.nvim_create_autocmd('BufEnter' as any, {
            pattern: PATTERNS,
            callback: () => {
                if (state.job_id === null) start();
            },
        });
    }
}

function start(): void {
    state.job_id = 67;
    state.main_window_id = vim.api.nvim_get_current_win();
    createCellWindow();
    updateCellDisplay(state.tape, state.pointer, false);
    //(vim.opt as any).mousescroll = 'ver:4,hor:6'; // all stuff like this is because whoever made the ts nvim mappings failed at their job

    // here goes the autocmds
    vim.api.nvim_create_autocmd(
        'WinEnter' as any,
        {
            callback: () => {
                if (vim.api.nvim_get_current_win() === state.cell_win_id) {
                    vim.api.nvim_set_current_win(state.main_window_id!);
                }
            },
        } as any
    );
}

function stop(): void {
    vim.api.nvim_notify('stopped Bfrs', vim.log.levels.INFO, {});
    state.job_id = null;
}
