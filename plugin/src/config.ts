let cfg: any;

const DEFAULT_CONFIG: string[] = [
    '-- changing some of these might break things, if it breaks too hard just delete this file - it will be regenerated with defaults',
    'return {',
    '  ENABLED = true, -- whether the plugin setups at all',
    '  AUTOSTART = true,  -- whether to autostart when opening a file with the below extensions',
    '  PATTERNS = {"*.bf", "*.b", "*.brainfuck"}, -- file extensions that the plugin will work on (you can also use * for all)',
    '  DISPLAY_ROWS = 1 -- amount of rows that the live cell display should show',
    '}',
];

const DEFAULTS = {
    ENABLED: true,
    AUTOSTART: true,
    PATTERNS: '{*.bf,*.b,*.brainfuck}',
    DISPLAY_ROWS: 1,
};

export function updateOrCreateConfig(): void {
    const dataPath: string = vim.fn.stdpath('data') + '/bfDisplay-rs';
    const configPath: string = dataPath + '/config.lua';

    vim.fn.mkdir(dataPath, 'p');
    if (vim.fn.filereadable(configPath) == 0) {
        vim.fn.writefile(DEFAULT_CONFIG, configPath);
    }

    // @ts-ignore
    cfg = loadfile(configPath)();
    // @ts-ignore
    vim.api.nvim_notify(tostring(getConfigOrDefault("ENABLED")), vim.log.levels.INFO, {});
}

export function getConfigOrDefault(key: string): any {
    if (!cfg) return (DEFAULTS as any)[key];
    if (cfg[key] === null) return (DEFAULTS as any)[key];
    return cfg[key];
}

export function openConfigFile() {
    const dataPath: string = vim.fn.stdpath('data') + '/bfDisplay-rs/config.lua';
    vim.api.nvim_command('e ' + dataPath);
}