/**
 * AI YouTube Thumbnail Generator by mehulbest
 * script.js — Core generation logic using Claude API (browser-side)
 *
 * Architecture:
 *  1. User enters title + picks style
 *  2. Claude API generates concept text + color palette + layout plan
 *  3. HTML5 Canvas renders a styled thumbnail from the concept
 *  4. User can download the PNG
 */

// ─── STATE ───────────────────────────────────────────
let currentStyle    = 'bold';
let lastConcept     = null;   // { headline, subtext, colors, layout, emoji }
let isGenerating    = false;

// ─── STYLE CONFIG ────────────────────────────────────
const STYLE_THEMES = {
  bold:     { bg: '#1a0000', accent: '#ff2d2d', text: '#ffffff', secondary: '#ffcc00', vibe: 'explosive, high-contrast, urgent numbers or power words' },
  gaming:   { bg: '#000820', accent: '#00f0ff', text: '#ffffff', secondary: '#9b5de5', vibe: 'neon glow, dark atmosphere, epic energy, gamer slang' },
  minimal:  { bg: '#f5f5f0', accent: '#111111', text: '#111111', secondary: '#888888', vibe: 'clean whitespace, elegant typography, understated confidence' },
  vlog:     { bg: '#fff8f0', accent: '#ff6b35', text: '#1a1a1a', secondary: '#ffd166', vibe: 'warm, personal, lifestyle, casual and inviting' },
  tutorial: { bg: '#0d1b2a', accent: '#06d6a0', text: '#ffffff', secondary: '#118ab2', vibe: 'educational, trustworthy, step-by-step, professional' },
  viral:    { bg: '#1a001a', accent: '#ff006e', text: '#ffffff', secondary: '#fb5607', vibe: 'shocking, curiosity-triggering, YOU WONT BELIEVE, reaction energy' },
};

// ─── CHARACTER COUNTER ───────────────────────────────
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

// ─── MAIN GENERATE FUNCTION ──────────────────────────
async function generateThumbnail() {
  const title = document.getElementById('videoTitle').value.trim();

  if (!title) {
    flashInput();
    return;
  }

  if (isGenerating) return;
  isGenerating = true;

  // UI: loading state
  setLoadingState(true);

  try {
    const concept = await fetchConceptFromClaude(title, currentStyle);
    lastConcept   = concept;

    renderCanvas(concept, currentStyle);
    renderConceptBox(concept);
    renderPalette(concept.colors);

    document.getElementById('step-preview').classList.remove('hidden');
    document.getElementById('step-preview').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Generation error:', err);
    // Fallback: generate locally without API
    const fallback = buildFallbackConcept(title, currentStyle);
    lastConcept    = fallback;
    renderCanvas(fallback, currentStyle);
    renderConceptBox(fallback);
    renderPalette(fallback.colors);

    document.getElementById('step-preview').classList.remove('hidden');
    document.getElementById('step-preview').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } finally {
    setLoadingState(false);
    isGenerating = false;
  }
}

// ─── CLAUDE API CALL ─────────────────────────────────
async function fetchConceptFromClaude(title, style) {
  const theme  = STYLE_THEMES[style];
  const prompt = `You are a YouTube thumbnail design expert. Generate a thumbnail concept for this video.

Video title: "${title}"
Style: ${style} — ${theme.vibe}

Respond ONLY with a valid JSON object (no markdown, no backticks). Use this exact shape:
{
  "headline": "SHORT PUNCHY TEXT (max 5 words, ALL CAPS)",
  "subtext": "Supporting line (max 8 words)",
  "emoji": "one relevant emoji",
  "layout": "left | center | right",
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "tip": "one sentence design tip for this thumbnail"
}

Rules:
- headline must be SHORT and IMPACTFUL (think clickbait but honest)
- colors must match the ${style} aesthetic
- layout describes where the main text block sits`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data    = await response.json();
  const rawText = data.content.map(b => b.text || '').join('');
  const clean   = rawText.replace(/```json|```/g, '').trim();
  const parsed  = JSON.parse(clean);

  // Merge with theme defaults
  return {
    headline: parsed.headline || title.toUpperCase().slice(0, 40),
    subtext:  parsed.subtext  || '',
    emoji:    parsed.emoji    || '🎬',
    layout:   parsed.layout   || 'center',
    colors:   parsed.colors   || [theme.bg, theme.accent, theme.text, theme.secondary],
    tip:      parsed.tip      || '',
  };
}

