<?php

declare(strict_types=1);

namespace GoSaveTool\Subtitles;

use InvalidArgumentException;

/**
 * Parse, convert, shift and repair SRT and WebVTT subtitles. No dependencies.
 *
 * Made by GoSaveTool: https://www.gosavetool.com/vtt-subtitle-generator
 */
final class Subtitles
{
    private const STAMP = '(?:\d{1,2}:)?\d{1,2}:\d{1,2}[,.]\d{1,3}';

    /** "00:01:02,500" or "01:02.5" → 62500 */
    public static function toMs(string $stamp): int
    {
        if (!preg_match('/(\d{1,2}:)?(\d{1,2}):(\d{1,2})[,.](\d{1,3})/', $stamp, $m)) {
            throw new InvalidArgumentException('Not a timestamp: ' . $stamp);
        }
        $h = $m[1] !== '' ? (int)$m[1] : 0;
        return (($h * 60 + (int)$m[2]) * 60 + (int)$m[3]) * 1000 + (int)str_pad($m[4], 3, '0');
    }

    /** 62500 → "00:01:02,500" (separator ",", SRT) or "00:01:02.500" (separator ".", WebVTT) */
    public static function fromMs(int|float $ms, string $sep = ','): string
    {
        $ms = max(0, (int)round($ms));
        return sprintf('%02d:%02d:%02d%s%03d', intdiv($ms, 3600000), intdiv($ms, 60000) % 60, intdiv($ms, 1000) % 60, $sep, $ms % 1000);
    }

    /**
     * Cues of an SRT or WebVTT text. Headers, NOTE and STYLE blocks are skipped.
     *
     * @return Cue[]
     */
    public static function parse(string $src): array
    {
        // "\r\r\n" too: a file saved twice with Windows line endings
        $text = preg_replace('/\r*\n|\r/', "\n", preg_replace('/^\xEF\xBB\xBF/', '', $src));
        $cues = [];
        foreach (preg_split('/\n{2,}/', $text) as $block) {
            $lines = explode("\n", $block);
            foreach ($lines as $i => $line) {
                if (preg_match('/^\s*(' . self::STAMP . ')\s*-->\s*(' . self::STAMP . ')(.*)$/', $line, $m)) {
                    $cues[] = new Cue(self::toMs($m[1]), self::toMs($m[2]), trim(implode("\n", array_slice($lines, $i + 1))), trim($m[3]));
                    break;
                }
            }
        }
        return $cues;
    }

    /** True when the text starts with the WEBVTT signature */
    public static function isVtt(string $src): bool
    {
        return (bool)preg_match('/^(\xEF\xBB\xBF)?WEBVTT/', $src);
    }

    /** @param Cue[] $cues SRT text, numbered from 1 */
    public static function toSrt(array $cues): string
    {
        $out = [];
        foreach (array_values($cues) as $i => $c) {
            $out[] = ($i + 1) . "\n" . self::fromMs($c->start, ',') . ' --> ' . self::fromMs($c->end, ',') . "\n" . $c->text;
        }
        return implode("\n\n", $out) . "\n";
    }

    /** @param Cue[] $cues WebVTT text; cue settings are kept */
    public static function toVtt(array $cues): string
    {
        $out = [];
        foreach ($cues as $c) {
            $out[] = self::fromMs($c->start, '.') . ' --> ' . self::fromMs($c->end, '.') . ($c->settings !== '' ? ' ' . $c->settings : '') . "\n" . $c->text;
        }
        return "WEBVTT\n\n" . implode("\n\n", $out) . "\n";
    }

    /** Converts a subtitle text to "srt" or "vtt" */
    public static function convert(string $src, string $to): string
    {
        if ($to !== 'srt' && $to !== 'vtt') {
            throw new InvalidArgumentException('The target format must be "srt" or "vtt"');
        }
        return $to === 'vtt' ? self::toVtt(self::parse($src)) : self::toSrt(self::parse($src));
    }

    /**
     * Moves every cue by $ms (negative = earlier); cues pushed before zero are clipped or dropped.
     *
     * @param Cue[] $cues
     * @return Cue[]
     */
    public static function shift(array $cues, int $ms): array
    {
        $out = [];
        foreach ($cues as $c) {
            $moved = new Cue(max(0, $c->start + $ms), max(0, $c->end + $ms), $c->text, $c->settings);
            if ($moved->end > 0) {
                $out[] = $moved;
            }
        }
        return $out;
    }

    /**
     * Sorts cues, fixes end times before the start and overlaps, drops empty cues.
     *
     * @param Cue[] $cues
     * @return array{cues: Cue[], fixed: int}
     */
    public static function repair(array $cues, int $minDuration = 2000): array
    {
        $fixed = 0;
        $out = [];
        foreach ($cues as $c) {
            if ($c->text === '') {
                $fixed++;
                continue;
            }
            $out[] = clone $c;
        }
        $before = array_map(fn (Cue $c) => $c->start, $out);
        usort($out, fn (Cue $a, Cue $b) => $a->start <=> $b->start);
        if (array_map(fn (Cue $c) => $c->start, $out) !== $before) {
            $fixed++;
        }
        foreach ($out as $i => $c) {
            if ($c->end <= $c->start) {
                $c->end = $c->start + $minDuration;
                $fixed++;
            }
            if (isset($out[$i + 1]) && $c->end > $out[$i + 1]->start) {
                $c->end = max($c->start + 1, $out[$i + 1]->start - 1);
                $fixed++;
            }
        }
        return ['cues' => $out, 'fixed' => $fixed];
    }
}
