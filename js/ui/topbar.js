/* Barre du haut : nom du projet, fichiers, annuler / rétablir, zoom, export. */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const { state, events, history } = A.core;

  function btn(icon, label, onClick, { text, primary, id, cls } = {}) {
    const b = U.el('button', {
      type: 'button', id, title: label, 'aria-label': label,
      class: (text ? 'btn' : 'icon-btn') + ' framed notch' + (primary ? ' btn-primary' : '') + (cls ? ' ' + cls : ''),
      html: A.ui.icon(icon, 16) + (text ? `<span>${text}</span>` : '')
    });
    b.addEventListener('click', onClick);
    return b;
  }

  function menu() {
    const P = A.ui.project;
    const items = [
      ['file', 'Nouveau projet', P.newProject],
      ['open', 'Ouvrir un projet… (Ctrl+O)', P.openProject],
      ['save', 'Enregistrer le projet (Ctrl+S)', P.saveProject],
      null,
      ['upload', 'Importer des préréglages…', P.importPresets],
      ['export', 'Exporter mes préréglages', P.exportPresets]
    ];
    const list = U.el('div', { class: 'menu framed notch', role: 'menu', hidden: true });
    items.forEach((it) => {
      if (!it) return list.append(U.el('hr', { class: 'menu-sep' }));
      const b = U.el('button', { type: 'button', class: 'menu-item', role: 'menuitem', html: A.ui.icon(it[0], 16) + `<span>${it[1].replace(/ \((Ctrl\+.)\)/, ' <span class="kbd">($1)</span>')}</span>` });
      b.addEventListener('click', () => {
        list.hidden = true;
        it[2]();
      });
      list.append(b);
    });
    const toggle = btn('file', 'Fichier', (e) => {
      e.stopPropagation();
      list.hidden = !list.hidden;
      toggle.setAttribute('aria-expanded', String(!list.hidden));
    }, { text: 'Fichier' });
    toggle.setAttribute('aria-haspopup', 'menu');
    document.addEventListener('click', (e) => {
      if (!list.contains(e.target)) list.hidden = true;
    });
    return U.el('div', { class: 'menu-wrap' }, toggle, list);
  }

  A.ui.topbar = {
    init() {
      const bar = document.getElementById('topbar');
      const name = U.el('input', { class: 'project-name', type: 'text', 'aria-label': 'Nom du projet', spellcheck: 'false' });
      name.addEventListener('change', () => state.rename(name.value.trim()));
      name.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') name.blur();
      });

      const undo = btn('undo', 'Annuler (Ctrl+Z)', () => state.undo());
      const redo = btn('redo', 'Rétablir (Ctrl+Y)', () => state.redo());
      const zoomLabel = U.el('span', { class: 'zoom-label' }, '100 %');

      bar.append(
        U.el('div', { class: 'top-left' },
          U.el('span', { class: 'brand' }, 'Arius Studio'),
          U.el('span', { class: 'top-sep', 'aria-hidden': 'true' }),
          U.el('span', { class: 'top-context' }, 'Créateur d’image'),
          name),
        U.el('div', { class: 'top-center' }, menu(), undo, redo),
        U.el('div', { class: 'top-right' },
          U.el('div', { class: 'zoom-group' },
            btn('zoomOut', 'Dézoomer (-)', () => A.ui.stage.zoomOut(), { cls: 'zoom-step' }),
            zoomLabel,
            btn('zoomIn', 'Zoomer (+)', () => A.ui.stage.zoomIn(), { cls: 'zoom-step' }),
            btn('fit', 'Ajuster à l’écran (0)', () => A.ui.stage.fit())),
          btn('export', 'Exporter l’image (Ctrl+E)', () => A.ui.exporter.open(), { text: 'Exporter', primary: true })));

      const sync = () => {
        undo.disabled = !history.canUndo();
        redo.disabled = !history.canRedo();
      };
      events.on('history:changed', sync);
      events.on('zoom:changed', (z) => {
        zoomLabel.textContent = Math.round(z * 100) + ' %';
      });
      const syncName = () => {
        if (document.activeElement !== name) name.value = state.doc.name;
      };
      events.on('doc:replaced', syncName);
      syncName();
      sync();
    }
  };
})(window.Arius);
