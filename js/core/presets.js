/*
 * Préréglages enregistrés (un par catégorie d'outil).
 * Ils sont gardés dans le stockage local et peuvent être exportés / importés en JSON.
 */
(function (A) {
  'use strict';

  const { storage, events, utils: U } = A.core;
  const KEY = 'presets.v1';

  const CATEGORIES = ['background', 'border', 'corners', 'effect', 'pattern', 'font', 'element', 'shadow'];

  const DEFAULTS = {
    background: [
      { name: 'Interface 300 × 200', data: { w: 300, h: 200, color: '#14121f', opacity: 100 } },
      { name: 'Bouton 120 × 32', data: { w: 120, h: 32, color: '#5b3fd1', opacity: 100 } }
    ],
    border: [{ name: 'Liseré clair', data: { enabled: true, width: 2, inset: 0, color: '#f4eef4', opacity: 100 } }],
    corners: [
      { name: 'Encoche Arius', data: { type: 'notch', w: 6, h: 6, steps: 3, profile: [3, 1, 1], scale: 2 } },
      { name: 'Pixel arrondi', data: { type: 'pixel', w: 6, h: 6, steps: 3, profile: [3, 1, 1], scale: 2 } },
      { name: 'Biseau 8', data: { type: 'chamfer', w: 8, h: 8, steps: 3, profile: [3, 1, 1], scale: 2 } }
    ],
    effect: [],
    pattern: [],
    font: [
      {
        name: 'Titre Minecraft',
        data: { family: 'Monocraft', size: 24, color: '#ffffff', opacity: 100, bold: false, italic: false, spacing: 0, lineHeight: 1.2, align: 'left', outlineWidth: 0, outlineColor: '#000000', pixel: true }
      }
    ],
    element: [],
    shadow: [{ name: 'Ombre douce', data: { enabled: true, color: '#000000', opacity: 60, blur: 8, distance: 4, direction: 'bas' } }]
  };

  function seed() {
    const fresh = {};
    CATEGORIES.forEach((c) => {
      fresh[c] = (DEFAULTS[c] || []).map((p) => ({ id: U.uid(), name: p.name, data: U.clone(p.data) }));
    });
    return fresh;
  }

  function load() {
    const saved = storage.read(KEY, null);
    if (!saved || typeof saved !== 'object') {
      const fresh = seed();
      storage.write(KEY, fresh);
      return fresh;
    }
    CATEGORIES.forEach((c) => {
      if (!Array.isArray(saved[c])) saved[c] = [];
    });
    return saved;
  }

  let store = load();

  function persist() {
    const ok = storage.write(KEY, store);
    events.emit('presets:changed');
    return ok;
  }

  A.core.presets = {
    CATEGORIES,
    list: (cat) => store[cat] || [],
    get: (cat, id) => (store[cat] || []).find((p) => p.id === id) || null,

    /** Enregistre (ou remplace si le nom existe déjà). Renvoie le préréglage. */
    save(cat, name, data) {
      const list = store[cat];
      let preset = list.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (preset) preset.data = U.clone(data);
      else {
        preset = { id: U.uid(), name, data: U.clone(data) };
        list.push(preset);
      }
      preset.persisted = persist();
      return preset;
    },

    remove(cat, id) {
      store[cat] = (store[cat] || []).filter((p) => p.id !== id);
      persist();
    },

    exportAll: () => ({ app: 'arius-studio', kind: 'presets', version: 1, presets: U.clone(store) }),

    /** Fusionne un fichier exporté. Renvoie le nombre de préréglages importés. */
    importAll(json) {
      if (!json || json.kind !== 'presets' || typeof json.presets !== 'object') {
        throw new Error("Ce fichier n'est pas un export de préréglages Arius Studio.");
      }
      let count = 0;
      CATEGORIES.forEach((c) => {
        (json.presets[c] || []).forEach((p) => {
          if (!p || typeof p.name !== 'string' || typeof p.data !== 'object') return;
          const existing = store[c].find((e) => e.name.toLowerCase() === p.name.toLowerCase());
          if (existing) existing.data = U.clone(p.data);
          else store[c].push({ id: U.uid(), name: p.name, data: U.clone(p.data) });
          count += 1;
        });
      });
      persist();
      return count;
    }
  };
})(window.Arius);
