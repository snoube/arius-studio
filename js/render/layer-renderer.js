/*
 * Dessin d'un calque seul, dans son propre canvas (taille du calque).
 * Ordre : contenu -> effet (outil 4) -> motif (outil 5) -> bordure (outil 2).
 * Le résultat est mis en cache tant que le calque ne change pas (déplacer un calque ne le redessine pas).
 */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const G = A.render.geometry;
  const cache = new Map();
  const images = new Map();

  function contentKey(layer) {
    // eslint-disable-next-line no-unused-vars
    const { x, y, name, visible, locked, opacity, shadow, ...rest } = layer;
    if (rest.src) rest.src = rest.src.length + ':' + rest.src.slice(-80);
    return JSON.stringify(rest);
  }

  function getImage(src) {
    if (!src) return null;
    let entry = images.get(src);
    if (!entry) {
      const img = new Image();
      entry = { img, ready: false };
      images.set(src, entry);
      img.onload = () => {
        entry.ready = true;
        A.core.events.emit('render:image-ready');
      };
      img.src = src;
    }
    return entry.ready ? entry.img : null;
  }

  function surface(ctx, layer, w, h) {
    A.render.effects.apply(ctx, w, h, layer.effect);
    A.render.patterns.apply(ctx, w, h, layer.pattern);
  }

  function drawBorder(ctx, layer, path, w, h) {
    const b = layer.border;
    if (!b || !b.enabled || !(b.width > 0)) return;
    const ring = G.ring(path, w, h, Math.max(0, b.inset || 0), b.width);
    G.tint(ring, b.color, (b.opacity ?? 100) / 100);
    ctx.drawImage(ring, 0, 0);
  }

  function drawElement(ctx, layer, path, w, h) {
    const s = layer.stroke;
    if (layer.kind === 'line' || layer.kind === 'point') {
      ctx.fillStyle = U.rgba(s.color, s.opacity / 100);
      ctx.fill(path);
      return;
    }
    if (layer.fill && layer.fill.enabled) {
      ctx.fillStyle = U.rgba(layer.fill.color, layer.fill.opacity / 100);
      ctx.fill(path);
    }
    if (s.width > 0) {
      const ring = G.ring(path, w, h, 0, s.width);
      G.tint(ring, s.color, s.opacity / 100);
      ctx.drawImage(ring, 0, 0);
    }
  }

  function buildShape(layer) {
    const w = Math.max(1, Math.round(layer.w));
    const h = Math.max(1, Math.round(layer.h));
    const canvas = U.createCanvas(w, h);
    const ctx = canvas.getContext('2d');
    const path = G.layerPath(layer, w, h);
    let pending = false;

    if (layer.type === 'box') {
      ctx.fillStyle = U.rgba(layer.fill.color, layer.fill.opacity / 100);
      ctx.fill(path);
    } else if (layer.type === 'element') {
      drawElement(ctx, layer, path, w, h);
    } else if (layer.type === 'image') {
      const img = getImage(layer.src);
      if (img) {
        ctx.save();
        ctx.clip(path);
        ctx.imageSmoothingEnabled = !layer.pixelated;
        ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();
      } else pending = true;
    }

    surface(ctx, layer, w, h);
    drawBorder(ctx, layer, path, w, h);
    return { canvas, w, h, pending };
  }

  function buildText(layer) {
    const f = { ...A.core.state.DEFAULT_FONT, ...layer.font };
    const css = A.fonts.cssFont(f);
    const pending = !A.fonts.isReady(css);
    if (pending) A.fonts.ensure(css);

    const lines = String(layer.text ?? '').split('\n');
    const probe = U.createCanvas(1, 1).getContext('2d');
    probe.font = css;
    if ('letterSpacing' in probe) probe.letterSpacing = (f.spacing || 0) + 'px';
    const lineH = f.size * (f.lineHeight || 1.2);
    const widths = lines.map((l) => probe.measureText(l).width);
    const pad = Math.ceil((f.outlineWidth || 0) + f.size * 0.2);
    const w = Math.max(1, Math.ceil(Math.max(...widths, 1)) + pad * 2);
    const h = Math.max(1, Math.ceil(lineH * lines.length) + pad * 2);

    const canvas = U.createCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.font = css;
    if ('letterSpacing' in ctx) ctx.letterSpacing = (f.spacing || 0) + 'px';
    ctx.textBaseline = 'middle';
    ctx.textAlign = f.align === 'center' ? 'center' : f.align === 'right' ? 'right' : 'left';
    const tx = f.align === 'center' ? w / 2 : f.align === 'right' ? w - pad : pad;

    lines.forEach((line, i) => {
      const ty = pad + lineH * (i + 0.5);
      if (f.outlineWidth > 0) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = f.outlineWidth * 2;
        ctx.strokeStyle = U.rgba(f.outlineColor, f.opacity / 100);
        ctx.strokeText(line, tx, ty);
      }
      ctx.fillStyle = U.rgba(f.color, f.opacity / 100);
      ctx.fillText(line, tx, ty);
    });

    if (f.pixel) {
      // rendu net : chaque pixel est soit plein soit vide
      const data = ctx.getImageData(0, 0, w, h);
      const d = data.data;
      const target = Math.round(255 * (f.opacity / 100));
      const cut = Math.max(1, target * 0.45);
      for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= cut ? target : 0;
      ctx.putImageData(data, 0, 0);
    }

    surface(ctx, layer, w, h);
    return { canvas, w, h, pending };
  }

  A.render.layerRenderer = {
    render(layer) {
      const key = contentKey(layer);
      const hit = cache.get(layer.id);
      if (hit && hit.key === key) return hit.result;
      const result = layer.type === 'text' ? buildText(layer) : buildShape(layer);
      if (!result.pending) cache.set(layer.id, { key, result });
      return result;
    },
    clear() {
      cache.clear();
    },
    prune(ids) {
      [...cache.keys()].forEach((id) => {
        if (!ids.has(id)) cache.delete(id);
      });
    }
  };
})(window.Arius);
