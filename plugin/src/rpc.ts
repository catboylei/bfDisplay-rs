import { updateOrCreateOutputWindow, updateCellDisplay } from './ui';
import { state } from './state';

// this function and the next one directly get called from the rust backend, so they arent used here
export function on_rpc_return_evaluate(result: any): void {
    state.pointer = result['pointer']
    state.warning = result['warning']
    state.pending_request = false;
    updateCellDisplay(result['cell_display'])
}

export function on_rpc_return_interpret(result: any): void {
    updateOrCreateOutputWindow(result['output'], result['warning'])
}

export function send_rpc_evaluate(): void {
    if ( state.job_id == null || state.pending_request ) return;

    const lines = vim.api.nvim_buf_get_lines(0, 0, -1, false).join("\n")

    vim.fn.rpcnotify(state.job_id, 'evaluate', lines, vim.api.nvim_win_get_cursor(0));
    state.pending_request = true
}

export function send_rpc_interpret(input: any): void {
    if (state.job_id == null || state.pending_request) return;

    const linesArray = vim.api.nvim_buf_get_lines(0, 0, -1, false);
    // gets the coords of the last char in the file evil style because lua is 1-indexed
    const lastLine = linesArray[linesArray.length - 1];
    const cursor = [linesArray.length, lastLine.length];
    const lines = linesArray.join("\n");

    vim.fn.rpcnotify(state.job_id, 'interpret', lines, cursor, input);
}