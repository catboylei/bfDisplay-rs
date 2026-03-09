export const state = {
    main_window_id: null as number | null,

    job_id: null as number | null,

    cell_win_id: null as number | null,
    cell_buf_id: null as number | null,

    warn_win_id: null as number | null,
    warn_buf_id: null as number | null,

    columns: vim.api.nvim_get_option('columns') as any as number,
    lines: vim.api.nvim_get_option('lines') as any as number,

    tape: Array.from({ length: 30000 }, () => 0),
    pointer: 0,
};
