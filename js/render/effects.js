/*
 * Effets de fond (outil 4) : reflet, dégradé sombre / clair, métallisé, scintillant.
 * Ils sont peints "par-dessus" la forme en respectant sa transparence (source-atop) :
 * les zones vides restent vides.
 */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const E = {};

  E.TYPES = [
    { value: 'none', label: 'Défaut (aucun effet)' },
    { value: 'reflet', label: 'Reflet' },
    { value: 'degrade-sombre', label: 'Dégradé sombre' },
    { value: 'degrade-clair', label: 'Dégradé clair' },
    { value: 'metal', label: 'Métallisé' },
    { value: 'scintillant', label: 'Scintillant' }
  ];

  E.DEFAULTS = {
    none: {},
    reflet: { angle: 35, position: 35, width: 22, softness: 70, intensity: 45, color: '#ffffff', double: true },
    'degrade-sombre': { direction: 'haut-bas', start: 0, intensity: 60 },
    'degrade-clair': { direction: 'bas-haut', start: 0, intensity: 45 },
    metal: { orientation: 'horizontal', bands: 3, intensity: 55, brush: 60, seed: 7 },
    scintillant: { density: 25, size: 6, intensity: 85, color: '#ffffff', glow: true, seed: 3 }
  };

  function reflet(ctx, w, h, p) {
    const a = (p.angle * Math.PI) / 180;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const proj = [[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => x * dx + y * dy);
    const min = Math.min(...proj);
    const span = Math.max(...proj) - min;
    const inner = U.clamp((1 - p.softness / 100) * 0.5, 0, 0.5);

    const band = (center, width, alpha) => {
      const half = Math.max(0.5, width / 2);
      const c = min + center;
      const g = ctx.createLinearGradient(dx * (c - half), dy * (c - half), dx * (c + half), dy * (c + half));
      g.addColorStop(0, U.rgba(p.color, 0));
      g.addColorStop(0.5 - inner, U.rgba(p.color, alpha));
      g.addColorStop(0.5 + inner, U.rgba(p.color, alpha));
      g.addColorStop(1, U.rgba(p.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };

    const center = (p.position / 100) * span;
    const width = (p.width / 100) * span;
    band(center, width, p.intensity / 100);
    if (p.double) band(center + width * 0.85, width * 0.3, (p.intensity / 100) * 0.6);
  }

  function degrade(ctx, w, h, p, light) {
    const col = light ? '#ffffff' : '#000000';
    const dirs = {
      'haut-bas': [0, 0, 0, h],
      'bas-haut': [0, h, 0, 0],
      'gauche-droite': [0, 0, w, 0],
      'droite-gauche': [w, 0, 0, 0],
      diagonale: [0, 0, w, h]
    };
    const g =
      p.direction === 'radial'
        ? ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.hypot(w, h) / 2)
        : ctx.createLinearGradient(...(dirs[p.direction] || dirs['haut-bas']));
    g.addColorStop(0, U.rgba(col, 0));
    g.addColorStop(U.clamp(p.start / 100, 0, 0.99), U.rgba(col, 0));
    g.addColorStop(1, U.rgba(col, p.intensity / 100));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function metal(ctx, w, h, p) {
    const i = p.intensity / 100;
    const horiz = p.orientation !== 'vertical';
    const rand = U.rng(p.seed);
    const across = horiz ? h : w; // dimension traversée par les bandes
    const along = horiz ? w : h;

    // bandes de lumière / ombre
    const g = horiz ? ctx.createLinearGradient(0, 0, 0, h) : ctx.createLinearGradient(0, 0, w, 0);
    const n = Math.max(1, Math.round(p.bands));
    for (let k = 0; k <= n * 2; k++) {
      const lightStop = k % 2 === 0;
      g.addColorStop(k / (n * 2), lightStop ? U.rgba('#ffffff', 0.42 * i) : U.rgba('#000000', 0.5 * i));
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // métal brossé : fines lignes aléatoires
    const lines = Math.round(across * (p.brush / 100) * 0.9);
    for (let k = 0; k < lines; k++) {
      const pos = Math.floor(rand() * across);
      const len = (0.3 + rand() * 0.7) * along;
      const start = rand() * (along - len);
      ctx.fillStyle = U.rgba(rand() > 0.5 ? '#ffffff' : '#000000', (0.04 + rand() * 0.12) * i);
      if (horiz) ctx.fillRect(start, pos, len, 1);
      else ctx.fillRect(pos, start, 1, len);
    }

    // arête brillante
    ctx.fillStyle = U.rgba('#ffffff', 0.35 * i);
    const edge = Math.round(across * 0.12);
    if (horiz) ctx.fillRect(0, edge, w, 1);
    else ctx.fillRect(edge, 0, 1, h);
  }

  function star(ctx, x, y, s, color, a, glow) {
    if (glow) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, s);
      g.addColorStop(0, U.rgba(color, a * 0.5));
      g.addColorStop(1, U.rgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - s, y - s, s * 2, s * 2);
    }
    const t = Math.max(0.6, s * 0.14);
    ctx.fillStyle = U.rgba(color, a);
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + t, y - t);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x + t, y + t);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - t, y + t);
    ctx.lineTo(x - s, y);
    ctx.lineTo(x - t, y - t);
    ctx.closePath();
    ctx.fill();
  }

  function scintillant(ctx, w, h, p) {
    const rand = U.rng(p.seed);
    const count = Math.max(1, Math.round(w * h * (p.density / 100) * 0.0025));
    for (let k = 0; k < count; k++) {
      const x = rand() * w;
      const y = rand() * h;
      const s = p.size * (0.35 + rand() * 0.65);
      const a = (p.intensity / 100) * (0.35 + rand() * 0.65);
      star(ctx, x, y, s, p.color, a, p.glow);
    }
  }

  /** Applique l'effet sur le contexte du calque (déjà dessiné). */
  E.apply = function (ctx, w, h, effect) {
    if (!effect || !effect.type || effect.type === 'none') return;
    const p = { ...E.DEFAULTS[effect.type], ...effect };
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    switch (p.type) {
      case 'reflet': reflet(ctx, w, h, p); break;
      case 'degrade-sombre': degrade(ctx, w, h, p, false); break;
      case 'degrade-clair': degrade(ctx, w, h, p, true); break;
      case 'metal': metal(ctx, w, h, p); break;
      case 'scintillant': scintillant(ctx, w, h, p); break;
      default: break;
    }
    ctx.restore();
  };

  A.render.effects = E;
})(window.Arius);
