# ThumbAI — AI YouTube Thumbnail Generator

> Enter your video title · Upload your photo · Pick an AI concept · Download a pro 1280×720 thumbnail

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Try%20it%20now-ff2d2d?style=for-the-badge)](https://mehulbest.github.io/ai-youtube-thumbnail-generator/)
[![License](https://img.shields.io/badge/License-MIT-ffcc00?style=for-the-badge)](LICENSE)
[![Made by](https://img.shields.io/badge/Made%20by-mehulbest-06d6a0?style=for-the-badge)](https://github.com/mehulbest)

---

## 🎬 Live Demo

**[https://mehulbest.github.io/ai-youtube-thumbnail-generator/](https://mehulbest.github.io/ai-youtube-thumbnail-generator/)**

---

## ✦ What It Does

ThumbAI generates professional YouTube thumbnails using AI — completely free, no backend, runs 100% in the browser.

Enter your video title, optionally upload your photo, and GPT-4o writes 5 unique thumbnail concepts. Pick the one you like and Gemini (Nano Banana) paints the full image with your face in it. Output is always a perfect **1280×720px PNG**, ready to upload to YouTube.

---

## ✨ Features

| | |
|---|---|
| 🧠 **5 AI Concepts** | GPT-4o writes 5 detailed, unique thumbnail prompts based on your title and style |
| 📸 **Upload Your Photo** | Drop in your photo and describe how to use it — AI places your reaction face in the thumbnail |
| 🎨 **6 Styles** | Bold · Gaming · Minimal · Vlog · Tutorial · Viral |
| 🖼 **Gemini Image Generation** | Nano Banana (Gemini 3.1 Flash Image) generates the actual thumbnail |
| 📐 **Always 16:9** | Output is cropped to exactly 1280×720px via canvas — never square or stretched |
| 🔍 **Full Prompt Preview** | Expand any concept card to read the complete image generation prompt |
| ⬇ **One-Click Download** | Exports as PNG instantly, named after your video title |
| 🆓 **Free via Puter** | Sign in once with a free Puter account — no credit card, no API keys |

---

## 🖥 How It Works

```
 00  Sign in with free Puter account
  │
 01  Enter your video title
  │
 02  Upload your photo (optional) + describe how to use it
  │         e.g. "shocked reaction face on the right pointing left"
  │
 03  Pick a thumbnail style
  │         Bold / Gaming / Minimal / Vlog / Tutorial / Viral
  │
 04  Click "Generate 5 Concepts"
  │         └─ GPT-4o writes 5 unique thumbnail prompts for your video
  │
 05  Pick the concept you like
  │         └─ Expand any card to read the full prompt
  │
 06  Click "Generate Thumbnail Image"
  │         └─ Gemini (Nano Banana) paints the image
  │         └─ Canvas crops it to exactly 1280×720 (16:9)
  │
 07  Preview → Download PNG
```

---

## 🚀 Quick Start

No installation. No build tools. No server.

```bash
git clone https://github.com/mehulbest/ai-youtube-thumbnail-generator.git
cd ai-youtube-thumbnail-generator
open index.html
```

Or just visit the **[live site](https://mehulbest.github.io/ai-youtube-thumbnail-generator/)**.

On first use, click **"Connect with Puter"** and sign in with a free [Puter](https://puter.com) account. Done — you're ready to generate.

> **Note:** GPT-4o and Gemini image generation use Puter credits. New Puter accounts come with free credits to get started.

---

## 📁 Project Structure

```
ai-youtube-thumbnail-generator/
├── index.html      ← UI — 5-step flow
├── style.css       ← Dark retro-editorial theme (Bebas Neue + DM Sans)
├── script.js       ← All logic — auth, concepts, image gen, canvas, download
└── README.md       ← This file
```

No dependencies. No npm. No build step. Pure HTML + CSS + JS.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Hosting | GitHub Pages |
| Auth + AI bridge | [Puter.js](https://puter.com) (runs entirely in browser) |
| Concept generation | GPT-4o via Puter.js |
| Image generation | Gemini 3.1 Flash Image (Nano Banana) via Puter.js |
| Canvas / export | HTML5 Canvas API |
| Fonts | Bebas Neue + DM Sans (Google Fonts) |

---

## 🗺 Roadmap

- [x] Enter title → GPT-4o writes 5 concepts → pick one → Gemini generates image
- [x] Upload your face — AI places it in the thumbnail
- [x] Expand / collapse full prompt per concept card
- [x] 6 thumbnail styles
- [x] Force 1280×720 output via canvas crop (always perfect 16:9)
- [x] One-click PNG download
- [ ] Regenerate a single concept without resetting all 5
- [ ] Text overlay editor — drag & reposition title text on the thumbnail
- [ ] Multiple image variations per concept
- [ ] Share directly to social media

---

## 📄 License

MIT License © 2025 [mehulbest](https://github.com/mehulbest)

---

<p align="center">Built with ❤️ by <strong>mehulbest</strong> · Powered by <a href="https://puter.com">Puter.js</a> · GPT-4o · Gemini Nano Banana</p>
