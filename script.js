/**
 * AI YouTube Thumbnail Generator by mehulbest
 * script.js — Puter.js + Nano Banana (Gemini 3.1 Flash Image)
 * FIX: Force 16:9 (1280x720) output via canvas crop after generation
 */

let currentStyle  = 'bold';
let isGenerating  = false;
let currentImgEl  = null;
let authPollTimer = null;

// ─── STYLE PROMPTS ───────────────────────────────────
// Important: explicitly ask for 16:9 widescreen layout in every prompt
const STYLE_PROMPTS = {
  bold: (t) =>
    `Create a YouTube thumbnail image in WIDESCREEN 16:9 landscape format for a video titled "${t}". Bold dramatic style: massive bold white text "${t}" with thick red stroke outline centered horizontally. Background is a dark red to black radial gradient with explosive orange fire bursting outward and cinematic god-rays. High contrast. Photorealistic quality. The entire image must be wider than it is tall, landscape orientation only.`,

  gaming: (t) =>
    `Create a YouTube thumbnail image in WIDESCREEN 16:9 landscape format for a gaming video titled "${t}". Epic neon style: glowing bold text "${t}" with cyan neon outline and purple glow. Ultra-dark background with electric cyan and purple neon streaks, particle sparks, hexagonal HUD elements, dramatic lens flare, volumetric fog. Cinematic video game poster. Landscape orientation only.`,

  minimal: (t) =>
    `Create a YouTube thumbnail image in WIDESCREEN 16:9 landscape format for a video titled "${t}". Ultra-clean minimalist style: large bold black serif text "${t}" on a pure white background. Single thin red geometric accent line. Generous whitespace. Premium editorial magazine aesthetic. Landscape orientation only.`,

  vlog: (t) =>
    `Create a YouTube thumbnail image in WIDESCREEN 16:9 landscape format for a vlog titled "${t}". Warm lifestyle style: bold warm-white text "${t}" with soft drop shadow. Warm golden hour bokeh background in amber and peach tones. Cozy inviting lifestyle influencer feel. Landscape orientation only.`,

  tutorial: (t) =>
    `Create a YouTube thumbnail image in WIDESCREEN 16:9 landscape format for a tutorial titled "${t}". Educational style: clean bold white text "${t}". Dark navy to teal gradient background. Bright green accent badge or checkmark element. Subtle dot grid overlay. Trustworthy professional look. Landscape orientation only.`,

  viral: (t) =>
    `Create a YouTube thumbnail image in WIDESCREEN 16:9 landscape format for a viral video titled "${t}". High-energy clickbait style: massive bold yellow text "${t}" with thick black stroke. Shocking magenta to electric orange gradient background. Bold red arrows pointing at the text. Extreme high contrast, urgency and shock value. Landscape orientation only.`,
};

const STYLE_TIPS = {
  bold:     '🔥 High contrast + fire = the timeless viral formula.',
  gaming:   '🎮 Neon on black is the #1 gaming thumbnail formula.',
  minimal:  '✦ Whitespace signals premium quality to viewers.',
  vlog:     '🎬 Warm golden tones build trust and emotional connection.',
  tutorial: '📚 Navy + green instantly signals "professional teacher".',
  viral:    '⚡ Yellow + black + arrows = most clickable combo.',
};

// ─── ON LOAD ──────────────────────────────────────────
window.addEventListener('load', () => {
  checkAuthState();
  authPollTimer = setInterval(checkAuthState, 1500);
});

function checkAuthState() {
  try {
    if (puter.auth.isSignedIn()) {
      clearInterval(authPollTimer);
      setConnected(true);
    }
  } catch (e) { /* puter not ready yet */ }
}

// ─── CONNECT ─────────────────────────────────────────
async function connectPuter() {
  const btn = document.getElementById('connectBtn');
  btn.textContent = '⏳ Opening sign-in…';
  btn.disabled = true;
  try {
    await puter.auth.signIn();
    setConnected(true);
  } catch (err) {
    console.warn('signIn() stalled (Google OAuth known issue) — polling will catch it:', err);
    btn.textContent = '⏳ Waiting for sign-in… (you can close the popup)';
  }
}

function setConnected(connected) {
  const status = document.getElementById('authStatus');
  const text   = document.getElementById('authStatusText');
  const btn    = document.getElementById('connectBtn');
  if (connected) {
    status.className  = 'auth-status connected';
    text.textContent  = '✓ Connected — ready to generate!';
    btn.textContent   = '✓ Connected';
    btn.disabled      = true;
    btn.style.opacity = '0.5';
    btn.style.cursor  = 'default';
  }
}

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

