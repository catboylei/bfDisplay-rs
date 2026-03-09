//@ts-ignore
function test(): void {
    vim.api.nvim_notify("TSTL works!", vim.log.levels.INFO, {});
}

export { test };