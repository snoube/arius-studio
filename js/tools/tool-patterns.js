/* Outil 5 : motifs (rayures, 3 motifs carrés, destruction). */
(function (A) {
  'use strict';

  const { state, utils: U } = A.core;
  const P = A.render.patterns;
  const K = A.tools.kit;

  const pct = (key, label, extra = {}) => ({ key, label, type: 'range', unit: '%', min: 0, max: 100, ...extra });
  const color = { key: 'color', label: 'Couleur', type: 'color' };
  const opacity = pct('opacity', 'Opacité');

  const SCHEMAS = {
    none: [],
    rayures: [
      {
        key: 'orientation', label: 'Sens', type: 'select', options: [
          { value: 'horizontal', label: 'Horizontales' },
          { value: 'vertical', label: 'Verticales' },
          { value: 'diagonale-descendante', label: 'Diagonales descendantes' },
          { value: 'diagonale-montante', label: 'Diagonales montantes' }
        ]
      },
      { key: 'thickness', label: 'Épaisseur des rayures', type: 'number', unit: 'px', min: 1, max: 256 },
      { key: 'spacing', label: 'Espacement', type: 'number', unit: 'px', min: 0, max: 512 },
      { key: 'offset', label: 'Décalage', type: 'number', unit: 'px', min: 0, max: 512 },
      color, opacity
    ],
    quadrillage: [
      { key: 'size', label: 'Taille des carrés', type: 'number', unit: 'px', min: 2, max: 512 },
      { key: 'thickness', label: 'Épaisseur des lignes', type: 'number', unit: 'px', min: 1, max: 64 },
      { key: 'offset', label: 'Décalage', type: 'number', unit: 'px', min: 0, max: 512 },
      color, opacity
    ],
    damier: [
      { key: 'size', label: 'Taille des carrés', type: 'number', unit: 'px', min: 1, max: 512 },
      color, opacity
    ],
    plaques: [
      { key: 'size', label: 'Taille des plaques', type: 'number', unit: 'px', min: 4, max: 512 },
      { key: 'gap', label: 'Joint', type: 'number', unit: 'px', min: 0, max: 64 },
      pct('relief', 'Relief'),
      { key: 'rivets', label: 'Rivets', type: 'checkbox', hint: 'Visibles à partir de 12 px.' },
      { ...color, label: 'Couleur des joints' }, { ...opacity, label: 'Opacité des joints' }
    ],
    destruction: [
      pct('x', 'Point d’impact horizontal'),
      pct('y', 'Point d’impact vertical'),
      { key: 'radius', label: 'Taille de l’impact', type: 'number', unit: 'px', min: 2, max: 512 },
      { key: 'cracks', label: 'Nombre de fissures', type: 'number', min: 1, max: 40 },
      pct('length', 'Longueur des fissures'),
      { key: 'branches', label: 'Ramifications', type: 'number', min: 0, max: 4 },
      { ...color, label: 'Couleur des fissures' },
      pct('intensity', 'Intensité'),
      { key: 'seed', label: 'Variante', type: 'number', min: 1, max: 9999, hint: 'Change ce nombre pour un autre dessin de fissures.' }
    ]
  };

  A.tools.register({
    id: 'patterns',
    label: 'Motifs',
    short: 'Motifs',
    icon: 'patterns',
    description: 'Ajoute un motif au calque, avec ou sans effet de fond.',
    mount(body, remount) {
      const { layer, empty } = K.requireLayer(['box', 'element', 'image', 'text'], {
        message: 'Sélectionne un calque pour lui donner un motif.'
      });
      if (empty) return body.append(empty);

      const values = { type: 'none', ...(layer.pattern || {}) };
      const apply = () => state.mutate(layer.id, (l) => {
        l.pattern = values.type === 'none' ? null : U.clone(values);
      });

      const typeForm = A.ui.fields.form([{ key: 'type', label: 'Motif', type: 'select', options: P.TYPES }], values, () => {
        const type = values.type;
        Object.keys(values).forEach((k) => delete values[k]);
        Object.assign(values, { type, ...U.clone(P.DEFAULTS[type]) });
        apply();
        remount();
      });

      body.append(
        K.section(null, K.target(layer)),
        K.section('Motif', typeForm,
          A.ui.fields.form(SCHEMAS[values.type] || [], values, apply),
          A.ui.presetBar({
            category: 'pattern',
            getData: () => U.clone(values),
            onApply: (data) => {
              Object.keys(values).forEach((k) => delete values[k]);
              Object.assign(values, { ...U.clone(P.DEFAULTS[data.type] || {}), ...data });
              apply();
              remount();
            }
          }))
      );
    }
  });
})(window.Arius);
