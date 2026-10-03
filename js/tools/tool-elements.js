/* Outil 7 : créateur d'éléments (ligne, cadre, rond, point, triangle, losange). */
(function (A) {
  'use strict';

  const { state, utils: U } = A.core;
  const K = A.tools.kit;

  const KINDS = [
    { value: 'line', label: 'Ligne', icon: 'line' },
    { value: 'rect', label: 'Carré / rectangle', icon: 'rect' },
    { value: 'ellipse', label: 'Rond / ovale', icon: 'ellipse' },
    { value: 'point', label: 'Point', icon: 'point' },
    { value: 'triangle', label: 'Triangle', icon: 'triangle' },
    { value: 'losange', label: 'Losange', icon: 'losange' }
  ];
  const OUTLINED = ['rect', 'ellipse', 'triangle', 'losange'];

  const SCHEMA = [
    { key: 'w', label: 'Largeur', type: 'number', unit: 'px', min: 1, max: 4096, show: (v) => v.kind !== 'point' },
    { key: 'h', label: 'Hauteur', type: 'number', unit: 'px', min: 1, max: 4096, show: (v) => v.kind !== 'point', hint: 'Pour une ligne fine : une petite hauteur (1 ou 2 px).' },
    { key: 'size', label: 'Taille du point', type: 'number', unit: 'px', min: 1, max: 1024, show: (v) => v.kind === 'point' },
    { key: 'strokeWidth', label: 'Épaisseur de la bordure', type: 'number', unit: 'px', min: 0, max: 512, show: (v) => OUTLINED.includes(v.kind) },
    { key: 'color', label: 'Couleur', type: 'color' },
    { key: 'opacity', label: 'Opacité', type: 'range', unit: '%', min: 0, max: 100 },
    { key: 'fillEnabled', label: 'Remplir l’intérieur', type: 'checkbox', show: (v) => OUTLINED.includes(v.kind) },
    { key: 'fillColor', label: 'Couleur de l’intérieur', type: 'color', show: (v) => OUTLINED.includes(v.kind) && v.fillEnabled },
    { key: 'fillOpacity', label: 'Opacité de l’intérieur', type: 'range', unit: '%', min: 0, max: 100, show: (v) => OUTLINED.includes(v.kind) && v.fillEnabled }
  ];

  const draft = { kind: 'rect', w: 80, h: 48, size: 6, strokeWidth: 2, color: '#9b6bff', opacity: 100, fillEnabled: false, fillColor: '#9b6bff', fillOpacity: 40 };

  const fromLayer = (l) => ({
    kind: l.kind, w: l.w, h: l.h, size: l.w, strokeWidth: l.stroke.width, color: l.stroke.color, opacity: l.stroke.opacity,
    fillEnabled: !!l.fill.enabled, fillColor: l.fill.color, fillOpacity: l.fill.opacity
  });

  function toLayer(l, v) {
    l.kind = v.kind;
    if (v.kind === 'point') {
      l.w = v.size;
      l.h = v.size;
    } else {
      l.w = v.w;
      l.h = v.h;
    }
    l.stroke = { width: v.strokeWidth, color: v.color, opacity: v.opacity };
    l.fill = { enabled: v.fillEnabled, color: v.fillColor, opacity: v.fillOpacity };
    if (!['rect', 'line'].includes(v.kind)) l.corners = null;
  }

  A.tools.register({
    id: 'elements',
    label: 'Créateur d’éléments',
    short: 'Éléments',
    icon: 'elements',
    description: 'Ajoute des lignes, cadres, ronds et points à l’image.',
    mount(body, remount) {
      const sel = state.selected();
      const editing = sel && sel.type === 'element';
      const values = editing ? fromLayer(sel) : draft;

      const apply = () => {
        if (editing) state.mutate(sel.id, (l) => toLayer(l, values));
      };

      const add = () => {
        const name = KINDS.find((k) => k.value === values.kind).label.split(' ')[0];
        const layer = state.createLayer('element', { name });
        toLayer(layer, values);
        layer.x = Math.round((state.width - layer.w) / 2);
        layer.y = Math.round((state.height - layer.h) / 2);
        state.add(layer);
        A.ui.toast(name + ' ajouté');
      };

      const kindForm = A.ui.fields.form([{
        key: 'kind', label: 'Type d’élément', type: 'segmented',
        options: KINDS.map((k) => ({ value: k.value, label: k.label, title: k.label, icon: k.icon }))
      }], values, () => {
        apply();
        remount();
      });

      body.append(
        ...(editing ? [K.section(null, K.target(sel))] : []),
        K.section(editing ? 'Élément sélectionné' : 'Nouvel élément',
          kindForm,
          A.ui.fields.form(SCHEMA, values, apply),
          A.ui.presetBar({
            category: 'element',
            getData: () => ({ ...values }),
            onApply: (data) => {
              Object.assign(values, data);
              apply();
              remount();
            }
          }),
          K.actions(K.button(editing ? 'Ajouter un nouvel élément' : 'Ajouter l’élément', { primary: true, icon: 'plus', onClick: add }))),
        K.note('Bordure, angles, effets, motifs et ombre s’appliquent aussi aux éléments.')
      );
    }
  });
})(window.Arius);
