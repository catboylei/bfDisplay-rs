let cfg: any;

// unprintable chars go here, 127-255 unsupported by default (you can set them yourself)
export const CONTROL_CHARS: Record<number, string> = {
    0: 'NUL',
    1: 'SOH',
    2: 'STX',
    3: 'ETX',
    4: 'EOT',
    5: 'ENQ',
    6: 'ACK',
    7: 'BEL',
    8: 'BS',
    9: 'HT',
    10: 'LF',
    11: 'VT',
    12: 'FF',
    13: 'CR',
    14: 'SO',
    15: 'SI',
    16: 'DLE',
    17: 'DC1',
    18: 'DC2',
    19: 'DC3',
    20: 'DC4',
    21: 'NAK',
    22: 'SYN',
    23: 'ETB',
    24: 'CAN',
    25: 'EM',
    26: 'SUB',
    27: 'ESC',
    28: 'FS',
    29: 'GS',
    30: 'RS',
    31: 'US',
    127: 'DEL',
};

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