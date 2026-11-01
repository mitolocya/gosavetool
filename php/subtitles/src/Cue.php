<?php

declare(strict_types=1);

namespace GoSaveTool\Subtitles;

/** One subtitle cue; times in milliseconds */
final class Cue
{
    public function __construct(
        public int $start,
        public int $end,
        public string $text,
        public string $settings = ''
    ) {
    }
}
