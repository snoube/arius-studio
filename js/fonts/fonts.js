/*
 * Polices : intégrées (dont Monocraft, style Minecraft) + polices importées (.ttf, .otf, .woff, .woff2).
 * Les polices importées sont gardées dans le stockage local quand la place le permet.
 */
(function (A) {
  'use strict';

  const { storage, events } = A.core;
  const KEY = 'fonts.v1';

  const BUILTIN = [
    { family: 'Monocraft', label: 'Minecraft (Monocraft)' },
    { family: 'Arial', label: 'Classique (Arial)' },
    { family: 'Verdana', label: 'Verdana' },
    { family: 'Trebuchet MS', label: 'Trebuchet MS' },
    { family: 'Georgia', label: 'Georgia' },
    { family: 'Times New Roman', label: 'Times New Roman' },
    { family: 'Courier New', label: 'Courier New' },
    { family: 'Impact', label: 'Impact' }
  ];

  const custom = [];
  const loading = new Set();

  function base64ToBuffer(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  async function register(family, buffer) {
    const face = new FontFace(family, buffer);
    await face.load();
    document.fonts.add(face);
    if (!custom.find((f) => f.family === family) && !BUILTIN.find((f) => f.family === family)) {
      custom.push({ family, label: family + ' (importée)', custom: true });
    }
  }

  function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  Object.assign(A.fonts, {
    list: () => BUILTIN.concat(custom),

    async init() {
      if (A.fonts.monocraftData) {
        try {
          const face = new FontFace('Monocraft', base64ToBuffer(A.fonts.monocraftData));
          await face.load();
          document.fonts.add(face);
        } catch (err) {
          console.warn('[Arius] Monocraft non chargée', err);
        }
      }
      const stored = storage.read(KEY, []);
      for (const f of stored) {
        try {
          await register(f.family, base64ToBuffer(f.data));
        } catch (err) {
          console.warn('[Arius] police importée illisible', f.family, err);
        }
      }
      events.emit('fonts:changed');
    },

    /** Importe un fichier de police. Renvoie { family, persisted }. */
    async importFile(file) {
      const family = file.name.replace(/\.[^.]+$/, '').replace(/[^\w \-]/g, '').trim() || 'Police importée';
      const buffer = await file.arrayBuffer();
      await register(family, buffer);
      const stored = storage.read(KEY, []).filter((f) => f.family !== family);
      stored.push({ family, data: bufferToBase64(buffer) });
      const persisted = storage.write(KEY, stored);
      events.emit('fonts:changed');
      return { family, persisted };
    },

    cssFont(f) {
      return `${f.italic ? 'italic ' : ''}${f.bold ? 'bold ' : ''}${Math.max(1, f.size)}px "${f.family}", sans-serif`;
    },

    isReady: (css) => document.fonts.check(css),

    /** Charge la police si besoin puis demande un nouveau rendu. */
    ensure(css) {
      if (loading.has(css)) return;
      loading.add(css);
      document.fonts.load(css).finally(() => {
        loading.delete(css);
        events.emit('render:fonts-ready');
      });
    }
  });
})(window.Arius);
