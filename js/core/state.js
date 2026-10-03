/*
 * Document en cours : une pile de calques.
 * Le calque du bas est toujours le "fond principal" (outil 1) : sa taille = taille de l'image.
 * Calques possibles : box (fond), element (outil 7), text (outil 6), image (importée).
 */
(function (A) {
  'use strict';

  const { utils: U, events, history } = A.core;

  const S = { doc: null, selectedId: null, clipboard: null };

  const TYPE_NAMES = { box: 'Fond secondaire', element: 'Élément', text: 'Texte', image: 'Image' };

  const DEFAULT_FONT = {
    family: 'Monocraft', size: 24, color: '#ffffff', opacity: 100, bold: false, italic: false,
    spacing: 0, lineHeight: 1.2, align: 'left', outlineWidth: 0, outlineColor: '#000000', pixel: true
  };

  const FACTORIES = {
    box: () => ({ isBase: false, fill: { color: '#14121f', opacity: 100 } }),
    element: () => ({
      kind: 'rect',
      stroke: { width: 2, color: '#9b6bff', opacity: 100 },
      fill: { enabled: false, color: '#9b6bff', opacity: 40 }
    }),
    text: () => ({ text: 'Arius', font: U.clone(DEFAULT_FONT) }),
    image: () => ({ src: '', pixelated: true })
  };

  function createLayer(type, props = {}) {
    const layer = {
      id: U.uid(), type, name: TYPE_NAMES[type] || 'Calque',
      visible: true, locked: false,
      x: 0, y: 0, w: 100, h: 100, opacity: 100,
      corners: null, border: null, effect: null, pattern: null, shadow: null,
      ...FACTORIES[type](),
      ...U.clone(props)
    };
    layer.id = U.uid();
    return layer;
  }

  /* Historique ------------------------------------------------------------ */
  let commitTimer = null;
  const snapshot = () => JSON.stringify({ doc: S.doc, selectedId: S.selectedId });
  function flush() {
    if (commitTimer) {
      clearTimeout(commitTimer);
      commitTimer = null;
    }
    history.push(snapshot());
  }
  function scheduleCommit() {
    clearTimeout(commitTimer);
    commitTimer = setTimeout(flush, 300);
  }
  function changed(source, commit = true) {
    events.emit('doc:changed', { source });
    if (commit) scheduleCommit();
  }
  function restore(snap) {
    const o = JSON.parse(snap);
    S.doc = o.doc;
    S.selectedId = o.selectedId;
    events.emit('doc:replaced');
  }

  function indexOf(id) {
    return S.doc.layers.findIndex((l) => l.id === id);
  }

  const api = {
    DEFAULT_FONT,
    createLayer,

    get doc() { return S.doc; },
    get layers() { return S.doc.layers; },
    get selectedId() { return S.selectedId; },
    get width() { return api.base().w; },
    get height() { return api.base().h; },
    get clipboard() { return S.clipboard; },

    base: () => S.doc.layers.find((l) => l.isBase),
    get: (id) => S.doc.layers.find((l) => l.id === id) || null,
    selected: () => api.get(S.selectedId),

    newDocument({ width = 300, height = 200, color = '#14121f', opacity = 100, name = 'Sans titre' } = {}) {
      const base = createLayer('box', {
        name: 'Fond principal', isBase: true, locked: true,
        w: width, h: height, fill: { color, opacity }
      });
      S.doc = { name, layers: [base] };
      S.selectedId = base.id;
      history.reset(snapshot());
      events.emit('doc:replaced');
    },

    loadDocument(doc) {
      if (!doc || !Array.isArray(doc.layers)) throw new Error('Projet invalide : aucun calque trouvé.');
      let base = doc.layers.find((l) => l.isBase);
      if (!base) throw new Error('Projet invalide : fond principal manquant.');
      doc.layers = [base, ...doc.layers.filter((l) => l !== base)];
      S.doc = { name: doc.name || 'Sans titre', layers: doc.layers };
      S.selectedId = base.id;
      history.reset(snapshot());
      events.emit('doc:replaced');
    },

    rename(name) {
      S.doc.name = name || 'Sans titre';
      changed('doc-name');
    },

    select(id) {
      if (S.selectedId === id) return;
      S.selectedId = id;
      events.emit('selection:changed', id);
    },

    add(layer, { select = true, index } = {}) {
      const layers = S.doc.layers;
      const at = index == null ? layers.length : U.clamp(index, 1, layers.length);
      layers.splice(at, 0, layer);
      changed('structure');
      if (select) {
        S.selectedId = layer.id;
        events.emit('selection:changed', layer.id);
      }
      return layer;
    },

    /** Modifie un calque via une fonction. source sert aux panneaux pour savoir s'ils doivent se redessiner. */
    mutate(id, fn, { source = 'panel', commit = true } = {}) {
      const layer = api.get(id);
      if (!layer) return;
      fn(layer);
      if (layer.isBase) {
        layer.x = 0;
        layer.y = 0;
      }
      changed(source, commit);
    },

    remove(id) {
      const i = indexOf(id);
      const layer = S.doc.layers[i];
      if (!layer || layer.isBase) return false;
      S.doc.layers.splice(i, 1);
      if (S.selectedId === id) {
        const next = S.doc.layers[Math.min(i, S.doc.layers.length - 1)];
        S.selectedId = next ? next.id : null;
      }
      changed('structure');
      events.emit('selection:changed', S.selectedId);
      return true;
    },

    duplicate(id) {
      const src = api.get(id);
      if (!src || src.isBase) return null;
      const copy = { ...U.clone(src), id: U.uid(), name: src.name + ' (copie)', x: src.x + 8, y: src.y + 8 };
      return api.add(copy, { index: indexOf(id) + 1 });
    },

    copy(id) {
      const src = api.get(id);
      if (!src || src.isBase) return false;
      S.clipboard = U.clone(src);
      return true;
    },

    paste() {
      if (!S.clipboard) return null;
      const copy = { ...U.clone(S.clipboard), id: U.uid(), x: S.clipboard.x + 10, y: S.clipboard.y + 10 };
      S.clipboard.x += 10;
      S.clipboard.y += 10;
      return api.add(copy);
    },

    /** Déplace un calque dans la pile (le fond principal reste en bas). */
    moveTo(id, newIndex) {
      const i = indexOf(id);
      const layer = S.doc.layers[i];
      if (!layer || layer.isBase) return;
      S.doc.layers.splice(i, 1);
      S.doc.layers.splice(U.clamp(newIndex, 1, S.doc.layers.length), 0, layer);
      changed('structure');
    },

    moveBy(id, delta) {
      const i = indexOf(id);
      if (i < 0) return;
      api.moveTo(id, i + delta);
    },

    commitNow: flush,

    undo() {
      if (commitTimer) flush();
      const snap = history.undo();
      if (snap) restore(snap);
    },

    redo() {
      if (commitTimer) flush();
      const snap = history.redo();
      if (snap) restore(snap);
    }
  };

  A.core.state = api;
})(window.Arius);
