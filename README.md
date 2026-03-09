# AI YouTube Thumbnail Generator by mehulbest

> Generate stunning, click-worthy YouTube thumbnails instantly using AI — free, open source, runs entirely in the browser.

![License](https://img.shields.io/badge/license-MIT-red) ![Status](https://img.shields.io/badge/status-MVP-yellow)

---

## ✦ Features

- **AI-Powered Concepts** — Claude AI generates a headline, subtext, layout, and color palette tailored to your video topic
- **6 Thumbnail Styles** — Bold, Gaming, Minimal, Vlog, Tutorial, Viral
- **Live Canvas Preview** — 1280×720px thumbnail rendered in real time
- **Color Palette Display** — See the exact colors used in your thumbnail
- **One-Click Download** — Export as PNG ready for YouTube upload
- **Offline Fallback** — Works even without an API key using smart local generation
- **Fully Responsive** — Works on desktop, tablet, and mobile

---

## 🚀 Quick Start (Local)

No build tools. No server. Just open the file.

```bash
git clone https://github.com/mehulbest/ai-youtube-thumbnail-generator.git
cd ai-youtube-thumbnail-generator
open index.html   # or just double-click it
```

---

## 📁 Project Structure

```
ai-youtube-thumbnail-generator/
├── index.html      ← Main HTML (UI layout)
├── style.css       ← All styles (dark retro-editorial theme)
├── script.js       ← AI generation + Canvas rendering + download
├── README.md       ← This file
└── assets/         ← (optional) icons, sample thumbnails
```

---

## 🔑 API Key Setup

The tool calls the **Anthropic Claude API** directly from the browser.

### Option A — No Setup (Offline Mode)
If the API is unavailable (no key, rate limit, etc.), the tool automatically falls back to a smart local generator. You still get a full thumbnail — just without AI-enhanced copy.

### Option B — With Claude API Key
To enable full AI generation, modify the `fetch` call in `script.js`:

```js
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'YOUR_ANTHROPIC_API_KEY_HERE',   // add this line
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-calls': 'true',
},
```

> ⚠️ Do not commit your API key to a public repo. For production, use a lightweight Python backend (see below).

---

## 🐍 Optional Python Backend

If you want to keep your API key secure, use the included lightweight backend:

```bash
cd backend/
pip install -r requirements.txt
python main.py
```

Then update `script.js` to call `http://localhost:5000/generate` instead of the Anthropic API directly.

---

## 🌐 GitHub Pages Deployment

1. Push the project to a GitHub repo
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)` folder
4. Click **Save** — your site will be live at:
   `https://mehulbest.github.io/ai-youtube-thumbnail-generator/`

> No build step needed. The project is 100% static HTML/CSS/JS.

---

## 🛠 Tech Stack

| Layer      | Technology                  | License  |
|------------|-----------------------------|----------|
| Frontend   | HTML5, CSS3, Vanilla JS     | —        |
| AI         | Claude (Anthropic API)      | —        |
| Rendering  | HTML5 Canvas API            | —        |
| Fonts      | Bebas Neue, DM Sans (Google Fonts) | OFL |
| Hosting    | GitHub Pages                | —        |

All dependencies are open source (MIT / Apache-2.0 / OFL).

---

## 🗺 Roadmap

- [x] MVP: input → style → generate → preview → download
- [ ] Multiple thumbnail variations per topic
- [ ] Text overlay customization (drag & drop)
- [ ] Upload your own face/photo into the thumbnail
- [ ] Share directly to social media

---

## 📄 License

MIT License © 2024 mehulbest

---

Built by **mehulbest**
