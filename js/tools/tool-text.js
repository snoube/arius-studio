/*
 * Outil 6 : polices et texte.
 * Préréglages de style (police, taille, couleur...), import de polices .ttf / .otf / .woff,
 * puis ajout de texte sur l'image.
 */
(function (A) {
  'use strict';

  const { state, utils: U } = A.core;
  const K = A.tools.kit;

  const STYLE_SCHEMA = [
    { key: 'family', label: 'Police', type: 'select', options: () => A.fonts.list().map((f) => ({ value: f.family, label: f.label })) },
    { key: 'size', label: 'Taille du texte', type: 'number', unit: 'px', min: 4, max: 512 },
    { key: 'color', label: 'Couleur', type: 'color' },
    { key: 'opacity', label: 'Opacité', type: 'range', unit: '%', min: 0, max: 100 },
    { key: 'bold', label: 'Gras', type: 'checkbox' },
    { key: 'italic', label: 'Italique', type: 'checkbox' },
    { key: 'align', label: 'Alignement', type: 'segmented', options: [{ value: 'left', label: 'Gauche' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Droite' }] },
    { key: 'spacing', label: 'Espacement des lettres', type: 'number', unit: 'px', min: -20, max: 100 },
    { key: 'lineHeight', label: 'Interligne', type: 'number', min: 0.5, max: 4, step: 0.1, integer: false },
    { key: 'outlineWidth', label: 'Contour', type: 'number', unit: 'px', min: 0, max: 32 },
    { key: 'outlineColor', label: 'Couleur du contour', type: 'color', show: (v) => v.outlineWidth > 0 },
    { key: 'pixel', label: 'Rendu pixel net', type: 'checkbox', hint: 'Supprime le lissage : idéal avec la police Minecraft.' }
  ];

  const draft = { text: 'Arius', font: null };

  function importButton(remount, onImported) {
    const input = U.el('input', { type: 'file', accept: '.ttf,.otf,.woff,.woff2', hidden: true });
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const { family, persisted } = await A.fonts.importFile(file);
        onImported(family);
        A.ui.toast(persisted ? `Police « ${family} » importée` : `Police « ${family} » importée pour cette session (stockage plein)`, persisted ? 'info' : 'error');
        remount();
      } catch (err) {
        A.ui.toast('Police illisible : choisis un fichier .ttf, .otf, .woff ou .woff2.', 'error');
      }
    });
    const b = K.button('Importer une police', { icon: 'upload', onClick: () => input.click() });
    return U.el('span', null, b, input);
  }

  A.tools.register({
    id: 'text',
    label: 'Polices et texte',
    short: 'Texte',
    icon: 'text',
    description: 'Crée des styles de texte réutilisables et écris sur l’image.',
    mount(body, remount) {
      const sel = state.selected();
      const editing = sel && sel.type === 'text';
      if (!draft.font) draft.font = U.clone(state.DEFAULT_FONT);

      const style = editing ? { ...state.DEFAULT_FONT, ...U.clone(sel.font) } : draft.font;
      const content = { text: editing ? sel.text : draft.text };

      const apply = () => {
        if (!editing) return;
        state.mutate(sel.id, (l) => {
          l.font = U.clone(style);
          l.text = content.text;
        });
      };

      const add = () => {
        const layer = state.createLayer('text', { name: 'Texte : ' + (content.text.split('\n')[0].slice(0, 18) || 'vide'), text: content.text, font: U.clone(style) });
        layer.x = Math.round(state.width / 2 - style.size * 1.5);
        layer.y = Math.round(state.height / 2 - style.size);
        state.add(layer);
        A.ui.toast('Texte ajouté : glisse-le sur l’image pour le placer');
      };

      body.append(
        ...(editing ? [K.section(null, K.target(sel))] : []),
        K.section('Texte',
          A.ui.fields.form([{ key: 'text', label: 'Contenu', type: 'textarea', rows: 3 }], content, () => {
            if (editing) apply();
            else draft.text = content.text;
          }),
          K.actions(K.button(editing ? 'Ajouter un autre texte' : 'Ajouter le texte', { primary: true, icon: 'plus', onClick: add }))),
        K.section('Style de police',
          A.ui.fields.form(STYLE_SCHEMA, style, apply),
          A.ui.presetBar({
            category: 'font',
            label: 'Préréglages de police',
            getData: () => U.clone(style),
            onApply: (data) => {
              Object.assign(style, state.DEFAULT_FONT, data);
              apply();
              remount();
            }
          }),
          K.actions(importButton(remount, (family) => {
            style.family = family;
            apply();
          })),
          K.note('Polices intégrées : Minecraft (Monocraft, licence libre OFL) et les polices classiques. Les autres polices s’ajoutent avec « Importer une police ».'))
      );
    }
  });
})(window.Arius);
