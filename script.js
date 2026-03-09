/**
 * AI YouTube Thumbnail Generator by mehulbest
 * script.js — Rich Canvas rendering, no external API needed
 */

// ─── STATE ───────────────────────────────────────────
let currentStyle = 'bold';
let isGenerating = false;

// ─── STYLE THEMES ────────────────────────────────────
const STYLE_THEMES = {
  bold: {
    bg1: '#1a0000', bg2: '#3d0000',
    accent: '#ff2d2d', accent2: '#ffcc00',
    textColor: '#ffffff', subColor: '#ffcc00',
    vibe: 'explosive, high-contrast, urgent',
    emoji: '🔥',
  },
  gaming: {
    bg1: '#000820', bg2: '#0a0f3d',
    accent: '#00f0ff', accent2: '#9b5de5',
    textColor: '#ffffff', subColor: '#00f0ff',
    vibe: 'neon glow, dark atmosphere, epic energy',
    emoji: '🎮',
  },
  minimal: {
    bg1: '#f0ede8', bg2: '#e0dbd4',
    accent: '#111111', accent2: '#888888',
    textColor: '#111111', subColor: '#555555',
    vibe: 'clean, elegant, understated',
    emoji: '✦',
  },
  vlog: {
    bg1: '#2d1b00', bg2: '#5c3800',
    accent: '#ff9a3c', accent2: '#ffd166',
    textColor: '#ffffff', subColor: '#ffd166',
    vibe: 'warm, personal, lifestyle',
    emoji: '🎬',
  },
  tutorial: {
    bg1: '#001a12', bg2: '#003828',
    accent: '#06d6a0', accent2: '#118ab2',
    textColor: '#ffffff', subColor: '#06d6a0',
    vibe: 'educational, trustworthy, professional',
    emoji: '📚',
  },
  viral: {
    bg1: '#1a001a', bg2: '#3d003d',
    accent: '#ff006e', accent2: '#fb5607',
    textColor: '#ffffff', subColor: '#fb5607',
    vibe: 'shocking, curiosity-triggering, reaction energy',
    emoji: '⚡',
  },
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

// ─── MAIN GENERATE ───────────────────────────────────
async function generateThumbnail() {
  const title = document.getElementById('videoTitle').value.trim();
  if (!title) { flashInput(); return; }
  if (isGenerating) return;
  isGenerating = true;
  setLoadingState(true);

  try {
    const concept = buildConcept(title, currentStyle);
    await renderRichCanvas(concept, currentStyle);
    renderConceptBox(concept);
    renderPalette([
      STYLE_THEMES[currentStyle].bg1,
      STYLE_THEMES[currentStyle].accent,
      STYLE_THEMES[currentStyle].accent2,
      STYLE_THEMES[currentStyle].subColor,
    ]);
    document.getElementById('step-preview').classList.remove('hidden');
    document.getElementById('step-preview').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } finally {
    setLoadingState(false);
    isGenerating = false;
  }
}

// ─── CONCEPT BUILDER ─────────────────────────────────
function buildConcept(title, style) {
  const words = title.split(' ');
  // Smart headline: first 4 impactful words or key phrase
  let headline = words.slice(0, 4).join(' ').toUpperCase();
  if (headline.length > 24) headline = words.slice(0, 3).join(' ').toUpperCase();
  const subtext = words.length > 4 ? words.slice(4, 9).join(' ') : 'Watch Now';
  const tips = {
    bold:     'Use high contrast and bold fonts to grab attention',
    gaming:   'Neon colors and dark backgrounds dominate gaming thumbnails',
    minimal:  'Less is more — let the typography do the work',
    vlog:     'Warm tones create emotional connection with viewers',
    tutorial: 'Green accents signal learning and growth',
    viral:    'Magenta and orange create urgency and excitement',
  };
  return { headline, subtext, tip: tips[style], emoji: STYLE_THEMES[style].emoji };
}

// ─── RICH CANVAS RENDERER ────────────────────────────
async function renderRichCanvas(concept, style) {
  const canvas = document.getElementById('thumbnailCanvas');
  const ctx = canvas.getContext('2d');
  const W = 1280, H = 720;
  canvas.width = W;
  canvas.height = H;
  const T = STYLE_THEMES[style];

  // 1. Rich Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, T.bg2);
  bgGrad.addColorStop(0.5, T.bg1);
  bgGrad.addColorStop(1, T.bg2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Style-specific background art
  drawBackgroundArt(ctx, style, T, W, H);

  // 3. Overlay vignette for depth
  const vig = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.9);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // 4. Accent shapes
  drawAccentShapes(ctx, style, T, W, H);

  // 5. Main headline text with outline + shadow
  drawHeadline(ctx, concept, T, W, H);

  // 6. Subtext
  drawSubtext(ctx, concept, T, W, H);

  // 7. Decorative emoji / icon
  drawEmoji(ctx, concept, T, W, H);

  // 8. Bottom brand bar
  drawBrandBar(ctx, T, W, H);

  // 9. Watermark
  ctx.font = '400 18px DM Sans, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.textAlign = 'right';
  ctx.fillText('by mehulbest', W - 20, H - 12);
}

// ─── BACKGROUND ART ──────────────────────────────────
function drawBackgroundArt(ctx, style, T, W, H) {
  ctx.save();

  if (style === 'gaming') {
    // Animated-looking diagonal grid
    ctx.strokeStyle = T.accent + '18';
    ctx.lineWidth = 1;
    for (let i = -H; i < W + H; i += 60) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
    }
    // Horizontal scan lines
    ctx.strokeStyle = T.accent2 + '10';
    for (let y = 0; y < H; y += 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // Glowing orb top-right
    const orb = ctx.createRadialGradient(W*0.85, H*0.2, 0, W*0.85, H*0.2, 280);
    orb.addColorStop(0, T.accent + 'aa');
    orb.addColorStop(0.4, T.accent + '33');
    orb.addColorStop(1, 'transparent');
    ctx.fillStyle = orb;
    ctx.fillRect(0, 0, W, H);
    // Second orb
    const orb2 = ctx.createRadialGradient(W*0.1, H*0.8, 0, W*0.1, H*0.8, 200);
    orb2.addColorStop(0, T.accent2 + '88');
    orb2.addColorStop(1, 'transparent');
    ctx.fillStyle = orb2;
    ctx.fillRect(0, 0, W, H);

  } else if (style === 'bold' || style === 'viral') {
    // Sunburst from top-right
    ctx.save();
    ctx.translate(W * 0.82, H * 0.15);
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * W, Math.sin(angle) * W);
      ctx.strokeStyle = T.accent + (i % 2 === 0 ? '15' : '08');
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
    // Bold diagonal slash
    ctx.save();
    ctx.translate(W * 0.62, 0);
    ctx.rotate(0.08);
    const slashGrad = ctx.createLinearGradient(0, 0, 80, H);
    slashGrad.addColorStop(0, T.accent + '00');
    slashGrad.addColorStop(0.5, T.accent + '33');
    slashGrad.addColorStop(1, T.accent + '00');
    ctx.fillStyle = slashGrad;
    ctx.fillRect(0, -100, 80, H + 200);
    ctx.restore();

  } else if (style === 'minimal') {
    // Subtle geometric lines
    ctx.strokeStyle = T.accent + '12';
    ctx.lineWidth = 1;
    // Horizontal rule
    ctx.beginPath(); ctx.moveTo(60, H*0.72); ctx.lineTo(W-60, H*0.72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(60, H*0.76); ctx.lineTo(W*0.4, H*0.76); ctx.stroke();
    // Corner bracket top-left
    ctx.strokeStyle = T.accent + '40';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(50, 50); ctx.lineTo(50, 130); ctx.moveTo(50, 50); ctx.lineTo(130, 50); ctx.stroke();
    // Corner bracket bottom-right
    ctx.beginPath(); ctx.moveTo(W-50, H-50); ctx.lineTo(W-50, H-130); ctx.moveTo(W-50, H-50); ctx.lineTo(W-130, H-50); ctx.stroke();

  } else if (style === 'vlog') {
    // Warm bokeh circles
    for (let i = 0; i < 12; i++) {
      const bx = Math.random() * W;
      const by = Math.random() * H;
      const br = 30 + Math.random() * 120;
      const bokeh = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      bokeh.addColorStop(0, T.accent + '22');
      bokeh.addColorStop(1, 'transparent');
      ctx.fillStyle = bokeh;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2); ctx.fill();
    }
    // Warm light sweep from left
    const sweep = ctx.createLinearGradient(0, 0, W*0.5, H);
    sweep.addColorStop(0, T.accent + '22');
    sweep.addColorStop(1, 'transparent');
    ctx.fillStyle = sweep;
    ctx.fillRect(0, 0, W, H);

  } else if (style === 'tutorial') {
    // Grid pattern
    ctx.strokeStyle = T.accent + '15';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // Glowing circle center-left
    const glow = ctx.createRadialGradient(W*0.25, H*0.5, 0, W*0.25, H*0.5, 300);
    glow.addColorStop(0, T.accent + '44');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

// ─── ACCENT SHAPES ───────────────────────────────────
function drawAccentShapes(ctx, style, T, W, H) {
  ctx.save();

  if (style === 'minimal') {
    // Thin accent line left side
    ctx.fillStyle = T.accent;
    ctx.fillRect(56, H*0.22, 6, H*0.56);
    // Small square dot
    ctx.fillRect(56, H*0.22 - 12, 12, 12);

  } else if (style === 'gaming') {
    // Hexagon shape bottom-left
    drawHexagon(ctx, 120, H - 100, 60, T.accent + '44', T.accent, 2);
    drawHexagon(ctx, 80, H - 140, 30, T.accent2 + '33', T.accent2, 1);

  } else if (style === 'bold' || style === 'viral') {
    // Thick accent bar behind headline area
    ctx.fillStyle = T.accent + '22';
    roundRect(ctx, 40, H*0.28, W - 80, H*0.44, 16);
    ctx.fill();
    // Top accent line
    ctx.fillStyle = T.accent;
    ctx.fillRect(0, 0, W, 8);

  } else if (style === 'vlog') {
    // Warm rounded rectangle
    ctx.fillStyle = T.accent + '18';
    roundRect(ctx, 50, H*0.3, W - 100, H*0.42, 24);
    ctx.fill();

  } else if (style === 'tutorial') {
    // Step badge top-left
    ctx.fillStyle = T.accent;
    roundRect(ctx, 56, 56, 140, 48, 8);
    ctx.fill();
    ctx.font = 'bold 22px DM Sans, Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText('TUTORIAL', 56 + 70, 56 + 32);
  }

  ctx.restore();
}

// ─── HEADLINE TEXT ───────────────────────────────────
function drawHeadline(ctx, concept, T, W, H) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const len = concept.headline.length;
  let fontSize = 180;
  if (len > 20) fontSize = 130;
  if (len > 28) fontSize = 100;
  if (len > 36) fontSize = 80;

  ctx.font = `900 ${fontSize}px 'Bebas Neue', Impact, Arial Black, sans-serif`;

  // Multi-line if needed
  const lines = wrapText(ctx, concept.headline, W - 160);
  const lineH = fontSize * 1.05;
  const totalH = lines.length * lineH;
  const startY = H * 0.46 - totalH / 2 + lineH / 2;

  lines.forEach((line, i) => {
    const y = startY + i * lineH;

    // Outer glow
    if (T.bg1 !== '#f0ede8') { // not minimal
      ctx.shadowColor = T.accent;
      ctx.shadowBlur = 40;
    }

    // Stroke outline
    ctx.lineWidth = fontSize * 0.06;
    ctx.strokeStyle = T.accent;
    ctx.lineJoin = 'round';
    ctx.strokeText(line, W / 2, y);

    // Fill
    ctx.shadowBlur = 0;
    ctx.fillStyle = T.textColor;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 12;
    ctx.fillText(line, W / 2, y);
    ctx.shadowBlur = 0;
  });

  ctx.restore();
}

// ─── SUBTEXT ─────────────────────────────────────────
function drawSubtext(ctx, concept, T, W, H) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = wrapText(ctx, concept.headline, W - 160);
  const headFontSize = concept.headline.length > 28 ? 100 : 150;
  const lineH = headFontSize * 1.05;
  const totalH = lines.length * lineH;
  const headBottom = H * 0.46 + totalH / 2 + 20;

  const subSize = Math.round(headFontSize * 0.28);
  ctx.font = `600 ${subSize}px 'DM Sans', Arial, sans-serif`;
  ctx.fillStyle = T.subColor;
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 10;

  // Pill background behind subtext
  const sw = ctx.measureText(concept.subtext).width + 40;
  ctx.fillStyle = T.accent + 'cc';
  roundRect(ctx, W/2 - sw/2, headBottom - subSize*0.7, sw, subSize*1.4, subSize*0.35);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 0;
  ctx.fillText(concept.subtext, W / 2, headBottom + subSize * 0.05);

  ctx.restore();
}

