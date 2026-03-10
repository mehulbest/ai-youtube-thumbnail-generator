/**
 * AI YouTube Thumbnail Generator by mehulbest
 * script.js — Full flow:
 *   1. Enter video title
 *   2. Upload your photo (optional)
 *   3. GPT-4o generates 5 thumbnail concepts (text)
 *   4. Pick one concept
 *   5. Gemini generates the actual image (with your face if uploaded)
 *   6. Download 1280×720 PNG
 */

// ─── STATE ────────────────────────────────────────────
let currentStyle     = 'bold';
let isGenerating     = false;
let photoBase64      = null;   // uploaded photo as base64
let photoMime        = null;
let photoSkipped     = false;
let generatedConcepts = [];    // array of {title, prompt} objects
let selectedConcept  = null;   // the one user picked
let currentCanvas    = null;   // final 1280×720 canvas
let authPollTimer    = null;

// ─── STYLE KEYWORDS (used to flavor concept generation) ───
const STYLE_KEYWORDS = {
  bold:     'bold dramatic high contrast explosive energy',
  gaming:   'epic neon gaming dark cinematic',
  minimal:  'clean minimal elegant whitespace',
  vlog:     'warm personal lifestyle golden hour',
  tutorial: 'professional educational trustworthy',
  viral:    'shocking clickbait urgent viral energy',
};

// ─── AUTH ─────────────────────────────────────────────
window.addEventListener('load', () => {
  checkAuthState();
  authPollTimer = setInterval(checkAuthState, 1500);
});

function checkAuthState() {
  try {
    setConnected(puter.auth.isSignedIn());
  } catch (e) {}
}

async function connectPuter() {
  const btn = document.getElementById('connectBtn');
  btn.textContent = '⏳ Opening sign-in…';
  btn.disabled = true;
  try {
    await puter.auth.signIn();
    setConnected(true);
  } catch (err) {
    btn.textContent = '⏳ Waiting… close popup if stuck';
  }
}

function logoutPuter() {
  try {
    puter.auth.signOut();
    setConnected(false);
    showToast('Signed out of Puter');
  } catch (err) {
    console.error('Logout error:', err);
    showToast('⚠️ Failed to log out. Please try again.');
  }
}

function setConnected(connected) {
  const status = document.getElementById('authStatus');
  const text   = document.getElementById('authStatusText');
  const connectBtn = document.getElementById('connectBtn');
  const logoutBtn  = document.getElementById('logoutBtn');
  if (connected) {
    status.className  = 'auth-status connected';
    text.textContent  = '✓ Connected — ready to generate!';
    connectBtn.textContent = '✓ Connected';
    connectBtn.disabled = true;
    connectBtn.style.opacity = '0.5';
    connectBtn.style.cursor = 'default';
    connectBtn.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    return;
  }

  status.className  = 'auth-status disconnected';
  text.textContent  = 'Not connected';
  connectBtn.textContent = '🔗 Connect with Puter (free)';
  connectBtn.disabled = false;
  connectBtn.style.opacity = '1';
  connectBtn.style.cursor = 'pointer';
  connectBtn.classList.remove('hidden');
  logoutBtn.classList.add('hidden');
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

// ─── PHOTO UPLOAD ────────────────────────────────────
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('⚠️ Photo must be under 5MB'); return; }

  photoMime = file.type;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    photoBase64 = dataUrl.split(',')[1]; // strip data:image/...;base64,

    // Show preview
    const preview = document.getElementById('photoPreview');
    preview.src = dataUrl;
    preview.classList.remove('hidden');
    document.getElementById('uploadPlaceholder').classList.add('hidden');

    // Show description field
    document.getElementById('photoDescRow').classList.remove('hidden');

    // Update skip button
    document.getElementById('skipPhotoBtn').textContent = '✕ Remove photo';
    photoSkipped = false;
  };
  reader.readAsDataURL(file);
}

function toggleSkipPhoto() {
  if (photoBase64) {
    // Remove photo
    photoBase64 = null;
    photoMime = null;
    document.getElementById('photoPreview').classList.add('hidden');
    document.getElementById('uploadPlaceholder').classList.remove('hidden');
    document.getElementById('photoDescRow').classList.add('hidden');
    document.getElementById('photoInput').value = '';
    document.getElementById('skipPhotoBtn').textContent = 'Skip — generate without my photo';
    photoSkipped = false;
  } else {
    photoSkipped = !photoSkipped;
    document.getElementById('skipPhotoBtn').textContent = photoSkipped
      ? '✓ Skipping photo'
      : 'Skip — generate without my photo';
    document.getElementById('skipPhotoBtn').style.opacity = photoSkipped ? '0.5' : '1';
  }
}

