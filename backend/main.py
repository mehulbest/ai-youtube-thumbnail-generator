"""
AI YouTube Thumbnail Generator by mehulbest
backend/main.py — Lightweight Flask API proxy

Use this if you want to keep your Anthropic API key
server-side and not expose it in the browser.

Run:
    pip install -r requirements.txt
    python main.py

Then update script.js to call:
    http://localhost:5000/generate
"""

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic

app = Flask(__name__)
CORS(app)  # Allow calls from GitHub Pages / localhost

# Load API key from environment variable (never hardcode it)
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

STYLE_VIBES = {
    "bold":     "explosive, high-contrast, urgent numbers or power words",
    "gaming":   "neon glow, dark atmosphere, epic energy, gamer slang",
    "minimal":  "clean whitespace, elegant typography, understated confidence",
    "vlog":     "warm, personal, lifestyle, casual and inviting",
    "tutorial": "educational, trustworthy, step-by-step, professional",
    "viral":    "shocking, curiosity-triggering, reaction energy",
}

@app.route("/generate", methods=["POST"])
def generate():
    data  = request.get_json()
    title = data.get("title", "").strip()
    style = data.get("style", "bold")

    if not title:
        return jsonify({"error": "title is required"}), 400

    vibe   = STYLE_VIBES.get(style, STYLE_VIBES["bold"])
    prompt = f"""You are a YouTube thumbnail design expert. Generate a thumbnail concept for this video.

Video title: "{title}"
Style: {style} — {vibe}

Respond ONLY with a valid JSON object (no markdown, no backticks). Use this exact shape:
{{
  "headline": "SHORT PUNCHY TEXT (max 5 words, ALL CAPS)",
  "subtext": "Supporting line (max 8 words)",
  "emoji": "one relevant emoji",
  "layout": "left | center | right",
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "tip": "one sentence design tip for this thumbnail"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )

    raw  = message.content[0].text
    clean = raw.replace("```json", "").replace("```", "").strip()

    try:
        concept = json.loads(clean)
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse AI response", "raw": raw}), 500

    return jsonify(concept)


@app.route("/health")
def health():
    return jsonify({"status": "ok", "product": "AI YouTube Thumbnail Generator by mehulbest"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
