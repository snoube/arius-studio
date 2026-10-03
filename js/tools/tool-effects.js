/* Outil 4 : effets de fond (reflet, dégradés, métallisé, scintillant). */
(function (A) {
  'use strict';

  const { state, utils: U } = A.core;
  const E = A.render.effects;
  const K = A.tools.kit;

  const pct = (key, label, extra = {}) => ({ key, label, type: 'range', unit: '%', min: 0, max: 100, ...extra });
  const DIRECTIONS = [
    { value: 'haut-bas', label: 'Du haut vers le bas' },
    { value: 'bas-haut', label: 'Du bas vers le haut' },
    { value: 'gauche-droite', label: 'De gauche à droite' },
    { value: 'droite-gauche', label: 'De droite à gauche' },
    { value: 'diagonale', label: 'Diagonale' },
    { value: 'radial', label: 'Depuis le centre' }
  ];

  const SCHEMAS = {
    none: [],
    reflet: [
      { key: 'angle', label: 'Angle', type: 'number', unit: '°', min: -360, max: 360 },
      pct('position', 'Position'),
      pct('width', 'Largeur du reflet', { min: 1 }),
      pct('softness', 'Douceur'),
      pct('intensity', 'Intensité'),
      { key: 'color', label: 'Couleur du reflet', type: 'color' },
      { key: 'double', label: 'Deuxième reflet fin', type: 'checkbox' }
    ],
    'degrade-sombre': [
      { key: 'direction', label: 'Direction', type: 'select', options: DIRECTIONS },
      pct('start', 'Début du dégradé', { max: 99 }),
      pct('intensity', 'Assombrissement')
    ],
    'degrade-clair': [
      { key: 'direction', label: 'Direction', type: 'select', options: DIRECTIONS },
      pct('start', 'Début du dégradé', { max: 99 }),
      pct('intensity', 'Éclaircissement')
    ],
    metal: [
      { key: 'orientation', label: 'Sens', type: 'segmented', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }] },
      { key: 'bands', label: 'Bandes de lumière', type: 'number', min: 1, max: 12 },
      pct('intensity', 'Intensité'),
      pct('brush', 'Effet brossé'),
      { key: 'seed', label: 'Variante', type: 'number', min: 1, max: 9999, hint: 'Change ce nombre pour obtenir un autre tirage.' }
    ],
    scintillant: [
      pct('density', 'Densité', { min: 1 }),
      { key: 'size', label: 'Taille des éclats', type: 'number', unit: 'px', min: 1, max: 64 },
      pct('intensity', 'Intensité'),
      { key: 'color', label: 'Couleur', type: 'color' },
      { key: 'glow', label: 'Halo lumineux', type: 'checkbox' },
      { key: 'seed', label: 'Variante', type: 'number', min: 1, max: 9999, hint: 'Change ce nombre pour déplacer les éclats.' }
    ]
  };

  A.tools.register({
    id: 'effects',
    label: 'Effets de fond',
    short: 'Effets',
    icon: 'effects',
    description: 'Donne une texture au calque : reflet, dégradé, métal ou scintillement.',
    mount(body, remount) {
      const { layer, empty } = K.requireLayer(['box', 'element', 'image', 'text'], {
        message: 'Sélectionne un calque pour lui donner un effet.'
      });
      if (empty) return body.append(empty);

      const values = { type: 'none', ...(layer.effect || {}) };
      const apply = () => state.mutate(layer.id, (l) => {
        l.effect = values.type === 'none' ? null : U.clone(values);
      });

      const typeForm = A.ui.fields.form([{ key: 'type', label: 'Effet', type: 'select', options: E.TYPES }], values, () => {
        const type = values.type;
        Object.keys(values).forEach((k) => delete values[k]);
        Object.assign(values, { type, ...U.clone(E.DEFAULTS[type]) });
        apply();
        remount();
      });

      body.append(
        K.section(null, K.target(layer)),
        K.section('Effet', typeForm,
          A.ui.fields.form(SCHEMAS[values.type] || [], values, apply),
          A.ui.presetBar({
            category: 'effect',
            getData: () => U.clone(values),
            onApply: (data) => {
              Object.keys(values).forEach((k) => delete values[k]);
              Object.assign(values, { ...U.clone(E.DEFAULTS[data.type] || {}), ...data });
              apply();
              remount();
            }
          })),
        K.note('Effet et motif peuvent être utilisés ensemble. Les zones transparentes ne sont jamais remplies.')
      );
    }
  });
})(window.Arius);
