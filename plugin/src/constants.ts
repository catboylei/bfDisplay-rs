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

// TODO -> keep porting from top-bottom after render()
