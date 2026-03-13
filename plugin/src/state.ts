export const state = {
    // store most window ids here to not pass them around
    main_window_id: null as number | null,

    job_id: null as number | null,

    cell_win_id: null as number | null,
    cell_buf_id: null as number | null,

    warn_win_id: null as number | null,
    warn_buf_id: null as number | null,

    out_win_id: null as number | null,
    out_buf_id: null as number | null,

    autostart_id: null as number | null, // this is just there so you can remove the autocmd in cleanup

    columns: vim.api.nvim_get_option('columns') as any as number,
    lines: vim.api.nvim_get_option('lines') as any as number,

    pointer: 0,
    warning: false,

    pending_request: false, // this is to avoid queueing requests

    // @ts-ignore
    script_dir: vim.fn.fnamemodify(string.sub(debug.getinfo(1, 'S').source, 2), ':h') as string, // this is lua tomfoolery (i hate lua)
};
