<?php
// php tests/run.php
declare(strict_types=1);

require __DIR__ . '/../src/Cue.php';
require __DIR__ . '/../src/Subtitles.php';

use GoSaveTool\Subtitles\Subtitles as S;

function check(bool $ok, string $what): void
{
    if (!$ok) {
        fwrite(STDERR, "FAILED: $what\n");
        exit(1);
    }
}

$srt = "1\r\n00:00:01,000 --> 00:00:03,500\r\nHello\r\nworld\r\n\r\n2\r\n00:00:03,000 --> 00:00:02,000\r\nSecond\r\n\r\n3\r\n00:00:00,500 --> 00:00:00,900\r\nFirst\r\n";
$cues = S::parse($srt);
check(count($cues) === 3, 'three cues');
check($cues[0]->text === "Hello\nworld", 'multi-line text');
check(str_starts_with(S::toVtt($cues), "WEBVTT\n\n00:00:01.000 --> 00:00:03.500\nHello"), 'to VTT');
check(S::convert("WEBVTT\n\nNOTE hi\n\n01:02.5 --> 01:04.000 align:start\nA\n", 'srt') === "1\n00:01:02,500 --> 00:01:04,000\nA\n", 'VTT to SRT');
check(count(S::parse(str_replace("\r\n", "\r\r\n", $srt))) === 3, 'double CR line endings');
try {
    S::convert($srt, 'ass');
    check(false, 'bad format throws');
} catch (InvalidArgumentException) {
}
check(array_map(fn ($c) => [$c->start, $c->end], S::shift($cues, -1000)) === [[0, 2500], [2000, 1000]], 'shift');
$r = S::repair($cues);
check(array_map(fn ($c) => $c->text, $r['cues']) === ['First', "Hello\nworld", 'Second'], 'repair order');
check($r['fixed'] === 3, 'repair count');
check($cues[1]->end === 2000, 'input not changed');
check(S::fromMs(3723004, ',') === '01:02:03,004', 'fromMs');
check(S::toMs('1:02:03.4') === 3723400, 'toMs');
check(S::isVtt("\xEF\xBB\xBFWEBVTT\n"), 'isVtt with BOM');
echo "all checks passed\n";
