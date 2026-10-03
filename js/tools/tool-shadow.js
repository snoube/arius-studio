/* Outil 8 : créateur d'ombre (pas sur le fond principal). */
(function (A) {
  'use strict';

  const { state, utils: U } = A.core;
  const K = A.tools.kit;

  const DEFAULT = { enabled: true, color: '#000000', opacity: 60, blur: 8, distance: 4, direction: 'bas' };

  const SCHEMA = [
    { key: 'enabled', label: 'Ombre active', type: 'checkbox' },
    {
      key: 'direction', label: 'Position de l’ombre', type: 'select', options: [
        { value: 'bas', label: 'En dessous' },
        { value: 'haut', label: 'Au-dessus' },
        { value: 'haut-bas', label: 'Au-dessus et en dessous' },
        { value: 'droite', label: 'À droite' },
        { value: 'gauche', label: 'À gauche' },
        { value: 'gauche-droite', label: 'À gauche et à droite' },
        { value: 'bas-droite', label: 'En bas à droite' },
        { value: 'bas-gauche', label: 'En bas à gauche' },
        { value: 'autour', label: 'Tout autour (halo)' }
      ]
    },
    { key: 'distance', label: 'Distance', type: 'number', unit: 'px', min: 0, max: 512 },
    { key: 'blur', label: 'Dégradé (flou)', type: 'number', unit: 'px', min: 0, max: 256, hint: '0 = ombre nette, plus le nombre est grand plus elle est douce.' },
    { key: 'color', label: 'Couleur', type: 'color' },
    { key: 'opacity', label: 'Opacité', type: 'range', unit: '%', min: 0, max: 100 }
  ];

  A.tools.register({
    id: 'shadow',
    label: 'Créateur d’ombre',
    short: 'Ombre',
    icon: 'shadow',
    description: 'Ajoute une ombre à un élément, un texte ou un fond secondaire.',
    mount(body, remount) {
      const sel = state.selected();
      if (sel && sel.isBase) {
        return body.append(K.note('Le fond principal ne peut pas avoir d’ombre. Sélectionne un autre calque.', 'empty'));
      }
      const { layer, empty } = K.requireLayer(['box', 'element', 'image', 'text'], {
        allowBase: false,
        message: 'Sélectionne un élément, un texte ou un fond secondaire pour lui ajouter une ombre.'
      });
      if (empty) return body.append(empty);

      const values = layer.shadow ? { ...DEFAULT, ...layer.shadow } : { ...DEFAULT, enabled: false };
      const apply = () => state.mutate(layer.id, (l) => {
        l.shadow = U.clone(values);
      });

      body.append(
        K.section(null, K.target(layer)),
        K.section('Réglages',
          K.toggleForm(SCHEMA, values, apply),
          A.ui.presetBar({
            category: 'shadow',
            getData: () => ({ ...values }),
            onApply: (data) => {
              Object.assign(values, DEFAULT, data);
              apply();
              remount();
            }
          }),
          K.actions(K.button('Retirer l’ombre', {
            icon: 'trash',
            onClick: () => {
              state.mutate(layer.id, (l) => {
                l.shadow = null;
              });
              remount();
            }
          })))
      );
    }
  });
})(window.Arius);