// ─── GENERATE ────────────────────────────────────────
async function generateThumbnail() {
  const title = document.getElementById('videoTitle').value.trim();
  if (!title) { flashInput(); return; }

  if (!puter.auth.isSignedIn()) {
    showToast('⚠️ Please connect your Puter account first (Step 00 above)');
    return;
  }

  if (isGenerating) return;
  isGenerating = true;
  currentImgEl = null;

  setLoadingState(true);
  document.getElementById('step-preview').classList.remove('hidden');
  showLoadingUI();
  document.getElementById('step-preview').scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const prompt = STYLE_PROMPTS[currentStyle](title);

    // Generate image via Puter + Nano Banana
    const imgElement = await puter.ai.txt2img(prompt, {
      model: 'gemini-3.1-flash-image-preview',
    });

    // ── FORCE 16:9 (1280×720) via canvas crop/letterbox ──
    const finalCanvas = await forceSixteenByNine(imgElement);
    currentImgEl = finalCanvas;

    showGeneratedCanvas(finalCanvas);
    renderConceptBox(title, currentStyle);

  } catch (err) {
    console.error('Generation error:', err);
    showError(`Generation failed: ${err.message || 'Please try again.'}`);
  } finally {
    setLoadingState(false);
    isGenerating = false;
  }
}

// ─── FORCE 16:9 CANVAS ───────────────────────────────
// Takes any <img> element and returns a 1280×720 canvas
// If the image is already wider: center-crop to 16:9
// If the image is already 16:9 or close: just resize
async function forceSixteenByNine(imgEl) {
  const TARGET_W = 1280;
  const TARGET_H = 720;

  // Wait for image to fully load
  await new Promise(resolve => {
    if (imgEl.complete && imgEl.naturalWidth > 0) { resolve(); return; }
    imgEl.onload = resolve;
    imgEl.onerror = resolve;
  });

  const srcW = imgEl.naturalWidth  || imgEl.width  || 1024;
  const srcH = imgEl.naturalHeight || imgEl.height || 1024;

  const canvas = document.createElement('canvas');
  canvas.width  = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext('2d');

  // Fill black background first
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, TARGET_W, TARGET_H);

  const srcRatio    = srcW / srcH;
  const targetRatio = TARGET_W / TARGET_H; // 1.777...

  let drawX, drawY, drawW, drawH;

  if (srcRatio >= targetRatio) {
    // Image is wider or same ratio → fit height, crop sides
    drawH = TARGET_H;
    drawW = drawH * srcRatio;
    drawX = (TARGET_W - drawW) / 2;
    drawY = 0;
  } else {
    // Image is taller → fit width, crop top/bottom
    drawW = TARGET_W;
    drawH = drawW / srcRatio;
    drawX = 0;
    drawY = (TARGET_H - drawH) / 2;
  }

  ctx.drawImage(imgEl, drawX, drawY, drawW, drawH);

  return canvas;
}

// ─── UI ───────────────────────────────────────────────
function showLoadingUI() {
  document.getElementById('previewWrapper').innerHTML = `
    <div class="loading-placeholder">
      <div class="spinner"></div>
      <p class="loading-text">Nano Banana is painting your thumbnail…</p>
      <p class="loading-sub">Gemini 3.1 Flash Image · Free via Puter.js · ~15–30 sec</p>
      <div class="progress-bar"><div class="progress-fill"></div></div>
    </div>`;
}

function showGeneratedCanvas(canvas) {
  canvas.style.cssText = 'width:100%;height:auto;display:block;border-radius:8px;';
  canvas.title = 'Your 1280×720 YouTube Thumbnail';
  const wrapper = document.getElementById('previewWrapper');
  wrapper.innerHTML = '';
  wrapper.appendChild(canvas);
}

function showError(msg) {
  document.getElementById('previewWrapper').innerHTML = `
    <div class="error-placeholder">
      <p>⚠️ ${msg}</p>
      <button class="action-btn secondary" style="margin-top:14px" onclick="generateThumbnail()">↺ Try Again</button>
    </div>`;
}

function renderConceptBox(title, style) {
  document.getElementById('conceptBox').textContent =
    `📹 "${title}"\n🎨 Style: ${style.charAt(0).toUpperCase() + style.slice(1)}\n${STYLE_TIPS[style]}\n📐 Output: 1280×720px (16:9) · Model: Nano Banana 2 via Puter.js`;
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = `position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
      background:#1a1a1a;border:1px solid #333;color:#f0f0f0;padding:12px 24px;
      border-radius:8px;font-size:14px;font-weight:500;z-index:9999;
      white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.5);`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.textContent = ''; }, 3500);
}

// ─── DOWNLOAD ─────────────────────────────────────────
function downloadThumbnail() {
  if (!currentImgEl) return;
  const btn = document.querySelector('.action-btn.primary');
  const orig = btn.textContent;
  btn.textContent = '⏳ Saving…';

  const name = (document.getElementById('videoTitle').value.trim() || 'thumbnail')
    .slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();

  // currentImgEl is a canvas — toBlob works perfectly, no CORS issues
  currentImgEl.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `${name}_thumbnail.png`;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    btn.textContent = orig;
  }, 'image/png');
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
  el.style.boxShadow   = '0 0 0 3px rgba(255,45,45,0.25)';
  el.focus();
  setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1200);
}