// ─── FALLBACK (no API / offline) ─────────────────────
function buildFallbackConcept(title, style) {
  const theme = STYLE_THEMES[style];
  const words = title.split(' ');
  const headline = words.slice(0, 4).join(' ').toUpperCase();
  const emojis   = { bold:'🔥', gaming:'🎮', minimal:'✦', vlog:'🎬', tutorial:'📚', viral:'⚡' };

  return {
    headline,
    subtext:  title.length > headline.length ? title.slice(headline.length).trim() : 'Watch now',
    emoji:    emojis[style] || '▶',
    layout:   'center',
    colors:   [theme.bg, theme.accent, theme.text, theme.secondary],
    tip:      'Tip: Keep your thumbnail readable at small sizes.',
  };
}

// ─── CANVAS RENDERER ─────────────────────────────────
function renderCanvas(concept, style) {
  const canvas  = document.getElementById('thumbnailCanvas');
  const ctx     = canvas.getContext('2d');
  const W = 1280, H = 720;
  canvas.width  = W;
  canvas.height = H;

  const theme  = STYLE_THEMES[style];
  const colors = concept.colors;

  // 1. Background
  const bgGrad = ctx.createRadialGradient(W * 0.3, H * 0.3, 0, W * 0.5, H * 0.5, W * 0.8);
  bgGrad.addColorStop(0, adjustColor(colors[0], 30));
  bgGrad.addColorStop(1, colors[0]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Decorative geometric shapes
  drawDecoratives(ctx, concept, colors, W, H, style);

  // 3. Accent stripe / divider
  ctx.fillStyle = colors[1];
  if (style === 'minimal') {
    ctx.fillRect(80, H - 100, 5, 60);
  } else {
    ctx.fillRect(0, H - 16, W, 16);
  }

  // 4. Text layout
  const layoutX = concept.layout === 'left'  ? W * 0.08
                : concept.layout === 'right' ? W * 0.52
                : W * 0.5;
  const align    = concept.layout === 'center' ? 'center' : 'left';

  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  // Headline shadow / glow
  if (style !== 'minimal') {
    ctx.shadowColor   = colors[1];
    ctx.shadowBlur    = 40;
  }

  // Headline
  const headFontSize = clamp(80, 160, Math.floor(900 / (concept.headline.length + 1)));
  ctx.font      = `900 ${headFontSize}px 'Bebas Neue', Impact, sans-serif`;
  ctx.fillStyle = colors[2];
  ctx.fillText(concept.headline, layoutX, H * 0.42, W * 0.88);

  // Subtext
  ctx.shadowBlur  = 0;
  ctx.font        = `500 ${Math.round(headFontSize * 0.32)}px 'DM Sans', Arial, sans-serif`;
  ctx.fillStyle   = colors[3] || colors[1];
  ctx.fillText(concept.subtext, layoutX, H * 0.42 + headFontSize * 0.75, W * 0.88);

  // Emoji decoration
  ctx.font      = `${Math.round(headFontSize * 0.55)}px serif`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 20;
  ctx.shadowColor = colors[1];
  const emojiX = concept.layout === 'right' ? W * 0.18
               : concept.layout === 'left'  ? W * 0.84
               : W * 0.88;
  ctx.fillText(concept.emoji, emojiX, H * 0.38);

  ctx.shadowBlur = 0;

  // 5. Subtle brand watermark
  ctx.textAlign   = 'right';
  ctx.font        = '400 20px DM Sans, Arial, sans-serif';
  ctx.fillStyle   = 'rgba(255,255,255,0.18)';
  ctx.fillText('AI Thumbnail Generator by mehulbest', W - 24, H - 30);
}

function drawDecoratives(ctx, concept, colors, W, H, style) {
  ctx.save();

  if (style === 'gaming') {
    // Neon grid lines
    ctx.strokeStyle = colors[1] + '33';
    ctx.lineWidth   = 1;
    for (let i = 0; i < W; i += 80) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    }
    for (let i = 0; i < H; i += 80) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
    }
    // Diagonal neon slash
    ctx.strokeStyle = colors[1] + '55';
    ctx.lineWidth   = 6;
    ctx.beginPath(); ctx.moveTo(W * 0.65, 0); ctx.lineTo(W * 0.85, H); ctx.stroke();

  } else if (style === 'bold' || style === 'viral') {
    // Burst lines from corner
    ctx.strokeStyle = colors[1] + '22';
    ctx.lineWidth   = 3;
    const cx = W * 0.85, cy = H * 0.2;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * W, cy + Math.sin(a) * W);
      ctx.stroke();
    }

  } else if (style === 'minimal') {
    // Thin border frame
    ctx.strokeStyle = colors[1] + '44';
    ctx.lineWidth   = 3;
    ctx.strokeRect(24, 24, W - 48, H - 48);

  } else if (style === 'vlog' || style === 'tutorial') {
    // Warm circle backdrop
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, H * 0.55);
    grad.addColorStop(0, colors[1] + '22');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

