/*
 * Outil 1 : créateur de case (fond).
 * - Fond principal : sa taille est la taille de l'image exportée.
 * - Fonds secondaires : images supplémentaires posées dessus, qui acceptent les autres outils (ombre, bordure...).
 */
(function (A) {
  'use strict';

  const { state } = A.core;
  const K = A.tools.kit;

  const SCHEMA = [
    { key: 'w', label: 'Largeur', type: 'number', unit: 'px', min: 1, max: 4096 },
    { key: 'h', label: 'Hauteur', type: 'number', unit: 'px', min: 1, max: 4096 },
    { key: 'color', label: 'Couleur', type: 'color' },
    { key: 'opacity', label: 'Opacité', type: 'range', unit: '%', min: 0, max: 100 }
  ];

  // brouillon du prochain fond secondaire (gardé entre deux ouvertures du panneau)
  const draft = { w: 120, h: 40, color: '#5b3fd1', opacity: 100 };

  const fromLayer = (l) => ({ w: l.w, h: l.h, color: l.fill.color, opacity: l.fill.opacity });
  const toLayer = (l, v) => {
    l.w = v.w;
    l.h = v.h;
    l.fill = { color: v.color, opacity: v.opacity };
  };

  function mainSection(remount) {
    const base = state.base();
    const values = fromLayer(base);
    const apply = () => state.mutate(base.id, (l) => toLayer(l, values));
    return K.section('Fond principal',
      K.note('Sa largeur et sa hauteur donnent la taille de l’image finale.'),
      A.ui.fields.form(SCHEMA, values, apply),
      A.ui.presetBar({
        category: 'background',
        getData: () => ({ ...values }),
        onApply: (data) => {
          Object.assign(values, data);
          apply();
          remount();
        }
      }));
  }

  function secondarySection(remount) {
    const sel = state.selected();
    const editing = sel && sel.type === 'box' && !sel.isBase;
    const values = editing ? fromLayer(sel) : draft;

    const addNew = () => {
      const W = state.width;
      const H = state.height;
      const count = state.layers.filter((l) => l.type === 'box' && !l.isBase).length + 1;
      const layer = state.createLayer('box', {
        name: 'Fond secondaire ' + count,
        w: values.w, h: values.h, fill: { color: values.color, opacity: values.opacity },
        x: Math.round((W - values.w) / 2), y: Math.round((H - values.h) / 2)
      });
      state.add(layer);
      A.ui.toast('Fond secondaire ajouté');
    };

    const onChange = () => {
      if (editing) state.mutate(sel.id, (l) => toLayer(l, values));
    };

    return K.section(editing ? 'Fond secondaire sélectionné' : 'Nouveau fond secondaire',
      K.note(editing
        ? 'Les modifications s’appliquent en direct. Sa position se règle dans « Propriétés » ou en le glissant sur l’image.'
        : 'Un fond secondaire est une image de plus, posée sur le fond principal : bordure, angles, effets, motifs et ombre s’y appliquent.'),
      A.ui.fields.form(SCHEMA, values, onChange),
      A.ui.presetBar({
        category: 'background',
        getData: () => ({ ...values }),
        onApply: (data) => {
          Object.assign(values, data);
          onChange();
          remount();
        }
      }),
      K.actions(K.button(editing ? 'Nouveau fond secondaire' : 'Ajouter le fond secondaire', { primary: true, icon: 'plus', onClick: addNew })));
  }

  A.tools.register({
    id: 'background',
    label: 'Créateur de case',
    short: 'Fond',
    icon: 'background',
    description: 'Crée le fond de l’image et des fonds secondaires (cadres, boutons, zones).',
    mount(body, remount) {
      body.append(mainSection(remount), secondarySection(remount));
    }
  });
})(window.Arius);
