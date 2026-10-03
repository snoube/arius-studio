/* Propriétés du calque sélectionné : nom, position, taille, opacité, verrouillage. */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const { state, events } = A.core;
  let root;

  function render() {
    const layer = state.selected();
    root.innerHTML = '';
    root.append(U.el('header', { class: 'side-header' }, U.el('h2', { class: 'side-title' }, 'Propriétés')));
    if (!layer) {
      root.append(U.el('p', { class: 'tp-note tp-note-empty' }, 'Aucun calque sélectionné.'));
      return;
    }

    const values = {
      name: layer.name, x: layer.x, y: layer.y, w: layer.w, h: layer.h,
      opacity: layer.opacity, locked: !!layer.locked, pixelated: layer.pixelated !== false
    };
    const isPoint = layer.type === 'element' && layer.kind === 'point';
    const schema = [
      { key: 'name', label: 'Nom', type: 'text' },
      ...(layer.isBase ? [] : [
        { key: 'x', label: 'X', type: 'number', unit: 'px', min: -8192, max: 8192 },
        { key: 'y', label: 'Y', type: 'number', unit: 'px', min: -8192, max: 8192 }
      ]),
      ...(layer.type === 'text' ? [] : isPoint
        ? [{ key: 'w', label: 'Taille', type: 'number', unit: 'px', min: 1, max: 4096 }]
        : [
          { key: 'w', label: layer.isBase ? 'Largeur de l’image' : 'Largeur', type: 'number', unit: 'px', min: 1, max: 4096 },
          { key: 'h', label: layer.isBase ? 'Hauteur de l’image' : 'Hauteur', type: 'number', unit: 'px', min: 1, max: 4096 }
        ]),
      { key: 'opacity', label: 'Opacité du calque', type: 'range', unit: '%', min: 0, max: 100 },
      ...(layer.isBase ? [] : [{ key: 'locked', label: 'Verrouiller la position', type: 'checkbox' }]),
      ...(layer.type === 'image' ? [{ key: 'pixelated', label: 'Garder les pixels nets', type: 'checkbox' }] : [])
    ];

    const form = A.ui.fields.form(schema, values, (key, v) => {
      state.mutate(layer.id, (l) => {
        if (key === 'name') l.name = v || l.name;
        else if (key === 'w' && isPoint) {
          l.w = v;
          l.h = v;
        } else l[key] = v;
      }, { source: key === 'name' ? 'properties-name' : 'properties' });
    });
    root.append(U.el('div', { class: 'props-body' }, form));
  }

  A.ui.propertiesPanel = {
    init() {
      root = document.getElementById('properties-panel');
      events.on('selection:changed', render);
      events.on('doc:replaced', render);
      events.on('doc:changed', ({ source }) => {
        if (source === 'properties' || source === 'properties-name') return;
        if (root.contains(document.activeElement)) return;
        render();
      });
      render();
    }
  };
})(window.Arius);