// Drag & drop on upload zone
const uploadZone = document.getElementById('uploadZone');
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer();
    dt.items.add(file);
    document.getElementById('photoInput').files = dt.files;
    handlePhotoUpload({ target: { files: [file] } });
  }
});

// ─── STEP 1: GENERATE CONCEPTS ───────────────────────
async function generateConcepts() {
  const title = document.getElementById('videoTitle').value.trim();
  if (!title) { flashInput('videoTitle'); return; }

  if (!puter.auth.isSignedIn()) {
    showToast('⚠️ Please connect your Puter account first (Step 00)');
    return;
  }

  setConceptBtnLoading(true);
  generatedConcepts = [];
  selectedConcept   = null;

  // Hide previous results
  document.getElementById('step-concepts').classList.add('hidden');
  document.getElementById('generateBtn').classList.add('hidden');
  document.getElementById('step-preview').classList.add('hidden');

  try {
    const styleKw     = STYLE_KEYWORDS[currentStyle];
    const photoNote   = photoBase64
      ? `The YouTuber has uploaded their own photo to appear in the thumbnail. Their photo description: "${document.getElementById('photoDesc').value.trim() || 'reaction face'}".`
      : '';

    // Ask GPT-4o to generate 5 concept prompts as JSON
    const metaPrompt = `You are an expert YouTube thumbnail designer. 
    
A YouTuber is making a video titled: "${title}"
Thumbnail style preference: ${styleKw}
${photoNote}

Generate exactly 5 different thumbnail concepts for this video. Each concept must be unique.

Respond ONLY with a valid JSON array. No markdown, no explanation, just the JSON.
Format:
[
  {
    "title": "Short catchy concept name (max 5 words)",
    "prompt": "Detailed image generation prompt (100-150 words). ${photoBase64 ? 'Include instruction to place the YouTuber reaction face in the thumbnail based on their description.' : ''} Always end with: Widescreen 16:9 landscape format, YouTube thumbnail style, high quality, no watermarks."
  }
]`;

    const response = await puter.ai.chat(metaPrompt, {
      model: 'gpt-4o',
    });

    // Parse the JSON from GPT-4o's response
    const raw   = typeof response === 'string' ? response : response?.message?.content || response?.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    generatedConcepts = JSON.parse(clean);

    renderConcepts(generatedConcepts);
    document.getElementById('step-concepts').classList.remove('hidden');
    document.getElementById('step-concepts').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Concept generation error:', err);
    showToast('⚠️ Failed to generate concepts. Please try again.');
  } finally {
    setConceptBtnLoading(false);
  }
}

// ─── RENDER CONCEPT CARDS ────────────────────────────
function renderConcepts(concepts) {
  const list = document.getElementById('conceptsList');
  list.innerHTML = '';

  concepts.forEach((concept, i) => {
    const card = document.createElement('div');
    card.className   = 'concept-card';
    card.dataset.idx = i;
    card.innerHTML   = `
      <div class="concept-card-header">
        <span class="concept-num">Concept ${i + 1}</span>
        <span class="concept-title">${concept.title}</span>
      </div>
      <p class="concept-prompt-preview" id="prompt-preview-${i}">${concept.prompt.slice(0, 140)}…</p>
      <p class="concept-prompt-full hidden" id="prompt-full-${i}">${concept.prompt}</p>
      <div class="concept-card-actions">
        <button class="expand-btn" onclick="togglePrompt(${i})">
          <span id="expand-label-${i}">▼ Read full prompt</span>
        </button>
        <button class="concept-select-btn" onclick="selectConcept(${i})">
          Use This Concept →
        </button>
      </div>
    `;
    list.appendChild(card);
  });
}

// ─── TOGGLE PROMPT EXPAND ────────────────────────────
function togglePrompt(i) {
  const preview = document.getElementById('prompt-preview-' + i);
  const full    = document.getElementById('prompt-full-' + i);
  const label   = document.getElementById('expand-label-' + i);
  const isHidden = full.classList.contains('hidden');
  full.classList.toggle('hidden', !isHidden);
  preview.classList.toggle('hidden', isHidden);
  label.textContent = isHidden ? '▲ Hide prompt' : '▼ Read full prompt';
}

