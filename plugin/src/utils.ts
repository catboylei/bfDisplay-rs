import { state } from './state';
import { getConfigOrDefault } from './config';

export function ping_backend(): void {
    vim.fn.rpcnotify(state.job_id, 'ping');
    vim.api.nvim_notify('pinged at job_id : ' + state.job_id, vim.log.levels.INFO, {});
}

export function receive_ping(result: any) {
    vim.api.nvim_notify(result, vim.log.levels.INFO, {});
}

export function setupSyntax(): void {
    vim.api.nvim_command('syn match bfOperator "[+\\-]"');
    vim.api.nvim_command('syn match bfPointer "[<>]"');
    vim.api.nvim_command('syn match bfIO "[.,]"');
    vim.api.nvim_command('syn match bfLoop "[\\[\\]]"');
    vim.api.nvim_command('syn match bfComment "[^+\\-<>.,\\[\\]]"');

    const op = getConfigOrDefault("OPERATOR_COLOR")
    const ptr = getConfigOrDefault("POINTER_COLOR")
    const io = getConfigOrDefault("IO_COLOR")
    const loop = getConfigOrDefault("LOOP_COLOR")
    const other = getConfigOrDefault("OTHER_COLOR")

    vim.api.nvim_command(op ? `hi bfOperator guifg=${op}` : 'hi def link bfOperator Operator');
    vim.api.nvim_command(ptr ? `hi bfPointer guifg=${ptr}` : 'hi def link bfPointer Special');
    vim.api.nvim_command(loop ? `hi bfLoop guifg=${loop}` : 'hi def link bfLoop Repeat');
    vim.api.nvim_command(io ? `hi bfIO guifg=${io}` : 'hi def link bfIO Function');
    vim.api.nvim_command(other ? `hi bfComment guifg=${other}` : 'hi def link bfComment Comment');
}