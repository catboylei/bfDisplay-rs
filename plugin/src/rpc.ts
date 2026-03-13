import { updateOrCreateOutputWindow, updateCellDisplay } from './ui';
import { state } from './state';

// function to be called by the backend on returning
export function on_rpc_return_evaluate(result: any): void { // note: rust handles formatting and such for opti reasons (rust faster)
    state.pointer = result['pointer']
    state.warning = result['warning']
    state.pending_request = false;
    updateCellDisplay(result['cell_display'])
}

// function to be called by the backend on returning
export function on_rpc_return_interpret(result: any): void {
    updateOrCreateOutputWindow(result)
}

// request cell display update from backend
export function send_rpc_evaluate(): void {
    if ( state.job_id == null || state.pending_request ) return;

    const lines = vim.api.nvim_buf_get_lines(0, 0, -1, false).join("\n")

    vim.fn.rpcnotify(state.job_id, 'evaluate', lines, vim.api.nvim_win_get_cursor(0)); // get all lines from nvim and send that directly to backend
    state.pending_request = true
}

// request output result from backend, with last char index (cursor) and input
export function send_rpc_interpret(input: any): void {
    if (state.job_id == null || state.pending_request) return;

    const linesArray = vim.api.nvim_buf_get_lines(0, 0, -1, false);
    const lastLine = linesArray[linesArray.length - 1]; // gets the coords of the last char in the file evil style because lua is 1-indexed
    const cursor = [linesArray.length, lastLine.length];
    const lines = linesArray.join('\n');

    vim.fn.rpcnotify(state.job_id, 'interpret', lines, cursor, input);
}