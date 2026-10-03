/*
 * Assemblage des calques (du bas vers le haut) + ombres (outil 8).
 * Garde aussi la position / taille affichée de chaque calque (sélection, clic).
 */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const LR = A.render.layerRenderer;
  const bounds = new Map();

  const SHADOW_DIRECTIONS = {
    bas: [[0, 1]],
    haut: [[0, -1]],
    droite: [[1, 0]],
    gauche: [[-1, 0]],
    'haut-bas': [[0, 1], [0, -1]],
    'gauche-droite': [[1, 0], [-1, 0]],
    'bas-droite': [[Math.SQRT1_2, Math.SQRT1_2]],
    'bas-gauche': [[-Math.SQRT1_2, Math.SQRT1_2]],
    autour: [[0, 0]]
  };

  /** Dessine seulement l'ombre (l'image elle-même est envoyée hors champ). */
  function drawShadow(ctx, source, x, y, s, layerAlpha) {
    const FAR = 100000;
    (SHADOW_DIRECTIONS[s.direction] || SHADOW_DIRECTIONS.bas).forEach(([dx, dy]) => {
      ctx.save();
      ctx.globalAlpha = layerAlpha;
      ctx.shadowColor = U.rgba(s.color, s.opacity / 100);
      ctx.shadowBlur = Math.max(0, s.blur);
      ctx.shadowOffsetX = dx * s.distance + FAR;
      ctx.shadowOffsetY = dy * s.distance;
      ctx.drawImage(source, x - FAR, y);
      ctx.restore();
    });
  }

  function hasShadow(layer) {
    return !layer.isBase && layer.shadow && layer.shadow.enabled;
  }

  function drawLayer(ctx, layer, x, y) {
    const r = LR.render(layer);
    const alpha = U.clamp(layer.opacity / 100, 0, 1);
    if (hasShadow(layer)) drawShadow(ctx, r.canvas, x, y, layer.shadow, alpha);
    ctx.globalAlpha = alpha;
    ctx.drawImage(r.canvas, x, y);
    ctx.globalAlpha = 1;
    return r;
  }

  A.render.compositor = {
    SHADOW_DIRECTIONS,

    /** Dessine tout le document dans le canvas donné (à l'échelle 1). */
    renderDocument(canvas, state) {
      const W = state.width;
      const H = state.height;
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      const ids = new Set();
      state.layers.forEach((layer) => {
        ids.add(layer.id);
        if (!layer.visible) {
          bounds.delete(layer.id);
          return;
        }
        const x = Math.round(layer.x);
        const y = Math.round(layer.y);
        const r = drawLayer(ctx, layer, x, y);
        bounds.set(layer.id, { x, y, w: r.w, h: r.h });
      });
      LR.prune(ids);
    },

    /** Un calque seul (avec son ombre), recadré. */
    renderLayerAlone(layer) {
      const r = LR.render(layer);
      let pad = 0;
      if (hasShadow(layer)) pad = Math.ceil(layer.shadow.blur * 2 + layer.shadow.distance + 2);
      const canvas = U.createCanvas(r.w + pad * 2, r.h + pad * 2);
      drawLayer(canvas.getContext('2d'), layer, pad, pad);
      return canvas;
    },

    bounds: (id) => bounds.get(id) || null,

    /** Calque visible le plus haut sous le point (pixels non transparents uniquement). */
    hitTest(state, px, py) {
      for (let i = state.layers.length - 1; i >= 0; i--) {
        const layer = state.layers[i];
        const b = bounds.get(layer.id);
        if (!layer.visible || !b) continue;
        if (px < b.x || py < b.y || px >= b.x + b.w || py >= b.y + b.h) continue;
        const r = LR.render(layer);
        const a = r.canvas.getContext('2d').getImageData(Math.floor(px - b.x), Math.floor(py - b.y), 1, 1).data[3];
        if (a > 8) return layer;
      }
      return null;
    }
  };
})(window.Arius);
