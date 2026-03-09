import { state } from './state';

export function ping(): void {
    if (state.job_id != null) vim.api.nvim_notify('pong', vim.log.levels.INFO, {});
}

export function center_lines(lines: string[], width: number): string[] {
    let centered: string[] = [];
    for (let line of lines) {
        centered.push(' '.repeat(Math.max(0, Math.floor((width - line.length) / 2))) + line);
    }
    return centered;
}
