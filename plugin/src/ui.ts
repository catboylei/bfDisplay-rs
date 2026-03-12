import { state } from './state';
import { getConfigOrDefault } from './config';
import {center_lines} from "./utils";

export function createCellWindow(): void {
    if (state.cell_win_id != null || state.main_window_id === null) return;

    state.cell_buf_id = vim.api.nvim_create_buf(false, true);
    vim.api.nvim_buf_set_option(state.cell_buf_id, 'bufhidden', 'wipe' as any);

    state.cell_win_id = vim.api.nvim_open_win(state.cell_buf_id, false, {
        split: 'above',
        height: Math.floor(getConfigOrDefault("DISPLAY_ROWS") * 4),
    });

    vim.api.nvim_win_set_option(state.cell_win_id, 'wrap', false as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'number', false as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'relativenumber', false as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'signcolumn', 'no' as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'winfixheight', true as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'winfixbuf', true as any);
    vim.api.nvim_buf_set_option(state.cell_buf_id, 'modifiable', false as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'mousescroll', `ver:4,hor:6` as any);
}

export function closeCellWindow(): void {
    if (state.cell_win_id == null) return;

    vim.api.nvim_win_close(state.cell_win_id, true);
    state.cell_buf_id = null;
    state.cell_win_id = null;
}

export function updateCellDisplay(display_lines: any): void {
    if (state.cell_win_id === null || state.cell_buf_id === null) return;

    state.warning ? createWarningWindow() : closeWarningWindow();

    vim.api.nvim_buf_set_option(state.cell_buf_id, 'modifiable', true as any);
    vim.api.nvim_buf_set_lines(state.cell_buf_id, 0, -1, false, display_lines);
    vim.api.nvim_buf_set_option(state.cell_buf_id, 'modifiable', false as any);
}


export function createWarningWindow(): void {
    if (state.warn_win_id != null) return;

    const msg: string[] = ['Possible infinite loop detected'];

    state.warn_buf_id = vim.api.nvim_create_buf(false, true);
    vim.api.nvim_buf_set_lines(state.warn_buf_id, 0, -1, false, msg);

    state.warn_win_id = vim.api.nvim_open_win(state.warn_buf_id, false, {
        relative: 'editor',
        row: 0,
        col: Math.floor((state.columns - msg[0].length) / 2),
        width: msg[0].length,
        height: 1,
        style: 'minimal',
        border: 'rounded',
        zindex: 100,
        title: ' BfDisplay ',
        title_pos: 'center',
    });
    vim.api.nvim_win_set_option(state.warn_win_id, 'winhl', 'Normal:WarningMsg' as any);
}

export function closeWarningWindow(): void {
    if (state.warn_win_id === null) return;

    vim.api.nvim_win_close(state.warn_win_id, true);
    state.warn_buf_id = null;
    state.warn_win_id = null;
}

export function updateWarningWindow(): void { // 10/10 code
    if ( !state.warning ) return

    closeWarningWindow();
    createWarningWindow();
}

export function updateOrCreateOutputWindow(output: string, warning: boolean): void {
    const width: number = Math.floor(state.columns * 0.3)
    let lines: string[] = center_lines(output.split("\n"), width);
    const height: number = lines.length

    if ( warning ) { lines = ["timed out :c"]}

    if ( state.out_buf_id && vim.api.nvim_buf_is_valid(state.out_buf_id)) { // this only handles the case where the window is still open, to not open multiple
        vim.api.nvim_buf_set_option(state.out_buf_id, 'modifiable', true as any);
        vim.api.nvim_buf_set_lines(state.out_buf_id, 0, -1, false, lines);
        vim.api.nvim_buf_set_option(state.out_buf_id, 'modifiable', false as any);
        return;
    }

    state.out_buf_id = vim.api.nvim_create_buf(false, true);
    vim.api.nvim_buf_set_lines(state.out_buf_id, 0, -1, false, lines);
    vim.api.nvim_buf_set_option(state.out_buf_id, 'modifiable', false as any);

    state.out_win_id = vim.api.nvim_open_win(state.out_buf_id, true, {
        relative: 'editor',
        row: Math.floor((state.lines- height) / 7),
        col: Math.floor((state.columns - width) / 2),
        width: width,
        height: height,
        style: 'minimal',
        border: 'rounded',
        title: ' Bfrs Output ',
        title_pos: 'center',
        zindex: 50,
    });

    vim.api.nvim_buf_set_keymap(state.out_buf_id, 'n', 'q', '', {
        noremap: true,
        silent: true,
        callback: closeOutputWindow,
    });
    vim.api.nvim_buf_set_keymap(state.out_buf_id, 'n', '<Esc>', '', {
        noremap: true,
        silent: true,
        callback: closeOutputWindow,
    });
}

export function closeOutputWindow(): void {
    if ( state.out_win_id == null) return;

    vim.api.nvim_win_close(state.out_win_id, true);
    state.out_buf_id = null;
    state.out_win_id = null;
}