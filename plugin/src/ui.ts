import { state } from './state';
import { getConfigOrDefault } from './config';

// create empty cell window and store its ids to reuse later (this should only be called on plugin start)
export function createCellWindow(): void {
    if (state.cell_win_id != null || state.main_window_id === null || !getConfigOrDefault("CELL_DISPLAY")) return;

    state.cell_buf_id = vim.api.nvim_create_buf(false, true); // blah blah create buffer and open window with it, you got it

    state.cell_win_id = vim.api.nvim_open_win(state.cell_buf_id, false, {
        split: 'above',
        height: Math.floor(getConfigOrDefault("DISPLAY_ROWS") * 5),
    });

    // random useful or not options for the window
    vim.api.nvim_buf_set_option(state.cell_buf_id, 'bufhidden', 'wipe' as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'wrap', false as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'number', false as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'relativenumber', false as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'signcolumn', 'no' as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'winfixheight', true as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'winfixbuf', true as any);
    vim.api.nvim_buf_set_option(state.cell_buf_id, 'modifiable', false as any);
    vim.api.nvim_win_set_option(state.cell_win_id, 'mousescroll', `ver:4,hor:6` as any); // fix scroll on cells
    vim.api.nvim_win_set_option(state.cell_win_id, "list", false as any);
    vim.api.nvim_win_set_option(state.cell_win_id, "fillchars", "eob: " as any);
}

// safe call to close the cell window + cleanup state
export function closeCellWindow(): void {
    if (state.cell_win_id == null) return;

    vim.api.nvim_win_close(state.cell_win_id, true);
    state.cell_buf_id = null;
    state.cell_win_id = null;
}

// gets called indirectly by the backend, to apply formatted lines to the cell display
export function updateCellDisplay(display_lines: any): void {
    if (state.cell_win_id === null || state.cell_buf_id === null || !getConfigOrDefault('CELL_DISPLAY')) return;

    state.warning ? createWarningWindow() : closeWarningWindow(); // both safe functions so no point in checking state prior

    vim.api.nvim_buf_set_option(state.cell_buf_id, 'modifiable', true as any);
    vim.api.nvim_buf_set_lines(state.cell_buf_id, 0, -1, false, display_lines);
    vim.api.nvim_buf_set_option(state.cell_buf_id, 'modifiable', false as any);
}

// create new warning window if none
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
    vim.api.nvim_win_set_option(state.warn_win_id, 'winhl', 'Normal:WarningMsg' as any); // use user theme color for warning
}

// close warn window if it exists (and clean state)
export function closeWarningWindow(): void {
    if (state.warn_win_id === null) return;

    vim.api.nvim_win_close(state.warn_win_id, true);
    state.warn_buf_id = null;
    state.warn_win_id = null;
}

// i think that ones obvious
export function updateWarningWindow(): void { // 10/10 code
    if ( !state.warning ) return

    closeWarningWindow();
    createWarningWindow();
}

// safe call to display output
export function updateOrCreateOutputWindow(output: string[]): void {
    if (state.out_buf_id && vim.api.nvim_buf_is_valid(state.out_buf_id)) {
        // this only handles the case where the window is still open, to not open multiple
        vim.api.nvim_buf_set_option(state.out_buf_id, 'modifiable', true as any);
        vim.api.nvim_buf_set_lines(state.out_buf_id, 0, -1, false, output);
        vim.api.nvim_buf_set_option(state.out_buf_id, 'modifiable', false as any);
        return;
    }

    state.out_buf_id = vim.api.nvim_create_buf(false, true);
    vim.api.nvim_buf_set_lines(state.out_buf_id, 0, -1, false, output);
    vim.api.nvim_buf_set_option(state.out_buf_id, 'modifiable', false as any);

    state.out_win_id = vim.api.nvim_open_win(state.out_buf_id, true, {
        relative: 'editor',
        row: Math.floor((state.lines - output.length) / 7),
        col: Math.floor((state.columns - Math.floor(state.columns * 0.3)) / 2),
        width: Math.floor(state.columns * 0.3),
        height: output.length,
        style: 'minimal',
        border: 'rounded',
        title: ' Bfrs Output ',
        title_pos: 'center',
        zindex: 50,
    });

    vim.api.nvim_buf_set_keymap(state.out_buf_id, 'n', 'q', '', { // create keymaps to close the window on pressing "q" or "esc"
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

// close output display if theres one
export function closeOutputWindow(): void {
    if ( state.out_win_id == null) return;

    vim.api.nvim_win_close(state.out_win_id, true);
    state.out_buf_id = null;
    state.out_win_id = null;
}