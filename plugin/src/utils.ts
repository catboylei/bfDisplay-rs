import { state } from './state';

export function ping_backend(): void {
    vim.fn.rpcnotify(state.job_id, 'ping');
    vim.api.nvim_notify('pinged at job_id : ' + state.job_id, vim.log.levels.INFO, {});
}

export function receive_ping(result: any) {
    vim.api.nvim_notify(result, vim.log.levels.INFO, {});
}

export function center_lines(lines: string[], width: number): string[] {
    let centered: string[] = [];
    for (let line of lines) {
        centered.push(' '.repeat(Math.max(0, Math.floor((width - line.length) / 2))) + line);
    }
    return centered;
}