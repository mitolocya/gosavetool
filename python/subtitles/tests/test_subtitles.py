"""python -m unittest discover -s tests"""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import gosavetool_subtitles as sub  # noqa: E402

SRT = "1\r\n00:00:01,000 --> 00:00:03,500\r\nHello\r\nworld\r\n\r\n2\r\n00:00:03,000 --> 00:00:02,000\r\nSecond\r\n\r\n3\r\n00:00:00,500 --> 00:00:00,900\r\nFirst\r\n"


class Subtitles(unittest.TestCase):
    def test_parse_and_write(self):
        cues = sub.parse(SRT)
        self.assertEqual(len(cues), 3)
        self.assertEqual(cues[0].text, "Hello\nworld")
        self.assertTrue(sub.to_vtt(cues).startswith("WEBVTT\n\n00:00:01.000 --> 00:00:03.500\nHello"))
        self.assertEqual(sub.convert("WEBVTT\n\nNOTE hi\n\n01:02.5 --> 01:04.000 align:start\nA\n", "srt"), "1\n00:01:02,500 --> 00:01:04,000\nA\n")
        self.assertIn("00:00:00.500 --> 00:00:00.900 \n".strip(), sub.convert(SRT, "vtt"))
        with self.assertRaises(ValueError):
            sub.convert(SRT, "ass")

    def test_shift_repair(self):
        cues = sub.parse(SRT)
        self.assertEqual([(c.start, c.end) for c in sub.shift(cues, -1000)], [(0, 2500), (2000, 1000)])
        fixed, n = sub.repair(cues)
        self.assertEqual([c.text for c in fixed], ["First", "Hello\nworld", "Second"])
        self.assertEqual(n, 3)
        self.assertTrue(all(c.end > c.start for c in fixed))
        self.assertEqual(cues[1].end, 2000)  # the input is not changed

    def test_times(self):
        self.assertEqual(sub.from_ms(3723004, ","), "01:02:03,004")
        self.assertEqual(sub.to_ms("1:02:03.4"), 3723400)
        self.assertTrue(sub.is_vtt("﻿WEBVTT\n"))
        with self.assertRaises(ValueError):
            sub.to_ms("nope")

    def test_cli(self):
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "a.srt"
            f.write_text(SRT, "utf-8")
            env = {"PYTHONPATH": str(Path(__file__).resolve().parents[1] / "src")}
            run = lambda *a: subprocess.run([sys.executable, "-m", "gosavetool_subtitles", *a], capture_output=True, text=True, env={**__import__("os").environ, **env}, check=True).stdout
            run("convert", str(f), "--to", "vtt")
            self.assertTrue((Path(d) / "a.vtt").read_text("utf-8").startswith("WEBVTT"))
            self.assertIn("00:00:03,000 --> 00:00:05,500", run("shift", str(f), "2", "--stdout"))
            self.assertIn("SRT, 3 cues", run("info", str(f)))
            run("repair", str(f))
            self.assertTrue(f.read_text("utf-8").startswith("1\n00:00:00,500 --> 00:00:00,900\nFirst"))


if __name__ == "__main__":
    unittest.main()
