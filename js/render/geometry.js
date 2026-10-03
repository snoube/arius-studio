/*
 * Géométrie des formes.
 *
 * Un angle est décrit dans le repère du coin haut-gauche : une ligne qui part d'un point
 * du bord gauche (0, b) et arrive sur le bord haut (a, 0). Tout ce qui est "au-dessus"
 * de cette ligne est découpé (reste transparent). Le même angle est ensuite retourné
 * en miroir pour les trois autres coins.
 *
 * Les bordures sont calculées à partir du contour réel : elles suivent donc les angles.
 */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const G = {};

  G.CORNER_TYPES = [
    { value: 'none', label: 'Carré (aucun)' },
    { value: 'notch', label: 'Encoche carrée' },
    { value: 'chamfer', label: 'Biseau' },
    { value: 'round', label: 'Arrondi' },
    { value: 'scoop', label: 'Arrondi inversé' },
    { value: 'steps', label: 'Escalier' },
    { value: 'pixel', label: 'Profil pixel (chiffres)' }
  ];

  G.CORNER_KEYS = ['tl', 'tr', 'br', 'bl'];
  G.CORNER_LABELS = { tl: 'Haut gauche', tr: 'Haut droite', br: 'Bas droite', bl: 'Bas gauche' };

  /** Points d'un angle dans le repère haut-gauche, de (0, b) vers (a, 0). */
  G.cornerPoints = function (def) {
    if (!def || def.type === 'none') return [[0, 0]];
    const w = Math.max(0, +def.w || 0);
    const h = Math.max(0, +def.h || 0);
    const arc = (fn) => {
      const n = Math.max(8, Math.ceil(Math.max(w, h) / 1.5));
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push(fn((Math.PI / 2) * (i / n)));
      return pts;
    };

    switch (def.type) {
      case 'notch':
        return [[0, h], [w, h], [w, 0]];
      case 'chamfer':
        return [[0, h], [w, 0]];
      case 'round': // quart d'ellipse convexe
        return arc((t) => [w - w * Math.cos(t), h - h * Math.sin(t)]);
      case 'scoop': // quart d'ellipse creusé vers l'intérieur
        return arc((t) => [w * Math.sin(t), h * Math.cos(t)]);
      case 'steps': {
        const n = Math.max(1, Math.round(def.steps || 3));
        const pts = [[0, h]];
        for (let i = 1; i <= n; i++) {
          pts.push([(i * w) / n, h - ((i - 1) * h) / n], [(i * w) / n, h - (i * h) / n]);
        }
        return pts;
      }
      case 'pixel': {
        // profil[i] = nombre de pixels coupés sur la ligne i (ligne 0 = tout en haut)
        const prof = (def.profile || []).map((v) => Math.max(0, Math.round(+v || 0)));
        const s = Math.max(1, Math.round(+def.scale || 1));
        const k = prof.length;
        if (!k) return [[0, 0]];
        const pts = [[0, k * s]];
        for (let i = k - 1; i >= 0; i--) {
          const x = prof[i] * s;
          pts.push([x, (i + 1) * s], [x, i * s]);
        }
        return pts;
      }
      default:
        return [[0, 0]];
    }
  };

  /** Empêche un angle de dépasser la moitié de la forme. */
  function fitCorner(pts, w, h) {
    let mx = 0;
    let my = 0;
    pts.forEach(([x, y]) => {
      mx = Math.max(mx, x);
      my = Math.max(my, y);
    });
    let f = 1;
    if (mx > w / 2) f = Math.min(f, w / 2 / mx);
    if (my > h / 2) f = Math.min(f, h / 2 / my);
    return f === 1 ? pts : pts.map(([x, y]) => [x * f, y * f]);
  }

  function dedupe(points) {
    const out = [];
    points.forEach((p) => {
      const last = out[out.length - 1];
      if (!last || Math.abs(last[0] - p[0]) > 1e-6 || Math.abs(last[1] - p[1]) > 1e-6) out.push(p);
    });
    if (out.length > 1) {
      const a = out[0];
      const b = out[out.length - 1];
      if (Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6) out.pop();
    }
    return out;
  }

  /** Contour d'un rectangle w×h avec ses 4 angles (sens horaire). */
  G.rectPoints = function (w, h, corners) {
    const c = corners || {};
    const maps = {
      tl: (x, y) => [x, y],
      tr: (x, y) => [w - x, y],
      br: (x, y) => [w - x, h - y],
      bl: (x, y) => [x, h - y]
    };
    const out = [];
    const add = (key, reverse) => {
      let pts = fitCorner(G.cornerPoints(c[key]), w, h);
      if (reverse) pts = pts.slice().reverse();
      pts.forEach(([x, y]) => out.push(maps[key](x, y)));
    };
    add('tl', false);
    add('tr', true);
    add('br', false);
    add('bl', true);
    return dedupe(out);
  };

  G.ellipsePoints = function (w, h) {
    const n = Math.max(32, Math.ceil((Math.PI * (w + h)) / 3));
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      pts.push([w / 2 + (w / 2) * Math.cos(t), h / 2 + (h / 2) * Math.sin(t)]);
    }
    return pts;
  };

  G.layerPoints = function (layer, w, h) {
    if (layer.type === 'element') {
      switch (layer.kind) {
        case 'ellipse':
        case 'point':
          return G.ellipsePoints(w, h);
        case 'triangle':
          return [[w / 2, 0], [w, h], [0, h]];
        case 'losange':
          return [[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]];
        default:
          return G.rectPoints(w, h, layer.corners);
      }
    }
    return G.rectPoints(w, h, layer.corners);
  };

  G.pathFromPoints = function (points) {
    const p = new Path2D();
    points.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
    p.closePath();
    return p;
  };

  G.layerPath = (layer, w, h) => G.pathFromPoints(G.layerPoints(layer, w, h));

  /** Forme pleine, rétrécie de "inset" pixels vers l'intérieur (décalage parallèle au contour). */
  G.mask = function (path, w, h, inset) {
    const c = U.createCanvas(w, h);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fill(path);
    if (inset > 0) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = inset * 2;
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 10;
      ctx.stroke(path);
    }
    return c;
  };

  /** Anneau intérieur : de "inset" à "inset + width" pixels du bord. */
  G.ring = function (path, w, h, inset, width) {
    const outer = G.mask(path, w, h, inset);
    if (width > 0) {
      const inner = G.mask(path, w, h, inset + width);
      const ctx = outer.getContext('2d');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(inner, 0, 0);
    }
    return outer;
  };

  /** Colore une forme (garde la transparence). */
  G.tint = function (canvas, color, alpha) {
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = U.rgba(color, alpha);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    return canvas;
  };

  A.render.geometry = G;
})(window.Arius);
