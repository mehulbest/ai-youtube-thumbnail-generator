/**
 * AI YouTube Thumbnail Generator by mehulbest
 * script.js — Puter.js + Nano Banana (Gemini 3.1 Flash Image)
 *
 * FIX: Google OAuth via Puter sometimes leaves the popup open
 * even after successful sign-in. We poll puter.auth.isSignedIn()
 * every second so we detect the login regardless of popup behavior.
 */

let currentStyle = 'bold';
let isGenerating = false;
let currentImgEl = null;
let authPollTimer = null;

// ─── STYLE PROMPTS ───────────────────────────────────
const STYLE_PROMPTS = {
  bold: (t) =>
    `Professional YouTube thumbnail. Text "${t}" in massive bold white block letters with thick red stroke, centered. Dark red to black gradient background with explosive orange fire energy burst and cinematic god-rays. High contrast. Photorealistic. 16:9.`,
  gaming: (t) =>
    `Professional YouTube gaming thumbnail. Text "${t}" in glowing cyan neon bold font. Ultra-dark background with purple and cyan neon light streaks, particle effects, hexagonal HUD elements, lens flare. Epic cinematic video game poster. 16:9.`,
  minimal: (t) =>
    `Professional YouTube thumbnail, ultra clean minimalist. Text "${t}" in large bold black serif font on pure white background. Single thin red accent line. Generous whitespace. Premium editorial magazine aesthetic. 16:9.`,
  vlog: (t) =>
    `Professional YouTube vlog thumbnail. Text "${t}" in warm white bold font. Warm golden hour bokeh background in amber and peach tones. Lifestyle influencer aesthetic, cozy and inviting. 16:9.`,
  tutorial: (t) =>
    `Professional YouTube tutorial thumbnail. Text "${t}" in clean bold white font. Dark navy to teal gradient background. Bright green accent elements. Clean modern tech/education aesthetic. 16:9.`,
  viral: (t) =>
    `Professional YouTube viral thumbnail. Text "${t}" in massive bold yellow font with thick black stroke. Shocking magenta to electric orange gradient. High-contrast extreme energy. Red arrows pointing at text. 16:9.`,
};

const STYLE_TIPS = {
  bold:     '🔥 High contrast + fire = the classic viral formula.',
  gaming:   '🎮 Neon on black is the #1 gaming thumbnail formula.',
  minimal:  '✦ Whitespace signals premium quality to viewers.',
  vlog:     '🎬 Warm golden tones build trust and emotional connection.',
  tutorial: '📚 Navy + green instantly signals "professional teacher".',
  viral:    '⚡ Yellow + black + arrows is the most clickable combo.',
};

// ─── ON LOAD: check already signed in + start polling ─
window.addEventListener('load', () => {
  checkAuthState();
  // Poll every 1.5s in case popup closed or Google OAuth callback was slow
  authPollTimer = setInterval(checkAuthState, 1500);
});

function checkAuthState() {
  try {
    if (puter.auth.isSignedIn()) {
      clearInterval(authPollTimer); // stop polling once confirmed
      setConnected(true);
    }
  } catch (e) {
    // puter not ready yet — keep polling
  }
}

// ─── CONNECT BUTTON (must be a real click for popup) ──
async function connectPuter() {
  const btn = document.getElementById('connectBtn');
  btn.textContent = '⏳ Opening sign-in popup…';
  btn.disabled = true;

  try {
    // Open the Puter sign-in popup
    // After user signs in (even with Google), polling above will detect it
    await puter.auth.signIn();
    // If promise resolves cleanly, great:
    setConnected(true);
  } catch (err) {
    // Promise may never resolve with Google OAuth (known issue)
    // Polling will still catch it — just reset button and wait
    console.warn('signIn() did not resolve — polling will detect sign-in:', err);
    btn.textContent = '⏳ Waiting for sign-in…';
    btn.disabled = true;
    // Keep polling — it will update UI when auth is detected
  }
}

function setConnected(connected) {
  const status = document.getElementById('authStatus');
  const text   = document.getElementById('authStatusText');
  const btn    = document.getElementById('connectBtn');

  if (connected) {
    status.className    = 'auth-status connected';
    text.textContent    = '✓ Connected — ready to generate!';
    btn.textContent     = '✓ Connected';
    btn.disabled        = true;
    btn.style.opacity   = '0.5';
    btn.style.cursor    = 'default';
  }
}

// ─── CHAR COUNTER ─────────────────────────────────────
document.getElementById('videoTitle').addEventListener('input', function () {
  document.getElementById('charCount').textContent = this.value.length;
});

// ─── STYLE SELECTOR ──────────────────────────────────
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
    showToast('Please connect your Puter account first (Step 00 above)');
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
    const imgElement = await puter.ai.txt2img(prompt, {
      model: 'gemini-3.1-flash-image-preview', // Nano Banana 2
    });
    currentImgEl = imgElement;
    showGeneratedImage(imgElement);
    renderConceptBox(title, currentStyle);
  } catch (err) {
    console.error('Generation error:', err);
    showError(`Generation failed: ${err.message || 'Unknown error. Please try again.'}`);
  } finally {
    setLoadingState(false);
    isGenerating = false;
  }
}

// ─── UI FUNCTIONS ─────────────────────────────────────
function showLoadingUI() {
  document.getElementById('previewWrapper').innerHTML = `
    <div class="loading-placeholder">
      <div class="spinner"></div>
      <p class="loading-text">Nano Banana is painting your thumbnail…</p>
      <p class="loading-sub">Gemini 3.1 Flash Image · Free via Puter.js · ~15–30 sec</p>
      <div class="progress-bar"><div class="progress-fill"></div></div>
    </div>`;
}

function showGeneratedImage(imgEl) {
  imgEl.style.cssText = 'width:100%;height:auto;display:block;border-radius:8px;';
  imgEl.alt = 'AI Generated YouTube Thumbnail';
  const wrapper = document.getElementById('previewWrapper');
  wrapper.innerHTML = '';
  wrapper.appendChild(imgEl);
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
    `📹 "${title}"\n🎨 Style: ${style.charAt(0).toUpperCase() + style.slice(1)}\n${STYLE_TIPS[style]}\n⚡ Model: Nano Banana 2 (Gemini 3.1 Flash Image) via Puter.js`;
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
      background:#ff2d2d; color:#fff; padding:12px 24px; border-radius:8px;
      font-size:14px; font-weight:600; z-index:9999;
      animation: fadeSlideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

// ─── DOWNLOAD ────────────────────────────────────────
async function downloadThumbnail() {
  if (!currentImgEl) return;
  const btn = document.querySelector('.action-btn.primary');
  const original = btn.textContent;
  btn.textContent = '⏳ Saving…';

  try {
    const canvas = document.createElement('canvas');
    canvas.width  = currentImgEl.naturalWidth  || 1280;
    canvas.height = currentImgEl.naturalHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(currentImgEl, 0, 0);
    const name = (document.getElementById('videoTitle').value.trim() || 'thumbnail')
      .slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `${name}_thumbnail.png`;
      a.href = url;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/png');
  } catch {
    window.open(currentImgEl.src, '_blank');
  } finally {
    btn.textContent = original;
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
  el.style.boxShadow   = '0 0 0 3px rgba(255,45,45,0.25)';
  el.focus();
  setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1200);
}
