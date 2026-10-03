/* Icônes (SVG en ligne, trait = couleur du texte). */
(function (A) {
  'use strict';

  const P = {
    // outils
    background: '<rect x="4" y="5" width="16" height="14"/><path d="M4 15l4-4 4 4 3-3 5 5"/>',
    border: '<rect x="4" y="4" width="16" height="16"/><rect x="8" y="8" width="8" height="8" stroke-dasharray="2 2"/>',
    corners: '<path d="M4 20V9h3V6h3V4h10"/><path d="M14 20h6v-6"/>',
    effects: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M12 8l1.5 2.5L16 12l-2.5 1.5L12 16l-1.5-2.5L8 12l2.5-1.5z"/>',
    patterns: '<rect x="4" y="4" width="16" height="16"/><path d="M4 9l5-5M4 15L15 4M4 20L20 4M10 20l10-10M16 20l4-4"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    elements: '<circle cx="8" cy="8" r="4"/><rect x="13" y="13" width="7" height="7"/><path d="M4 20l6-6"/>',
    shadow: '<rect x="4" y="4" width="11" height="11"/><path d="M15 8h5v12H8v-5" opacity=".55"/>',
    // catégories
    image: '<rect x="3" y="4" width="18" height="16"/><circle cx="9" cy="10" r="2"/><path d="M3 18l6-5 4 3 3-2 5 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    // actions
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.9 8.3 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    copy: '<rect x="8" y="8" width="12" height="12"/><path d="M16 8V4H4v12h4"/>',
    paste: '<rect x="5" y="5" width="14" height="16"/><path d="M9 3h6v4H9zM9 12h6M9 16h4"/>',
    duplicate: '<rect x="4" y="4" width="11" height="11"/><rect x="9" y="9" width="11" height="11"/><path d="M14.5 12v5M12 14.5h5"/>',
    trash: '<path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    undo: '<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-3"/>',
    redo: '<path d="M15 7l5 5-5 5"/><path d="M20 12H9a5 5 0 0 0 0 10h3"/>',
    zoomIn: '<circle cx="10" cy="10" r="6"/><path d="M20 20l-5.5-5.5M10 7v6M7 10h6"/>',
    zoomOut: '<circle cx="10" cy="10" r="6"/><path d="M20 20l-5.5-5.5M7 10h6"/>',
    fit: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    export: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 14v6h16v-6"/>',
    open: '<path d="M3 6h7l2 2h9v11H3z"/>',
    save: '<path d="M4 4h13l3 3v13H4z"/><path d="M8 4v5h8V4M7 20v-6h10v6"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
    lock: '<rect x="5" y="11" width="14" height="10"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><rect x="14" y="4" width="4" height="4"/><rect x="8" y="10" width="4" height="4"/><rect x="16" y="16" width="4" height="4"/>',
    // éléments
    line: '<path d="M4 12h16"/>',
    rect: '<rect x="4" y="6" width="16" height="12"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8" ry="6"/>',
    point: '<circle cx="12" cy="12" r="3" fill="currentColor"/>',
    triangle: '<path d="M12 5l8 14H4z"/>',
    losange: '<path d="M12 3l8 9-8 9-8-9z"/>',
    // téléphone
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.9l7.6-3.8M8.2 13.1l7.6 3.8"/>',
    expand: '<path d="M6 14l6-6 6 6"/>',
    collapse: '<path d="M6 10l6 6 6-6"/>'
  };

  A.ui.icon = function (name, size = 18) {
    const body = P[name] || P.plus;
    return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${body}</svg>`;
  };
})(window.Arius);
