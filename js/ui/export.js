/*
 * Export de l'image sur le PC : PNG, WebP ou JPEG, agrandissement net (pixels conservés),
 * image entière ou calque sélectionné seul.
 * PNG et WebP gardent les zones vides transparentes ; le JPEG ne le peut pas.
 */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const { state } = A.core;
  const C = A.render.compositor;

  const FORMATS = {
    png: { mime: 'image/png', ext: 'png', label: 'PNG' },
    webp: { mime: 'image/webp', ext: 'webp', label: 'WebP' },
    jpeg: { mime: 'image/jpeg', ext: 'jpg', label: 'JPEG' }
  };

  const settings = { format: 'png', scale: 1, scope: 'all', quality: 92, background: '#000000', filename: '' };

  function buildCanvas() {
    let src;
    if (settings.scope === 'layer' && state.selected()) src = C.renderLayerAlone(state.selected());
    else {
      src = U.createCanvas(state.width, state.height);
      C.renderDocument(src, state);
    }
    const s = Math.max(1, Math.round(settings.scale));
    const out = U.createCanvas(src.width * s, src.height * s);
    const ctx = out.getContext('2d');
    if (settings.format === 'jpeg') {
      ctx.fillStyle = settings.background;
      ctx.fillRect(0, 0, out.width, out.height);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, out.width, out.height);
    return out;
  }

  /** Partage possible (téléphone) : envoi direct vers Discord, Galerie, Drive… */
  function canShareFiles() {
    try {
      return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'test.png', { type: 'image/png' })] }));
    } catch (err) {
      return false;
    }
  }

  async function run(share = false) {
    const f = FORMATS[settings.format];
    const canvas = buildCanvas();
    const blob = await new Promise((res) => canvas.toBlob(res, f.mime, settings.quality / 100));
    if (!blob) return A.ui.toast('Export impossible dans ce format avec ce navigateur. Essaie PNG.', 'error');
    if (settings.format === 'webp' && blob.type !== 'image/webp') {
      return A.ui.toast('Ce navigateur ne sait pas créer de WebP. Utilise PNG.', 'error');
    }
    const name = A.ui.project.safeName(settings.filename || state.doc.name) + '.' + f.ext;
    if (share) {
      try {
        await navigator.share({ files: [new File([blob], name, { type: f.mime })], title: name });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        A.ui.toast('Partage impossible, enregistrement du fichier à la place.', 'error');
      }
    }
    const ok = await A.ui.project.saveBlob(blob, name, 'Image ' + f.label, { [f.mime]: ['.' + f.ext] });
    if (ok) A.ui.toast(`Image exportée : ${name} (${canvas.width} × ${canvas.height} px)`);
  }

  A.ui.exporter = {
    open() {
      settings.filename = state.doc.name;
      const sel = state.selected();
      if (settings.scope === 'layer' && (!sel || sel.isBase)) settings.scope = 'all';

      const info = U.el('p', { class: 'export-size' });
      const updateInfo = () => {
        const s = Math.max(1, Math.round(settings.scale));
        let w = state.width;
        let h = state.height;
        if (settings.scope === 'layer' && state.selected()) {
          const c = C.renderLayerAlone(state.selected());
          w = c.width;
          h = c.height;
        }
        info.textContent = `Taille du fichier : ${w * s} × ${h * s} px`;
      };

      const form = A.ui.fields.form([
        { key: 'filename', label: 'Nom du fichier', type: 'text' },
        { key: 'format', label: 'Format', type: 'segmented', options: Object.entries(FORMATS).map(([value, f]) => ({ value, label: f.label })) },
        { key: 'scope', label: 'Contenu', type: 'segmented', options: [{ value: 'all', label: 'Image entière' }, { value: 'layer', label: 'Calque sélectionné' }] },
        { key: 'scale', label: 'Agrandissement', type: 'number', unit: '×', min: 1, max: 16, hint: 'Agrandit sans flou : chaque pixel devient un carré net.' },
        { key: 'quality', label: 'Qualité', type: 'range', unit: '%', min: 10, max: 100, show: (v) => v.format !== 'png' },
        { key: 'background', label: 'Couleur des zones vides', type: 'color', show: (v) => v.format === 'jpeg', hint: 'Le JPEG ne gère pas la transparence : les zones vides seront remplies avec cette couleur. Choisis PNG ou WebP pour les garder vides.' }
      ], settings, (key) => {
        if (key === 'scope' && settings.scope === 'layer' && (!state.selected() || state.selected().isBase)) {
          A.ui.toast('Sélectionne d’abord un calque autre que le fond principal.', 'error');
          settings.scope = 'all';
        }
        updateInfo();
      });
      updateInfo();

      A.ui.dialogs.open({
        title: 'Exporter l’image',
        body: U.el('div', null, form, info, U.el('p', { class: 'dialog-text' }, 'PNG garde les zones vides transparentes (angles découpés, fonds à 0 %).')),
        actions: [
          { label: 'Annuler', onClick: (close) => close() },
          ...(canShareFiles() ? [{
            label: 'Partager', onClick: async (close) => {
              close();
              await run(true);
            }
          }] : []),
          {
            label: 'Exporter', primary: true, onClick: async (close) => {
              close();
              await run();
            }
          }
        ]
      });
    }
  };
})(window.Arius);
