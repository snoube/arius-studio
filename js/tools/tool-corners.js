/*
 * Outil 3 : créateur d'angles.
 * On fabrique un angle (encoche, biseau, arrondi, escalier, profil pixel...), on l'enregistre
 * en préréglage, puis on l'applique sur un ou plusieurs coins du calque sélectionné.
 * Ce qui est découpé reste transparent (vide).
 */
(function (A) {
  'use strict';

  const { state, utils: U } = A.core;
  const G = A.render.geometry;
  const K = A.tools.kit;

  const GRID = 10;

  // angle en cours de fabrication (gardé entre deux ouvertures du panneau)
  const editor = { type: 'notch', w: 6, h: 6, steps: 3, profile: [3, 1, 1], scale: 2 };
  const target = { all: true, keys: new Set(['tl']) };

  const SCHEMA = [
    { key: 'type', label: 'Type d’angle', type: 'select', options: G.CORNER_TYPES },
    { key: 'w', label: 'Largeur de l’angle', type: 'number', unit: 'px', min: 0, max: 1024, show: (v) => !['none', 'pixel'].includes(v.type) },
    { key: 'h', label: 'Hauteur de l’angle', type: 'number', unit: 'px', min: 0, max: 1024, show: (v) => !['none', 'pixel'].includes(v.type) },
    { key: 'steps', label: 'Nombre de marches', type: 'number', min: 1, max: 64, show: (v) => v.type === 'steps' },
    { key: 'scale', label: 'Taille d’un pixel', type: 'number', unit: 'px', min: 1, max: 64, show: (v) => v.type === 'pixel' }
  ];

  const trimProfile = (p) => {
    const out = p.slice(0, GRID).map((v) => U.clamp(Math.round(+v || 0), 0, 64));
    while (out.length && out[out.length - 1] === 0) out.pop();
    return out;
  };

  function describe(def) {
    if (!def || def.type === 'none') return 'Carré';
    const label = (G.CORNER_TYPES.find((t) => t.value === def.type) || {}).label || def.type;
    if (def.type === 'pixel') return `${label} : ${(def.profile || []).join(', ')} (×${def.scale})`;
    if (def.type === 'steps') return `${label} ${def.w} × ${def.h}, ${def.steps} marches`;
    return `${label} ${def.w} × ${def.h}`;
  }

  /* Aperçu : une case avec cet angle sur les 4 coins + une bordure claire. */
  function drawPreview(canvas) {
    const pts = G.cornerPoints(editor);
    const ext = Math.max(4, ...pts.map((p) => Math.max(p[0], p[1])));
    const w = Math.round(ext * 6 + 16);
    const h = Math.round(ext * 3.6 + 12);
    const path = G.pathFromPoints(G.rectPoints(w, h, { tl: editor, tr: editor, br: editor, bl: editor }));
    const shape = U.createCanvas(w, h);
    const sctx = shape.getContext('2d');
    sctx.fillStyle = '#5b3fd1';
    sctx.fill(path);
    const ring = G.tint(G.ring(path, w, h, 0, Math.max(1, Math.round(ext / 6))), '#f4eef4', 1);
    sctx.drawImage(ring, 0, 0);

    const scale = Math.max(1, Math.floor(Math.min((canvas.width - 16) / w, (canvas.height - 16) / h)));
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(shape, Math.round((canvas.width - w * scale) / 2), Math.round((canvas.height - h * scale) / 2), w * scale, h * scale);
  }

  /* Grille cliquable pour le profil pixel : chaque ligne = nombre de pixels coupés. */
  function pixelEditor(onChange) {
    const grid = U.el('div', { class: 'pixel-grid', role: 'grid', 'aria-label': 'Profil de l’angle, pixel par pixel' });
    const text = U.el('input', { class: 'input', type: 'text', spellcheck: 'false', value: editor.profile.join(', '), id: 'corner-profile' });

    function paint() {
      grid.innerHTML = '';
      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          const cut = c < (editor.profile[r] || 0);
          const cell = U.el('button', { type: 'button', class: 'pixel-cell' + (cut ? ' is-cut' : ''), 'aria-label': `Ligne ${r + 1}, colonne ${c + 1}${cut ? ' (coupé)' : ''}` });
          cell.addEventListener('click', () => {
            const prof = editor.profile.slice();
            while (prof.length <= r) prof.push(0);
            prof[r] = prof[r] === c + 1 ? c : c + 1;
            editor.profile = trimProfile(prof);
            text.value = editor.profile.join(', ');
            paint();
            onChange();
          });
          grid.append(cell);
        }
      }
    }
    text.addEventListener('input', () => {
      const nums = text.value.split(/[\s,;]+/).filter(Boolean).map(Number);
      if (nums.some((n) => !Number.isFinite(n))) return text.classList.add('invalid');
      text.classList.remove('invalid');
      editor.profile = trimProfile(nums);
      paint();
      onChange();
    });
    paint();
    return U.el('div', { class: 'pixel-editor' },
      U.el('div', { class: 'field' }, U.el('label', { class: 'field-label', for: 'corner-profile' }, 'Profil (pixels coupés par ligne)'), text,
        U.el('small', { class: 'field-hint' }, 'De haut en bas. Exemple : 3, 1, 1 donne un petit arrondi pixel. Tu peux aussi cliquer dans la grille.')),
      grid);
  }

  function cornerPicker() {
    const keys = ['tl', 'tr', 'bl', 'br'];
    const wrap = U.el('div', { class: 'corner-picker', role: 'group', 'aria-label': 'Coins à modifier' });
    keys.forEach((k) => {
      const b = U.el('button', { type: 'button', class: `corner-pick corner-${k}` + (target.keys.has(k) ? ' is-on' : ''), 'aria-pressed': String(target.keys.has(k)) }, G.CORNER_LABELS[k]);
      b.addEventListener('click', () => {
        if (target.keys.has(k)) target.keys.delete(k);
        else target.keys.add(k);
        b.classList.toggle('is-on', target.keys.has(k));
        b.setAttribute('aria-pressed', String(target.keys.has(k)));
      });
      wrap.append(b);
    });
    return wrap;
  }

  A.tools.register({
    id: 'corners',
    label: 'Créateur d’angles',
    short: 'Angles',
    icon: 'corners',
    description: 'Fabrique des angles, garde-les en préréglage et applique-les aux coins du calque.',
    mount(body, remount) {
      const preview = U.el('canvas', { class: 'corner-preview', width: 268, height: 128, 'aria-label': 'Aperçu de l’angle' });
      const refresh = () => drawPreview(preview);

      const form = A.ui.fields.form(SCHEMA, editor, (key) => {
        if (key === 'type') return remount();
        refresh();
      });

      body.append(K.section('Forme de l’angle',
        form,
        editor.type === 'pixel' ? pixelEditor(refresh) : null,
        U.el('div', { class: 'preview-box' }, preview),
        A.ui.presetBar({
          category: 'corners',
          getData: () => U.clone(editor),
          onApply: (data) => {
            Object.assign(editor, data);
            remount();
          }
        })));
      refresh();

      const { layer, empty } = K.requireLayer(['box', 'element', 'image'], {
        message: 'Sélectionne un fond, un élément rectangle / ligne ou une image pour appliquer l’angle.'
      });
      if (empty) return body.append(K.section('Appliquer', empty));
      if (layer.type === 'element' && !['rect', 'line'].includes(layer.kind)) {
        return body.append(K.section('Appliquer', K.target(layer), K.note('Les angles s’appliquent aux éléments rectangle et ligne, pas aux ronds, points, triangles ou losanges.', 'empty')));
      }

      const picker = cornerPicker();
      picker.hidden = target.all;
      const allRow = A.ui.fields.form([{ key: 'all', label: 'Appliquer sur tous les angles', type: 'checkbox' }], target, () => {
        picker.hidden = target.all;
      });

      const setCorners = (def) => {
        const keys = target.all ? G.CORNER_KEYS : [...target.keys];
        if (!keys.length) return A.ui.toast('Choisis au moins un coin.', 'error');
        state.mutate(layer.id, (l) => {
          const c = l.corners ? { ...l.corners } : {};
          keys.forEach((k) => {
            c[k] = def && def.type !== 'none' ? U.clone(def) : null;
          });
          l.corners = G.CORNER_KEYS.some((k) => c[k]) ? c : null;
        });
        remount();
      };

      const current = U.el('ul', { class: 'corner-summary' },
        G.CORNER_KEYS.map((k) => U.el('li', null, U.el('span', null, G.CORNER_LABELS[k]), U.el('strong', null, describe(layer.corners && layer.corners[k])))));

      body.append(K.section('Appliquer',
        K.target(layer),
        allRow,
        picker,
        K.actions(
          K.button('Appliquer l’angle', { primary: true, onClick: () => setCorners(editor) }),
          K.button('Remettre en carré', { onClick: () => setCorners(null) })),
        current,
        K.note('La bordure (outil Bordure) suit automatiquement ces angles. Les parties découpées restent transparentes.')));
    }
  });
})(window.Arius);
