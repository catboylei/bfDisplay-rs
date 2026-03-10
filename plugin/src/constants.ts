export const AUTOSTART: boolean = true;
export const PATTERNS: string = '{*.bf,*.b,*.brainfuck}';
export const DISPLAY_ROWS: number = 1;

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

// changelog so i dont forget :

// made it support displaying any amount of rows, with always correct scroll
// cannot click or modify cell window
// scroll is only on the cell window
// add proper centering to cells
// fix formatting for 5 digit numbers
// add both catch rpc functions
// remake output window
// add clean start/stop
// actually log rust errors
// make separate entrypoint
// add backend ping
// add the run (interpret) command (with i/o)
// added all the autocmds such as resize and cleanup on quit

// todo change readme to include release + makefile, and compliance