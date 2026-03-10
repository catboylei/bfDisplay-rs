export const AUTOSTART: boolean = true;
export const PATTERNS: string = '{*.bf,*.b,*.brainfuck}';
export const DISPLAY_ROWS: number = 1;
export const NAMESPACE = 'BfDisplay-rs';

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