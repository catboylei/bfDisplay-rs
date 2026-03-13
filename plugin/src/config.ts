let cfg: any;

// default config, only used to write the config file if it doesnt exist
const DEFAULT_CONFIG: string[] = [
    '-- changing some of these might break things, if it breaks too hard just delete this file - it will be regenerated with defaults',
    'return {',
    '  ENABLED = true, -- whether the plugin setups at all',
    '  AUTOSTART = true,  -- whether to autostart when opening a file with the below extensions',
    '  PATTERNS = {"*.bf", "*.b", "*.brainfuck"}, -- file extensions that the plugin will work on (you can also use * for all)',
    '  DISPLAY_ROWS = 1, -- amount of rows that the live cell display should show',
    '  -- theme settings, use nil for user theme -- ',
    '  OPERATOR_COLOR = nil, -- color for +-',
    '  POINTER_COLOR = nil, -- color for <>',
    '  IO_COLOR = nil, -- color for .,',
    '  LOOP_COLOR = nil, -- color for []',
    '  OTHER_COLOR = nil, -- color for every other character',
    '}',
];

// fallbacks for getConfigOrDefault
const DEFAULTS = {
    ENABLED: true,
    AUTOSTART: true,
    PATTERNS: '{*.bf,*.b,*.brainfuck}',
    DISPLAY_ROWS: 1,
    OPERATOR_COLOR: null,
    POINTER_COLOR: null,
    IO_COLOR: null,
    LOOP_COLOR: null,
    OTHER_COLOR: null
};

// load config variables into cfg and create config file if necessary
export function updateOrCreateConfig(): void {
    const dataPath: string = vim.fn.stdpath('data') + '/bfDisplay-rs';
    const configPath: string = dataPath + '/config.lua';

    vim.fn.mkdir(dataPath, 'p');
    if (vim.fn.filereadable(configPath) == 0) { vim.fn.writefile(DEFAULT_CONFIG, configPath); }

    // @ts-ignore
    cfg = loadfile(configPath)();
}

// get value from cfg or fallback
export function getConfigOrDefault(key: string): any {
    if (!cfg) return (DEFAULTS as any)[key];
    if (cfg[key] === null) return (DEFAULTS as any)[key];
    return cfg[key];
}

// open config file in current nvim window
export function openConfigFile(): void {
    const dataPath: string = vim.fn.stdpath('data') + '/bfDisplay-rs/config.lua';
    vim.api.nvim_command('e ' + dataPath);
}