// ─── SELECT CONCEPT ──────────────────────────────────
function selectConcept(idx) {
  selectedConcept = generatedConcepts[idx];

  // Highlight selected card
  document.querySelectorAll('.concept-card').forEach((c, i) => {
    c.classList.toggle('selected', i === idx);
  });

  // Show generate button
  document.getElementById('generateBtn').classList.remove('hidden');
  document.getElementById('generateBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ─── STEP 2: GENERATE IMAGE ──────────────────────────
async function generateThumbnail() {
  if (!selectedConcept) { showToast('⚠️ Please select a concept first'); return; }
  if (!puter.auth.isSignedIn()) { showToast('⚠️ Not connected'); return; }
  if (isGenerating) return;

  isGenerating  = true;
  currentCanvas = null;

  setImageBtnLoading(true);
  document.getElementById('step-preview').classList.remove('hidden');
  showLoadingUI();
  document.getElementById('step-preview').scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    let imgElement;

    if (photoBase64) {
      // Send photo + prompt together to Gemini image generation
      imgElement = await puter.ai.txt2img(selectedConcept.prompt, {
        model: 'gemini-3.1-flash-image-preview',
        image: {
          data: photoBase64,
          mimeType: photoMime || 'image/jpeg',
        },
      });
    } else {
      // Text-only generation
      imgElement = await puter.ai.txt2img(selectedConcept.prompt, {
        model: 'gemini-3.1-flash-image-preview',
      });
    }

    // Force 1280×720 16:9
    const canvas = await forceSixteenByNine(imgElement);
    currentCanvas = canvas;

    showGeneratedCanvas(canvas);
    renderConceptBox(selectedConcept);

  } catch (err) {
    console.error('Image generation error:', err);
    showError(`Generation failed: ${err.message || 'Please try again.'}`);
  } finally {
    setImageBtnLoading(false);
    isGenerating = false;
  }
}

// ─── FORCE 16:9 (1280×720) ───────────────────────────
async function forceSixteenByNine(imgEl) {
  const W = 1280, H = 720;

  await new Promise(resolve => {
    if (imgEl.complete && imgEl.naturalWidth > 0) { resolve(); return; }
    imgEl.onload  = resolve;
    imgEl.onerror = resolve;
  });

  const srcW = imgEl.naturalWidth  || 1024;
  const srcH = imgEl.naturalHeight || 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  const srcRatio = srcW / srcH;
  const tgtRatio = W / H;
  let dx, dy, dw, dh;

  if (srcRatio >= tgtRatio) {
    dh = H; dw = dh * srcRatio;
    dx = (W - dw) / 2; dy = 0;
  } else {
    dw = W; dh = dw / srcRatio;
    dx = 0; dy = (H - dh) / 2;
  }

  ctx.drawImage(imgEl, dx, dy, dw, dh);
  return canvas;
}

// ─── BACK TO CONCEPTS ────────────────────────────────
function goBackToConcepts() {
  document.getElementById('step-preview').classList.add('hidden');
  document.getElementById('step-concepts').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── UI HELPERS ──────────────────────────────────────
function showLoadingUI() {
  document.getElementById('previewWrapper').innerHTML = `
    <div class="loading-placeholder">
      <div class="spinner"></div>
      <p class="loading-text">Gemini is painting your thumbnail…</p>
      <p class="loading-sub">Gemini 3.1 Flash Image Preview via Puter.js · ~10–20 sec</p>
      <div class="progress-bar"><div class="progress-fill"></div></div>
    </div>`;
}

function showGeneratedCanvas(canvas) {
  canvas.style.cssText = 'width:100%;height:auto;display:block;border-radius:8px;';
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

function renderConceptBox(concept) {
  document.getElementById('conceptBox').textContent =
    `✦ Concept: ${concept.title}\n📐 Output: 1280×720px (16:9) · Gemini 3.1 Flash Image Preview via Puter.js`;
}

function setConceptBtnLoading(on) {
  document.getElementById('conceptBtn').disabled = on;
  document.getElementById('conceptBtnText').classList.toggle('hidden', on);
  document.getElementById('conceptBtnLoader').classList.toggle('hidden', !on);
}

function setImageBtnLoading(on) {
  document.getElementById('generateBtn').disabled = on;
  document.getElementById('btnText').classList.toggle('hidden', on);
  document.getElementById('btnLoader').classList.toggle('hidden', !on);
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

function flashInput(id) {
  const el = document.getElementById(id);
  el.style.borderColor = '#ff2d2d';
  el.style.boxShadow   = '0 0 0 3px rgba(255,45,45,0.25)';
  el.focus();
  setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1200);
}

// ─── DOWNLOAD ────────────────────────────────────────
function downloadThumbnail() {
  if (!currentCanvas) return;
  const btn = document.querySelector('.action-btn.primary');
  const orig = btn.textContent;
  btn.textContent = '⏳ Saving…';

  const name = (document.getElementById('videoTitle').value.trim() || 'thumbnail')
    .slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();

  currentCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `${name}_thumbnail.png`;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    btn.textContent = orig;
  }, 'image/png');
}
