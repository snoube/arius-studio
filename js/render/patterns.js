/*
 * Motifs (outil 5) : rayures, trois motifs carrés (quadrillage, damier, plaques), destruction.
 * Peints après l'effet, toujours dans la forme du calque : effet et motif cohabitent.
 */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const P = {};

  P.TYPES = [
    { value: 'none', label: 'Défaut (sans motif)' },
    { value: 'rayures', label: 'Rayures' },
    { value: 'quadrillage', label: 'Carrés : quadrillage' },
    { value: 'damier', label: 'Carrés : damier' },
    { value: 'plaques', label: 'Carrés : plaques rivetées' },
    { value: 'destruction', label: 'Destruction (impact)' }
  ];

  P.DEFAULTS = {
    none: {},
    rayures: { orientation: 'horizontal', thickness: 2, spacing: 6, offset: 0, color: '#ffffff', opacity: 12 },
    quadrillage: { size: 16, thickness: 1, offset: 0, color: '#ffffff', opacity: 10 },
    damier: { size: 8, color: '#000000', opacity: 18 },
    plaques: { size: 32, gap: 2, relief: 60, rivets: true, color: '#000000', opacity: 60 },
    destruction: { x: 50, y: 50, radius: 18, cracks: 7, length: 55, branches: 2, color: '#000000', intensity: 80, seed: 11 }
  };

  function rayures(ctx, w, h, p) {
    const t = Math.max(1, p.thickness);
    const step = t + Math.max(0, p.spacing);
    ctx.fillStyle = p.color;
    const start = (p.offset % step) - step;
    if (p.orientation === 'horizontal') {
      for (let y = start; y < h; y += step) ctx.fillRect(0, y, w, t);
    } else if (p.orientation === 'vertical') {
      for (let x = start; x < w; x += step) ctx.fillRect(x, 0, t, h);
    } else {
      const R = Math.hypot(w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(p.orientation === 'diagonale-montante' ? -Math.PI / 4 : Math.PI / 4);
      for (let y = -R + (p.offset % step); y < R; y += step) ctx.fillRect(-R, y, R * 2, t);
      ctx.restore();
    }
  }

  function quadrillage(ctx, w, h, p) {
    const s = Math.max(2, p.size);
    const t = Math.max(1, p.thickness);
    ctx.fillStyle = p.color;
    for (let x = (p.offset % s) - s; x < w; x += s) ctx.fillRect(x, 0, t, h);
    for (let y = (p.offset % s) - s; y < h; y += s) ctx.fillRect(0, y, w, t);
  }

  function damier(ctx, w, h, p) {
    const s = Math.max(1, p.size);
    ctx.fillStyle = p.color;
    for (let j = 0; j * s < h; j++) {
      for (let i = 0; i * s < w; i++) if ((i + j) % 2 === 0) ctx.fillRect(i * s, j * s, s, s);
    }
  }

  function plaques(ctx, w, h, p) {
    const s = Math.max(4, p.size);
    const g = Math.max(0, p.gap);
    const step = s + g;
    const relief = p.relief / 100;
    // joints
    ctx.fillStyle = p.color;
    for (let x = s; x < w; x += step) ctx.fillRect(x, 0, g, h);
    for (let y = s; y < h; y += step) ctx.fillRect(0, y, w, g);
    // biseau de chaque plaque (non lié à l'opacité des joints)
    ctx.globalAlpha = 1;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        ctx.fillStyle = U.rgba('#ffffff', 0.32 * relief);
        ctx.fillRect(x, y, s, 1);
        ctx.fillRect(x, y, 1, s);
        ctx.fillStyle = U.rgba('#000000', 0.4 * relief);
        ctx.fillRect(x, y + s - 1, s, 1);
        ctx.fillRect(x + s - 1, y, 1, s);
        if (p.rivets && s >= 12) {
          const r = Math.max(1, Math.round(s / 16));
          [[3, 3], [s - 3 - r, 3], [3, s - 3 - r], [s - 3 - r, s - 3 - r]].forEach(([rx, ry]) => {
            ctx.fillStyle = U.rgba('#000000', 0.45 * relief);
            ctx.fillRect(x + rx + 1, y + ry + 1, r, r);
            ctx.fillStyle = U.rgba('#ffffff', 0.5 * relief);
            ctx.fillRect(x + rx, y + ry, r, r);
          });
        }
      }
    }
  }

  function destruction(ctx, w, h, p) {
    const rand = U.rng(p.seed);
    const cx = (p.x / 100) * w;
    const cy = (p.y / 100) * h;
    const i = p.intensity / 100;
    const R = Math.max(2, p.radius);

    // enfoncement
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.8);
    g.addColorStop(0, U.rgba(p.color, 0.6 * i));
    g.addColorStop(0.55, U.rgba(p.color, 0.25 * i));
    g.addColorStop(1, U.rgba(p.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // rebord : lumière en haut à gauche, ombre en bas à droite
    ctx.lineWidth = Math.max(1, R * 0.12);
    ctx.strokeStyle = U.rgba('#ffffff', 0.28 * i);
    ctx.beginPath();
    ctx.arc(cx, cy, R, Math.PI * 0.95, Math.PI * 1.75);
    ctx.stroke();
    ctx.strokeStyle = U.rgba(p.color, 0.55 * i);
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI * 0.05, Math.PI * 0.75);
    ctx.stroke();

    // fissures (marche aléatoire + ramifications)
    const segments = [];
    const queue = [];
    const maxLen = (p.length / 100) * Math.max(w, h) * 0.6;
    const n = Math.max(1, Math.round(p.cracks));
    for (let k = 0; k < n; k++) {
      const ang = (k / n) * Math.PI * 2 + (rand() - 0.5) * 0.8;
      queue.push([cx + Math.cos(ang) * R * 0.6, cy + Math.sin(ang) * R * 0.6, ang, maxLen * (0.55 + rand() * 0.45), Math.max(1.2, R * 0.12), Math.round(p.branches)]);
    }
    let guard = 0;
    while (queue.length && guard++ < 400) {
      let [x, y, ang, len, width, depth] = queue.shift();
      let travelled = 0;
      while (travelled < len) {
        const seg = 4 + rand() * 8;
        ang += (rand() - 0.5) * 0.7;
        const nx = x + Math.cos(ang) * seg;
        const ny = y + Math.sin(ang) * seg;
        travelled += seg;
        segments.push([x, y, nx, ny, Math.max(0.6, width * (1 - travelled / len))]);
        if (depth > 0 && rand() < 0.12) {
          queue.push([nx, ny, ang + (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.6), (len - travelled) * 0.6, width * 0.6, depth - 1]);
        }
        x = nx;
        y = ny;
      }
    }
    ctx.lineCap = 'round';
    segments.forEach(([x1, y1, x2, y2, lw]) => {
      ctx.strokeStyle = U.rgba('#ffffff', 0.18 * i);
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x1 + 1, y1 + 1);
      ctx.lineTo(x2 + 1, y2 + 1);
      ctx.stroke();
    });
    segments.forEach(([x1, y1, x2, y2, lw]) => {
      ctx.strokeStyle = U.rgba(p.color, 0.9 * i);
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // éclats
    const chips = Math.round(R / 2);
    for (let k = 0; k < chips; k++) {
      const a = rand() * Math.PI * 2;
      const d = R * (0.4 + rand() * 0.9);
      const s = 1 + rand() * Math.max(1, R * 0.12);
      ctx.fillStyle = U.rgba(rand() > 0.4 ? p.color : '#ffffff', (0.3 + rand() * 0.4) * i);
      ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, s);
    }
  }

  P.apply = function (ctx, w, h, pattern) {
    if (!pattern || !pattern.type || pattern.type === 'none') return;
    const p = { ...P.DEFAULTS[pattern.type], ...pattern };
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    if (p.opacity != null) ctx.globalAlpha = U.clamp(p.opacity / 100, 0, 1);
    switch (p.type) {
      case 'rayures': rayures(ctx, w, h, p); break;
      case 'quadrillage': quadrillage(ctx, w, h, p); break;
      case 'damier': damier(ctx, w, h, p); break;
      case 'plaques': plaques(ctx, w, h, p); break;
      case 'destruction': destruction(ctx, w, h, p); break;
      default: break;
    }
    ctx.restore();
  };

  A.render.patterns = P;
})(window.Arius);
