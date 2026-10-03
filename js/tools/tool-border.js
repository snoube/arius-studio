/*
 * Outil 2 : créateur de bordure.
 * Dessinée à l'intérieur de la forme (la taille de l'image ne change pas) et elle suit les angles.
 */
(function (A) {
  'use strict';

  const { state, utils: U } = A.core;
  const K = A.tools.kit;

  const DEFAULT = { enabled: true, width: 2, inset: 0, color: '#f4eef4', opacity: 100 };

  const SCHEMA = [
    { key: 'enabled', label: 'Bordure active', type: 'checkbox' },
    { key: 'width', label: 'Épaisseur', type: 'number', unit: 'px', min: 0, max: 512 },
    { key: 'inset', label: 'Distance du bord', type: 'number', unit: 'px', min: 0, max: 512, hint: 'Écart entre le bord de l’image et la bordure, identique partout.' },
    { key: 'color', label: 'Couleur', type: 'color' },
    { key: 'opacity', label: 'Opacité', type: 'range', unit: '%', min: 0, max: 100 }
  ];

  A.tools.register({
    id: 'border',
    label: 'Créateur de bordure',
    short: 'Bordure',
    icon: 'border',
    description: 'Ajoute une bordure à l’intérieur du fond ou de l’élément sélectionné, sans changer sa taille.',
    mount(body, remount) {
      const { layer, empty } = K.requireLayer(['box', 'element', 'image'], {
        message: 'Sélectionne un fond, un élément ou une image pour lui ajouter une bordure.'
      });
      if (empty) return body.append(empty);

      const values = layer.border ? { ...DEFAULT, ...layer.border } : { ...DEFAULT, enabled: false };
      const apply = () => state.mutate(layer.id, (l) => {
        l.border = U.clone(values);
      });

      body.append(
        K.section(null, K.target(layer)),
        K.section('Réglages',
          K.toggleForm(SCHEMA, values, apply),
          A.ui.presetBar({
            category: 'border',
            getData: () => ({ ...values }),
            onApply: (data) => {
              Object.assign(values, DEFAULT, data);
              apply();
              remount();
            }
          }),
          K.actions(K.button('Retirer la bordure', {
            icon: 'trash',
            onClick: () => {
              state.mutate(layer.id, (l) => {
                l.border = null;
              });
              remount();
            }
          }))),
        K.note('La bordure suit la forme des angles créés avec l’outil Angles.')
      );
    }
  });
})(window.Arius);