// ─── EMOJI ───────────────────────────────────────────
function drawEmoji(ctx, concept, T, W, H) {
  ctx.save();
  const size = 110;
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Glow behind emoji
  const eg = ctx.createRadialGradient(W*0.84, H*0.25, 0, W*0.84, H*0.25, 100);
  eg.addColorStop(0, T.accent + '55');
  eg.addColorStop(1, 'transparent');
  ctx.fillStyle = eg;
  ctx.fillRect(W*0.84 - 120, H*0.25 - 120, 240, 240);
  ctx.fillText(concept.emoji, W * 0.84, H * 0.25);
  ctx.restore();
}

// ─── BRAND BAR ───────────────────────────────────────
function drawBrandBar(ctx, T, W, H) {
  ctx.save();
  // Gradient bar at bottom
  const barH = 12;
  const barGrad = ctx.createLinearGradient(0, 0, W, 0);
  barGrad.addColorStop(0, T.accent);
  barGrad.addColorStop(0.5, T.accent2);
  barGrad.addColorStop(1, T.accent);
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, H - barH, W, barH);
  ctx.restore();
}

// ─── HELPERS ─────────────────────────────────────────
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHexagon(ctx, cx, cy, r, fill, stroke, lw) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
            : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
}

// ─── CONCEPT BOX ─────────────────────────────────────
function renderConceptBox(concept) {
  document.getElementById('conceptBox').textContent =
    `💡 Headline: ${concept.headline}\n📝 Subtext: ${concept.subtext}\n🎨 Tip: ${concept.tip}`;
}

