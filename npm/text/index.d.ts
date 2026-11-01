export interface TextStats {
    words: number;
    chars: number;
    charsNoSpaces: number;
    lines: number;
    sentences: number;
    /** reading time in seconds at 238 words a minute */
    readSeconds: number;
}

export type LimitName = 'x-post' | 'instagram-caption' | 'tiktok-caption' | 'youtube-title' | 'youtube-description'
    | 'linkedin-post' | 'pinterest-description' | 'seo-title' | 'meta-description';

export interface LimitCheck { limit: number; used: number; left: number; fits: boolean; }

export const LIMITS: Record<LimitName, number>;
export function stats(text: string): TextStats;
export function limits(text: string, only?: LimitName[]): Partial<Record<LimitName, LimitCheck>>;
export function words(text: string): string[];
export function upper(text: string): string;
export function lower(text: string): string;
export function title(text: string): string;
export function sentence(text: string): string;
export function slug(text: string): string;
export function camel(text: string): string;
export function snake(text: string): string;
export function kebab(text: string): string;
export function clean(text: string): string;
