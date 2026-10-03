/* Utilitaires partagés : couleurs hexadécimales, nombres, DOM, aléatoire reproductible. */
(function (A) {
  'use strict';

  const U = {};

  U.uid = () => 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  U.clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  U.clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));

  U.toNumber = (v, fallback = 0) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : fallback;
  };

  /* Couleurs ------------------------------------------------------------ */

  /** Accepte "fff", "#fff", "ffffff", "#FFFFFF" -> "#ffffff" (ou null si invalide). */
  U.normalizeHex = function (value) {
    if (typeof value !== 'string') return null;
    let s = value.trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(s)) return null;
    return '#' + s.toLowerCase();
  };

  U.hexToRgb = function (hex) {
    const h = U.normalizeHex(hex) || '#000000';
    const n = parseInt(h.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };

  U.rgba = (hex, alpha = 1) => {
    const { r, g, b } = U.hexToRgb(hex);
    return `rgba(${r},${g},${b},${U.clamp(alpha, 0, 1)})`;
  };

  /* Aléatoire reproductible (même graine = même résultat) ---------------- */
  U.rng = function (seed) {
    let a = (Math.round(seed) >>> 0) || 1;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  U.debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  U.createCanvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  };

  /* DOM ----------------------------------------------------------------- */
  U.el = function (tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (v === true) node.setAttribute(k, '');
        else node.setAttribute(k, v);
      }
    }
    children.flat(Infinity).forEach((c) => {
      if (c == null || c === false) return;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    });
    return node;
  };

  U.isTyping = (target) => {
    if (!target) return false;
    const tag = target.tagName;
    // cases à cocher et nuanciers : on ne tape pas de texte dedans
    if (tag === 'INPUT' && ['checkbox', 'radio', 'color', 'button'].includes(target.type)) return false;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  };

  U.readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });

  A.core.utils = U;
})(window.Arius);