function renderPalette(colors) {
  const row = document.getElementById('paletteRow');
  row.innerHTML = '';
  colors.forEach(hex => {
    const d = document.createElement('div');
    d.className = 'palette-swatch';
    d.style.background = hex;
    d.title = hex;
    row.appendChild(d);
  });
}

// ─── DOWNLOAD ────────────────────────────────────────
function downloadThumbnail() {
  const canvas = document.getElementById('thumbnailCanvas');
  const link = document.createElement('a');
  const name = (document.getElementById('videoTitle').value.trim() || 'thumbnail')
    .slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.download = `${name}_thumbnail.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ─── UI HELPERS ──────────────────────────────────────
function setLoadingState(loading) {
  const btn = document.getElementById('generateBtn');
  document.getElementById('btnText').classList.toggle('hidden', loading);
  document.getElementById('btnLoader').classList.toggle('hidden', !loading);
  btn.disabled = loading;
}

function flashInput() {
  const input = document.getElementById('videoTitle');
  input.style.borderColor = '#ff2d2d';
  input.style.boxShadow = '0 0 0 3px rgba(255,45,45,0.25)';
  input.focus();
  setTimeout(() => { input.style.borderColor = ''; input.style.boxShadow = ''; }, 1200);
}

document.getElementById('videoTitle').addEventListener('keydown', e => {
  if (e.key === 'Enter') generateThumbnail();
});
