/* Liste des calques : visibilité, ordre (glisser-déposer), copier / coller / dupliquer / supprimer. */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const { state, events } = A.core;
  const LR = A.render.layerRenderer;

  const TYPE_ICONS = { box: 'background', element: 'elements', text: 'text', image: 'image' };
  let list;
  let dragId = null;

  function drawThumb(canvas, layer) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const r = LR.render(layer);
    const s = Math.min(canvas.width / r.w, canvas.height / r.h);
    ctx.imageSmoothingEnabled = s < 1;
    const w = r.w * s;
    const h = r.h * s;
    ctx.drawImage(r.canvas, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }

  function action(icon, label, onClick, disabled = false) {
    const b = U.el('button', { type: 'button', class: 'icon-btn framed notch', title: label, 'aria-label': label, disabled, html: A.ui.icon(icon, 16) });
    b.addEventListener('click', onClick);
    return b;
  }

  async function rename(layer) {
    const name = await A.ui.dialogs.prompt({ title: 'Renommer le calque', label: 'Nom', value: layer.name, okLabel: 'Renommer' });
    if (name) state.mutate(layer.id, (l) => {
      l.name = name;
    }, { source: 'layers-name' });
  }

  function row(layer) {
    const selected = layer.id === state.selectedId;
    const thumb = U.el('canvas', { class: 'layer-thumb', width: 40, height: 28, dataset: { id: layer.id } });
    const eye = U.el('button', {
      type: 'button', class: 'layer-eye', title: layer.visible ? 'Masquer' : 'Afficher',
      'aria-label': (layer.visible ? 'Masquer ' : 'Afficher ') + layer.name, html: A.ui.icon(layer.visible ? 'eye' : 'eyeOff', 16)
    });
    eye.addEventListener('click', (e) => {
      e.stopPropagation();
      state.mutate(layer.id, (l) => {
        l.visible = !l.visible;
      }, { source: 'layers-visibility' });
    });
    const li = U.el('li', {
      class: 'layer-row' + (selected ? ' is-selected' : '') + (layer.visible ? '' : ' is-hidden'),
      draggable: layer.isBase ? 'false' : 'true', tabindex: '0', dataset: { id: layer.id },
      'aria-selected': String(selected), role: 'option'
    },
    eye, thumb,
    U.el('span', { class: 'layer-name', title: 'Double-clic pour renommer' }, layer.name),
    U.el('span', { class: 'layer-type', html: layer.isBase || layer.locked ? A.ui.icon('lock', 14) : A.ui.icon(TYPE_ICONS[layer.type], 14) }));

    li.addEventListener('click', () => state.select(layer.id));
    li.addEventListener('dblclick', () => rename(layer));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') rename(layer);
    });
    li.addEventListener('dragstart', (e) => {
      dragId = layer.id;
      e.dataTransfer.effectAllowed = 'move';
      li.classList.add('is-dragging');
    });
    li.addEventListener('dragend', () => {
      dragId = null;
      li.classList.remove('is-dragging');
      list.querySelectorAll('.drop-above,.drop-below').forEach((n) => n.classList.remove('drop-above', 'drop-below'));
    });
    li.addEventListener('dragover', (e) => {
      if (!dragId || dragId === layer.id) return;
      e.preventDefault();
      const r = li.getBoundingClientRect();
      const above = e.clientY < r.top + r.height / 2;
      li.classList.toggle('drop-above', above && !layer.isBase);
      li.classList.toggle('drop-below', !above || layer.isBase);
    });
    li.addEventListener('dragleave', () => li.classList.remove('drop-above', 'drop-below'));
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!dragId) return;
      const above = li.classList.contains('drop-above');
      const layers = state.layers;
      const fromIdx = layers.findIndex((l) => l.id === dragId);
      let idx = layers.findIndex((l) => l.id === layer.id);
      // la liste est affichée du haut (dernier calque) vers le bas (fond)
      let target = above ? idx + 1 : idx;
      if (fromIdx < target) target -= 1;
      state.moveTo(dragId, target);
    });
    return li;
  }

  function render() {
    list.innerHTML = '';
    [...state.layers].reverse().forEach((l) => list.append(row(l)));
    refreshThumbs();
    updateActions();
  }

  function refreshThumbs() {
    list.querySelectorAll('.layer-thumb').forEach((c) => {
      const layer = state.get(c.dataset.id);
      if (layer) drawThumb(c, layer);
    });
  }

  let actions = {};
  function updateActions() {
    const sel = state.selected();
    const movable = sel && !sel.isBase;
    const idx = sel ? state.layers.indexOf(sel) : -1;
    actions.up.disabled = !movable || idx === state.layers.length - 1;
    actions.down.disabled = !movable || idx <= 1;
    actions.rename.disabled = !sel;
    actions.dup.disabled = !movable;
    actions.copy.disabled = !movable;
    actions.paste.disabled = !state.clipboard;
    actions.del.disabled = !movable;
  }

  A.ui.layersPanel = {
    init() {
      const root = document.getElementById('layers-panel');
      list = U.el('ul', { class: 'layer-list', role: 'listbox', 'aria-label': 'Calques' });
      const fileInput = U.el('input', { type: 'file', accept: 'image/*', hidden: true });
      fileInput.addEventListener('change', async () => {
        if (fileInput.files[0]) await A.ui.project.importImage(fileInput.files[0]);
        fileInput.value = '';
      });

      actions = {
        up: action('up', 'Monter le calque', () => state.moveBy(state.selectedId, 1)),
        down: action('down', 'Descendre le calque', () => state.moveBy(state.selectedId, -1)),
        rename: action('pencil', 'Renommer le calque (double-clic)', () => state.selected() && rename(state.selected())),
        dup: action('duplicate', 'Dupliquer (Ctrl+D)', () => state.duplicate(state.selectedId)),
        copy: action('copy', 'Copier (Ctrl+C)', () => A.ui.shortcuts.copy()),
        paste: action('paste', 'Coller (Ctrl+V)', () => state.paste()),
        del: action('trash', 'Supprimer (Suppr)', () => state.remove(state.selectedId))
      };

      root.append(
        U.el('header', { class: 'side-header' },
          U.el('h2', { class: 'side-title' }, 'Calques'),
          action('image', 'Importer une image', () => fileInput.click()), fileInput),
        U.el('div', { class: 'layer-actions' }, Object.values(actions)),
        list);

      events.on('doc:replaced', render);
      events.on('selection:changed', render);
      events.on('clipboard:changed', updateActions);
      events.on('doc:changed', ({ source }) => {
        if (['structure', 'layers-name', 'layers-visibility', 'properties', 'properties-name'].includes(source)) render();
      });
      events.on('render:done', refreshThumbs);
      render();
    }
  };
})(window.Arius);