// ─── CONCEPT BOX ─────────────────────────────────────
function renderConceptBox(concept) {
  const box = document.getElementById('conceptBox');
  box.textContent =
    `💡 Headline: ${concept.headline}\n` +
    `📝 Subtext:  ${concept.subtext}\n` +
    (concept.tip ? `🎨 Design tip: ${concept.tip}` : '');
}

// ─── PALETTE ─────────────────────────────────────────
function renderPalette(colors) {
  const row = document.getElementById('paletteRow');
  row.innerHTML = '';
  colors.forEach(hex => {
    const div = document.createElement('div');
    div.className          = 'palette-swatch';
    div.style.background   = hex;
    div.title              = hex;
    row.appendChild(div);
  });
}

// ─── DOWNLOAD ────────────────────────────────────────
function downloadThumbnail() {
  const canvas = document.getElementById('thumbnailCanvas');
  const link   = document.createElement('a');
  const name   = (document.getElementById('videoTitle').value.trim() || 'thumbnail')
                   .slice(0, 40)
                   .replace(/[^a-z0-9]/gi, '_')
                   .toLowerCase();
  link.download = `${name}_thumbnail.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();
}

// ─── UI HELPERS ──────────────────────────────────────
function setLoadingState(loading) {
  const btn    = document.getElementById('generateBtn');
  const txt    = document.getElementById('btnText');
  const loader = document.getElementById('btnLoader');
  btn.disabled = loading;
  txt.classList.toggle('hidden', loading);
  loader.classList.toggle('hidden', !loading);
}

function flashInput() {
  const input = document.getElementById('videoTitle');
  input.style.borderColor = '#ff2d2d';
  input.style.boxShadow   = '0 0 0 3px rgba(255,45,45,0.25)';
  input.focus();
  setTimeout(() => {
    input.style.borderColor = '';
    input.style.boxShadow   = '';
  }, 1200);
}

// ─── MATH HELPERS ────────────────────────────────────
function clamp(min, max, val) { return Math.min(max, Math.max(min, val)); }

function adjustColor(hex, amount) {
  try {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = clamp(0, 255, (n >> 16) + amount);
    const g = clamp(0, 255, ((n >> 8) & 0xff) + amount);
    const b = clamp(0, 255, (n & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  } catch { return hex; }
}

// ─── KEYBOARD SHORTCUT (Enter to generate) ───────────
document.getElementById('videoTitle').addEventListener('keydown', e => {
  if (e.key === 'Enter') generateThumbnail();
});
