import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const format =
      "bv*[height<=1080]+ba[ext=m4a]/bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best";

    const ytDlpPath = process.env.YTDLP_PATH || "yt-dlp";

    const args = [
      "--no-playlist",
      "-f",
      format,
      "--geo-bypass",
      "--retries",
      "3",
      "--fragment-retries",
      "3",
      "--extractor-args",
      "youtube:player_client=web",
      "--get-url",
      "--print",
      "title",
      url,
    ];

    console.log("[download] Spawning yt-dlp:", ytDlpPath, args.join(" "));

    return await new Promise((resolve) => {
      const child = spawn(ytDlpPath, args);
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (c) => (stdout += c.toString()));
      child.stderr.on("data", (c) => (stderr += c.toString()));

      child.on("close", () => {
        const lines = stdout.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          console.error("[yt-dlp stderr]", stderr);
          return resolve(
            NextResponse.json(
              { success: false, error: "Failed to fetch video URL" },
              { status: 500 }
            )
          );
        }
        const title = lines[lines.length - 1];
        const streamUrl = lines[0];
        return resolve(
          NextResponse.json({ success: true, title, fileUrl: streamUrl })
        );
      });
    });
  } catch (e) {
    console.error("[download] Handler error:", e);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
