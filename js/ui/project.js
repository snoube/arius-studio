/*
 * Fichiers : nouveau projet, ouvrir / enregistrer un projet (.arius.json), importer une image,
 * sauvegarde automatique, export / import de tous les préréglages.
 */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const { state, storage, presets, events } = A.core;
  let autosaveWarned = false;

  /** Enregistre un fichier sur le PC : choix de l'emplacement quand c'est possible, sinon téléchargement. */
  async function saveBlob(blob, filename, description, accept) {
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({ suggestedName: filename, types: [{ description, accept }] });
        const w = await handle.createWritable();
        await w.write(blob);
        await w.close();
        return true;
      } catch (err) {
        if (err && err.name === 'AbortError') return false;
        console.warn('[Arius] sélecteur de fichier indisponible, téléchargement à la place', err);
      }
    }
    const url = URL.createObjectURL(blob);
    const a = U.el('a', { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  }

  function pickFile(accept) {
    return new Promise((resolve) => {
      const input = U.el('input', { type: 'file', accept, hidden: true });
      input.addEventListener('change', () => {
        resolve(input.files[0] || null);
        input.remove();
      });
      document.body.append(input);
      input.click();
    });
  }

  const safeName = (s) => (s || 'arius').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'arius';

  const api = {
    saveBlob,
    safeName,

    newProject() {
      const values = { name: 'Sans titre', w: 300, h: 200, color: '#14121f', opacity: 100 };
      const form = A.ui.fields.form([
        { key: 'name', label: 'Nom du projet', type: 'text' },
        { key: 'w', label: 'Largeur', type: 'number', unit: 'px', min: 1, max: 4096 },
        { key: 'h', label: 'Hauteur', type: 'number', unit: 'px', min: 1, max: 4096 },
        { key: 'color', label: 'Couleur du fond', type: 'color' },
        { key: 'opacity', label: 'Opacité du fond', type: 'range', unit: '%', min: 0, max: 100, hint: '0 % = fond vide (transparent).' }
      ], values, () => {});
      A.ui.dialogs.open({
        title: 'Nouveau projet',
        body: U.el('div', null, U.el('p', { class: 'dialog-text' }, 'Le projet actuel sera remplacé. Enregistre-le avant si tu veux le garder.'), form),
        actions: [
          { label: 'Annuler', onClick: (close) => close() },
          {
            label: 'Créer', primary: true, onClick: (close) => {
              state.newDocument({ width: values.w, height: values.h, color: values.color, opacity: values.opacity, name: values.name || 'Sans titre' });
              close();
            }
          }
        ]
      });
    },

    async saveProject() {
      const data = { app: 'arius-studio', kind: 'project', version: 1, doc: state.doc };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const ok = await saveBlob(blob, safeName(state.doc.name) + '.arius.json', 'Projet Arius Studio', { 'application/json': ['.json'] });
      if (ok) A.ui.toast('Projet enregistré');
    },

    async openProject() {
      const file = await pickFile('.json,application/json');
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (data.kind === 'presets') return api.importPresetsData(data);
        state.loadDocument(data.doc || data);
        A.ui.toast(`Projet « ${state.doc.name} » ouvert`);
      } catch (err) {
        A.ui.toast('Impossible d’ouvrir ce fichier : ' + err.message, 'error');
      }
    },

    async importImage(file) {
      if (!file || !file.type.startsWith('image/')) return A.ui.toast('Ce fichier n’est pas une image.', 'error');
      const src = await U.readFileAsDataURL(file);
      const img = new Image();
      img.onload = () => {
        const layer = state.createLayer('image', { name: file.name ? file.name.replace(/\.[^.]+$/, '') : 'Image collée', src, w: img.naturalWidth, h: img.naturalHeight });
        layer.x = Math.round((state.width - layer.w) / 2);
        layer.y = Math.round((state.height - layer.h) / 2);
        state.add(layer);
        A.ui.toast('Image ajoutée');
      };
      img.onerror = () => A.ui.toast('Image illisible.', 'error');
      img.src = src;
    },

    async exportPresets() {
      const blob = new Blob([JSON.stringify(presets.exportAll(), null, 2)], { type: 'application/json' });
      const ok = await saveBlob(blob, 'arius-prereglages.json', 'Préréglages Arius Studio', { 'application/json': ['.json'] });
      if (ok) A.ui.toast('Préréglages exportés');
    },

    async importPresets() {
      const file = await pickFile('.json,application/json');
      if (!file) return;
      try {
        api.importPresetsData(JSON.parse(await file.text()));
      } catch (err) {
        A.ui.toast('Import impossible : ' + err.message, 'error');
      }
    },

    importPresetsData(data) {
      const n = presets.importAll(data);
      A.ui.toast(n + ' préréglage' + (n > 1 ? 's' : '') + ' importé' + (n > 1 ? 's' : ''));
      A.ui.toolPanel.refresh();
    },

    restoreAutosave() {
      const doc = storage.read('autosave', null);
      if (!doc) return false;
      try {
        state.loadDocument(doc);
        return true;
      } catch (err) {
        return false;
      }
    },

    initAutosave() {
      const save = U.debounce(() => {
        const ok = storage.write('autosave', state.doc);
        if (!ok && !autosaveWarned) {
          autosaveWarned = true;
          A.ui.toast('Sauvegarde automatique impossible (projet trop lourd) : pense à « Enregistrer le projet ».', 'error');
        }
      }, 800);
      events.on('doc:changed', save);
      events.on('doc:replaced', save);
    }
  };

  A.ui.project = api;
})(window.Arius);
