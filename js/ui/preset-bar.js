/*
 * Barre de préréglages réutilisée par tous les outils :
 * choisir un préréglage l'applique, "Enregistrer" garde les réglages actuels sous un nom.
 */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const { presets, events } = A.core;

  A.ui.presetBar = function ({ category, getData, onApply, label = 'Préréglages' }) {
    const select = U.el('select', { class: 'input select', 'aria-label': label });
    const del = U.el('button', { type: 'button', class: 'icon-btn framed notch', title: 'Supprimer le préréglage choisi', 'aria-label': 'Supprimer le préréglage choisi', html: A.ui.icon('trash', 16) });
    const save = U.el('button', { type: 'button', class: 'btn btn-small framed notch', title: 'Enregistrer les réglages actuels' }, 'Enregistrer');

    function fill(selectedId) {
      select.innerHTML = '';
      const list = presets.list(category);
      select.append(U.el('option', { value: '' }, list.length ? 'Choisir un préréglage…' : 'Aucun préréglage'));
      list.forEach((p) => select.append(U.el('option', { value: p.id, selected: p.id === selectedId }, p.name)));
      del.disabled = !select.value;
    }

    select.addEventListener('change', () => {
      del.disabled = !select.value;
      const p = presets.get(category, select.value);
      if (p) onApply(U.clone(p.data), p);
    });

    save.addEventListener('click', async () => {
      const current = presets.get(category, select.value);
      const name = await A.ui.dialogs.prompt({ title: 'Enregistrer le préréglage', label: 'Nom du préréglage', value: current ? current.name : '', okLabel: 'Enregistrer' });
      if (!name) return;
      const p = presets.save(category, name, getData());
      fill(p.id);
      A.ui.toast(p.persisted ? `Préréglage « ${name} » enregistré` : `« ${name} » gardé pour cette session : le stockage local est plein`, p.persisted ? 'info' : 'error');
    });

    del.addEventListener('click', async () => {
      const p = presets.get(category, select.value);
      if (!p) return;
      const ok = await A.ui.dialogs.confirm({ title: 'Supprimer le préréglage', message: `Supprimer « ${p.name} » ?`, okLabel: 'Supprimer', danger: true });
      if (ok) {
        presets.remove(category, p.id);
        A.ui.toast(`Préréglage « ${p.name} » supprimé`);
      }
    });

    const root = U.el('div', { class: 'preset-bar' },
      U.el('span', { class: 'preset-label' }, label),
      U.el('div', { class: 'preset-row' }, select, del, save));

    const off = events.on('presets:changed', () => {
      if (!root.isConnected) return off();
      fill(select.value);
    });
    fill();
    return root;
  };
})(window.Arius);
