/*
 * Zone de travail : affiche l'image, le zoom, la sélection et permet de déplacer les calques à la souris.
 * Les pixels transparents laissent voir le damier : ils resteront vides à l'export PNG / WebP.
 *
 * Au doigt (téléphone, tablette) :
 *  - un doigt sur un calque : le déplacer
 *  - un doigt sur le fond principal, un calque verrouillé ou hors de l'image : se déplacer dans la zone
 *  - deux doigts : pincer pour zoomer, glisser pour se déplacer
 */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const { state, events } = A.core;
  const C = A.render.compositor;

  const ZOOMS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 12, 16];
  let zoom = 1;
  let els = {};
  let frameQueued = false;
  let lastSize = '';
  let drag = null;
  let pan = null;
  let spaceDown = false;
  let fitted = true;             // le zoom vient-il de « Ajuster à l'écran » ?
  const touches = new Map();     // doigts posés : id -> position
  let pinch = null;
  let waitAllUp = false;         // après un pincement, on attend que tous les doigts soient levés

  function requestRender() {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(() => {
      frameQueued = false;
      C.renderDocument(els.canvas, state);
      const size = state.width + 'x' + state.height;
      if (size !== lastSize) {
        lastSize = size;
        applyZoom();
      }
      updateSelection();
      updateHud();
      events.emit('render:done');
    });
  }

  function applyZoom() {
    els.canvas.style.width = state.width * zoom + 'px';
    els.canvas.style.height = state.height * zoom + 'px';
    els.frame.classList.toggle('is-pixelated', zoom >= 1);
    updateSelection();
    updateHud();
    events.emit('zoom:changed', zoom);
  }

  function setZoom(z, anchor) {
    const scroll = els.scroll;
    const before = zoom;
    zoom = U.clamp(z, 0.05, 32);
    let rel = null;
    if (anchor) {
      const r = els.canvas.getBoundingClientRect();
      rel = { x: (anchor.x - r.left) / before, y: (anchor.y - r.top) / before, cx: anchor.x, cy: anchor.y };
    }
    applyZoom();
    if (rel) {
      const r = els.canvas.getBoundingClientRect();
      scroll.scrollLeft += r.left + rel.x * zoom - rel.cx;
      scroll.scrollTop += r.top + rel.y * zoom - rel.cy;
    }
  }

  function fit() {
    // marge plus petite sur les petits écrans
    const m = Math.min(140, Math.round(Math.min(els.scroll.clientWidth, els.scroll.clientHeight) * 0.16));
    const W = Math.max(20, els.scroll.clientWidth - m);
    const H = Math.max(20, els.scroll.clientHeight - m);
    let z = Math.min(W / state.width, H / state.height);
    if (z >= 1) z = Math.min(16, Math.floor(z));
    else z = Math.max(0.05, Math.floor(z * 20) / 20);
    setZoom(z);
    fitted = true;
    requestAnimationFrame(() => {
      const s = els.scroll;
      s.scrollLeft = (s.scrollWidth - s.clientWidth) / 2;
      s.scrollTop = (s.scrollHeight - s.clientHeight) / 2;
    });
  }

  function step(dir) {
    const next = dir > 0 ? ZOOMS.find((z) => z > zoom + 1e-6) : [...ZOOMS].reverse().find((z) => z < zoom - 1e-6);
    if (next) {
      fitted = false;
      setZoom(next);
    }
  }

  function updateSelection() {
    const box = els.selection;
    const layer = state.selected();
    const b = layer && C.bounds(layer.id);
    if (!b) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.style.left = b.x * zoom + 'px';
    box.style.top = b.y * zoom + 'px';
    box.style.width = b.w * zoom + 'px';
    box.style.height = b.h * zoom + 'px';
    box.classList.toggle('is-locked', !!layer.locked);
    els.selLabel.textContent = `${b.w} × ${b.h}`;
  }

  function updateHud() {
    els.hudSize.textContent = `${state.width} × ${state.height} px`;
    els.hudZoom.textContent = Math.round(zoom * 100) + ' %';
  }

  function toDoc(e) {
    const r = els.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom };
  }

  function startPan(e) {
    pan = { x: e.clientX, y: e.clientY, sl: els.scroll.scrollLeft, st: els.scroll.scrollTop };
    try {
      els.scroll.setPointerCapture(e.pointerId);
    } catch (err) { /* pointeur déjà relâché */ }
    els.scroll.classList.add('is-panning');
    e.preventDefault();
  }

  const fingers = () => [...touches.values()];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) || 1;
  const middle = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  function startPinch() {
    if (pan) pan.tapSelect = null;
    // un deuxième doigt annule le déplacement de calque en cours
    if (drag) {
      if (drag.moved) {
        const d = drag;
        state.mutate(d.id, (l) => {
          l.x = d.ox;
          l.y = d.oy;
        }, { source: 'drag', commit: false });
      }
      drag = null;
    }
    if (pan) {
      pan = null;
      els.scroll.classList.remove('is-panning');
    }
    const [a, b] = fingers();
    pinch = { dist: distance(a, b), mid: middle(a, b), zoom };
    waitAllUp = true;
  }

  function movePinch() {
    const [a, b] = fingers();
    const mid = middle(a, b);
    els.scroll.scrollLeft -= mid.x - pinch.mid.x;
    els.scroll.scrollTop -= mid.y - pinch.mid.y;
    pinch.mid = mid;
    fitted = false;
    setZoom(pinch.zoom * distance(a, b) / pinch.dist, mid);
  }

  function onPointerDown(e) {
    const touch = e.pointerType === 'touch';
    if (touch) {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size >= 2) {
        if (!pinch) startPinch();
        e.preventDefault();
        return;
      }
      if (waitAllUp) return;
    }
    if (e.button === 1 || (e.button === 0 && spaceDown)) return startPan(e);
    if (e.button !== 0) return;
    const p = toDoc(e);
    const inside = p.x >= 0 && p.y >= 0 && p.x < state.width && p.y < state.height;
    const current = state.selected();
    const cb = current && C.bounds(current.id);
    // garder la sélection actuelle si on clique dans son cadre (plus simple pour déplacer un texte)
    let layer = cb && p.x >= cb.x && p.y >= cb.y && p.x < cb.x + cb.w && p.y < cb.y + cb.h ? current : C.hitTest(state, p.x, p.y);
    if (!layer && inside) layer = state.base();
    if (!layer) {
      if (touch) startPan(e);
      return;
    }
    // Au doigt, le fond principal n'est choisi que sur un toucher bref (pas pendant un pincement ou un défilement).
    if (touch && layer.isBase) {
      startPan(e);
      pan.tapSelect = layer.id;
      return;
    }
    state.select(layer.id);
    if (layer.isBase || layer.locked) {
      if (touch) startPan(e);
      return;
    }
    drag = { id: layer.id, start: p, ox: layer.x, oy: layer.y, moved: false };
    els.frame.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch) {
      if (touches.size >= 2) movePinch();
      return;
    }
    if (pan) {
      els.scroll.scrollLeft = pan.sl - (e.clientX - pan.x);
      els.scroll.scrollTop = pan.st - (e.clientY - pan.y);
      return;
    }
    const p = toDoc(e);
    if (p.x >= 0 && p.y >= 0 && p.x < state.width && p.y < state.height) {
      els.hudPos.textContent = `x ${Math.floor(p.x)}  y ${Math.floor(p.y)}`;
    } else els.hudPos.textContent = '';
    if (!drag) return;
    const nx = Math.round(drag.ox + p.x - drag.start.x);
    const ny = Math.round(drag.oy + p.y - drag.start.y);
    const layer = state.get(drag.id);
    if (!layer || (layer.x === nx && layer.y === ny)) return;
    drag.moved = true;
    state.mutate(drag.id, (l) => {
      l.x = nx;
      l.y = ny;
    }, { source: 'drag', commit: false });
  }

  function onPointerUp(e) {
    if (e && touches.has(e.pointerId)) {
      touches.delete(e.pointerId);
      if (touches.size < 2) pinch = null;
      if (touches.size === 0) waitAllUp = false;
    }
    if (pan) {
      if (pan.tapSelect && e && Math.hypot(e.clientX - pan.x, e.clientY - pan.y) < 8) state.select(pan.tapSelect);
      pan = null;
      els.scroll.classList.remove('is-panning');
    }
    if (drag) {
      if (drag.moved) state.commitNow();
      drag = null;
    }
  }

  A.ui.stage = {
    init() {
      const root = document.getElementById('stage');
      els.canvas = U.el('canvas', { class: 'doc-canvas', 'aria-label': 'Image en cours de création' });
      els.selLabel = U.el('span', { class: 'sel-label' });
      els.selection = U.el('div', { class: 'selection-box', hidden: true }, els.selLabel);
      els.frame = U.el('div', { class: 'canvas-frame' },
        els.canvas, els.selection,
        U.el('span', { class: 'tick tick-tl', 'aria-hidden': 'true' }), U.el('span', { class: 'tick tick-tr', 'aria-hidden': 'true' }),
        U.el('span', { class: 'tick tick-bl', 'aria-hidden': 'true' }), U.el('span', { class: 'tick tick-br', 'aria-hidden': 'true' }));
      els.scroll = U.el('div', { class: 'stage-scroll' }, U.el('div', { class: 'stage-pad' }, els.frame));
      els.hudSize = U.el('span', { class: 'hud-chip' });
      els.hudZoom = U.el('span', { class: 'hud-chip' });
      els.hudPos = U.el('span', { class: 'hud-chip hud-pos' });
      root.append(els.scroll, U.el('div', { class: 'stage-hud' }, els.hudSize, els.hudZoom, els.hudPos));

      els.frame.addEventListener('pointerdown', onPointerDown);
      els.scroll.addEventListener('pointerdown', (e) => {
        if (e.target === els.scroll || e.target.classList.contains('stage-pad')) onPointerDown(e);
      });
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      // pas de menu « enregistrer l'image » sur appui long
      els.scroll.addEventListener('contextmenu', (e) => e.preventDefault());
      els.scroll.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        fitted = false;
        setZoom(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), { x: e.clientX, y: e.clientY });
      }, { passive: false });
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !U.isTyping(e.target)) {
          spaceDown = true;
          els.scroll.classList.add('can-pan');
          e.preventDefault();
        }
      });
      window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
          spaceDown = false;
          els.scroll.classList.remove('can-pan');
        }
      });

      ['doc:changed', 'render:image-ready'].forEach((n) => events.on(n, requestRender));
      events.on('render:fonts-ready', () => {
        A.render.layerRenderer.clear();
        requestRender();
      });
      events.on('selection:changed', updateSelection);
      events.on('doc:replaced', () => {
        lastSize = '';
        requestRender();
        requestAnimationFrame(fit);
      });
      window.addEventListener('resize', U.debounce(updateSelection, 100));
      requestRender();
    },
    requestRender,
    fit,
    zoomIn: () => step(1),
    zoomOut: () => step(-1),
    actualSize: () => {
      fitted = false;
      setZoom(1);
    },
    get zoom() { return zoom; },
    /** Vrai tant que l'utilisateur n'a pas zoomé lui-même depuis le dernier « Ajuster ». */
    get isFitted() { return fitted; }
  };
})(window.Arius);
