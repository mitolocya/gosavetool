export interface Cue {
    /** start time in milliseconds */
    start: number;
    /** end time in milliseconds */
    end: number;
    /** WebVTT cue settings such as "align:start line:90%" (empty for SRT) */
    settings: string;
    /** cue text; lines are joined with "\n" */
    text: string;
}

export function toMs(timestamp: string): number;
export function fromMs(ms: number, sep?: ',' | '.'): string;
export function parse(src: string): Cue[];
export function isVtt(src: string): boolean;
export function toSrt(cues: Cue[]): string;
export function toVtt(cues: Cue[]): string;
export function convert(src: string, to: 'srt' | 'vtt'): string;
export function shift(cues: Cue[], ms: number): Cue[];
export function repair(cues: Cue[], options?: { minDuration?: number }): { cues: Cue[]; fixed: number };
