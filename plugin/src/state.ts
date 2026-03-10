export const state = {
    main_window_id: null as number | null,

    job_id: null as number | null,

    cell_win_id: null as number | null,
    cell_buf_id: null as number | null,

    warn_win_id: null as number | null,
    warn_buf_id: null as number | null,

    out_win_id: null as number | null,
    out_buf_id: null as number | null,

    columns: vim.api.nvim_get_option('columns') as any as number, // todo update this on window resize
    lines: vim.api.nvim_get_option('lines') as any as number,

    tape: Array.from({ length: 30000 }, () => 0),
    pointer: 0,
    warning: false,

    pending_request: false,

    // @ts-ignore
    script_dir: vim.fn.fnamemodify(string.sub(debug.getinfo(1, 'S').source, 2), ':h') as string,
};
