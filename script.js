/**
 * AI YouTube Thumbnail Generator by mehulbest
 * script.js — Uses Pollinations.ai (FREE, no API key needed)
 * Generates real AI images, not Canvas drawings
 */

let currentStyle = 'bold';
let isGenerating = false;
let currentImageUrl = null;

// ─── STYLE PROMPT TEMPLATES ──────────────────────────
const STYLE_PROMPTS = {
  bold: (title) =>
    `YouTube thumbnail, bold dramatic style, massive bold white text saying "${title.toUpperCase()}", bright red yellow colors, explosive fiery background, high contrast dramatic lighting, professional YouTube thumbnail, no extra text, 16:9`,

  gaming: (title) =>
    `YouTube gaming thumbnail, epic neon style, dark background, cyan purple neon glows, glowing text "${title.toUpperCase()}", dramatic lens flare, cinematic lighting, video game aesthetic, professional gaming thumbnail, 16:9`,

  minimal: (title) =>
    `YouTube thumbnail, clean minimal modern design, white background, bold clean black typography "${title}", simple geometric shapes, editorial style, elegant minimalist layout, high-end magazine look, 16:9`,

  vlog: (title) =>
    `YouTube vlog thumbnail, warm lifestyle style, golden hour lighting, warm orange yellow tones, cozy inviting atmosphere, bold text "${title}", personal lifestyle thumbnail, vibrant cheerful, 16:9`,

  tutorial: (title) =>
    `YouTube tutorial thumbnail, professional educational style, dark blue green background, bold clear text "${title.toUpperCase()}", clean modern design, trustworthy professional, green accent colors, 16:9`,

  viral: (title) =>
    `YouTube viral thumbnail, shocking dramatic style, huge bold text "${title.toUpperCase()}", bright magenta orange colors, extreme contrast, shock and awe visuals, viral thumbnail design, high energy, 16:9`,
};

// ─── INIT ─────────────────────────────────────────────
document.getElementById('videoTitle').addEventListener('input', function () {
  document.getElementById('charCount').textContent = this.value.length;
});

document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStyle = btn.dataset.style;
  });
});

document.getElementById('videoTitle').addEventListener('keydown', e => {
  if (e.key === 'Enter') generateThumbnail();
});

// ─── MAIN GENERATE ───────────────────────────────────
async function generateThumbnail() {
  const title = document.getElementById('videoTitle').value.trim();
  if (!title) { flashInput(); return; }
  if (isGenerating) return;

  isGenerating = true;
  setLoadingState(true);
  currentImageUrl = null;

  // Show preview section immediately with loading state
  document.getElementById('step-preview').classList.remove('hidden');
  showImageLoading();
  document.getElementById('step-preview').scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const prompt = STYLE_PROMPTS[currentStyle](title);
    const imageUrl = await generateWithPollinations(prompt);
    currentImageUrl = imageUrl;
    showGeneratedImage(imageUrl);
    renderConceptBox(title, currentStyle);
  } catch (err) {
    console.error(err);
    showError('Generation failed. Please try again.');
  } finally {
    setLoadingState(false);
    isGenerating = false;
  }
}

// ─── POLLINATIONS.AI (free, no key) ──────────────────
function generateWithPollinations(prompt) {
  const seed = Math.floor(Math.random() * 999999);
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&seed=${seed}&nologo=true&enhance=true&model=flux`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timer = setTimeout(() => reject(new Error('Timed out')), 90000);

    img.onload = () => { clearTimeout(timer); resolve(url); };
    img.onerror = () => { clearTimeout(timer); reject(new Error('Failed')); };
    img.src = url;
  });
}

// ─── UI: LOADING STATE ───────────────────────────────
function showImageLoading() {
  document.getElementById('previewWrapper').innerHTML = `
    <div class="loading-placeholder">
      <div class="spinner"></div>
      <p class="loading-text">AI is generating your thumbnail…</p>
      <p class="loading-sub">Using Pollinations.ai · Takes 15–40 seconds</p>
      <div class="progress-bar"><div class="progress-fill"></div></div>
    </div>
  `;
}

// ─── UI: SHOW IMAGE ───────────────────────────────────
function showGeneratedImage(url) {
  document.getElementById('previewWrapper').innerHTML = `
    <img
      src="${url}"
      alt="Generated thumbnail"
      style="width:100%;height:auto;display:block;border-radius:8px;"
      crossorigin="anonymous"
    />
  `;
}

// ─── UI: ERROR ────────────────────────────────────────
function showError(msg) {
  document.getElementById('previewWrapper').innerHTML = `
    <div class="error-placeholder">
      <p>⚠️ ${msg}</p>
      <button class="action-btn secondary" style="margin-top:14px" onclick="generateThumbnail()">↺ Try Again</button>
    </div>
  `;
}

// ─── CONCEPT BOX ─────────────────────────────────────
const STYLE_TIPS = {
  bold:     '🔥 Bold thumbnails use high contrast and urgency to demand clicks.',
  gaming:   '🎮 Neon colors on dark backgrounds make gaming thumbnails pop.',
  minimal:  '✦ Clean typography and whitespace signal premium content.',
  vlog:     '🎬 Warm tones create emotional connection with your audience.',
  tutorial: '📚 Green/teal signals learning — viewers trust it instantly.',
  viral:    '⚡ Magenta + orange creates urgency that stops the scroll.',
};

function renderConceptBox(title, style) {
  const box = document.getElementById('conceptBox');
  box.textContent = `📹 "${title}"\n🎨 Style: ${style.charAt(0).toUpperCase()+style.slice(1)}\n${STYLE_TIPS[style]}`;
}

// ─── DOWNLOAD ────────────────────────────────────────
async function downloadThumbnail() {
  if (!currentImageUrl) return;
  const btn = document.querySelector('.action-btn.primary');
  btn.textContent = '⏳ Downloading…';

  try {
    const res = await fetch(currentImageUrl);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const name = (document.getElementById('videoTitle').value.trim() || 'thumbnail')
      .slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const a = document.createElement('a');
    a.download = `${name}_thumbnail.png`;
    a.href = blobUrl;
    a.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch {
    window.open(currentImageUrl, '_blank');
  } finally {
    btn.textContent = '⬇ Download PNG';
  }
}

// ─── HELPERS ─────────────────────────────────────────
function setLoadingState(on) {
  document.getElementById('generateBtn').disabled = on;
  document.getElementById('btnText').classList.toggle('hidden', on);
  document.getElementById('btnLoader').classList.toggle('hidden', !on);
}

function flashInput() {
  const el = document.getElementById('videoTitle');
  el.style.borderColor = '#ff2d2d';
  el.style.boxShadow = '0 0 0 3px rgba(255,45,45,0.25)';
  el.focus();
  setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1200);
}
