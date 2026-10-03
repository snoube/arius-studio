/* Briques communes aux panneaux d'outils + registre des outils. */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const list = [];

  A.tools.register = (tool) => list.push(tool);
  A.tools.all = () => list;
  A.tools.get = (id) => list.find((t) => t.id === id) || null;

  A.tools.kit = {
    section(title, ...children) {
      return U.el('section', { class: 'tp-section' }, title ? U.el('h3', { class: 'tp-title' }, title) : null, ...children);
    },

    note(text, kind = '') {
      return U.el('p', { class: 'tp-note' + (kind ? ' tp-note-' + kind : '') }, text);
    },

    target(layer) {
      return U.el('div', { class: 'tp-target' }, U.el('span', null, 'Calque visé'), U.el('strong', null, layer.name));
    },

    button(label, { primary = false, danger = false, icon, onClick, title } = {}) {
      const b = U.el('button', {
        type: 'button', title,
        class: 'btn framed notch' + (primary ? ' btn-primary' : '') + (danger ? ' btn-danger' : ''),
        html: (icon ? A.ui.icon(icon, 16) : '') + `<span>${label}</span>`
      });
      if (onClick) b.addEventListener('click', onClick);
      return b;
    },

    /**
     * Formulaire avec un interrupteur "enabled" : tant que le calque n'a pas ce réglage,
     * l'interrupteur est éteint ; modifier un autre champ l'allume automatiquement.
     */
    toggleForm(schema, values, apply) {
      const form = A.ui.fields.form(schema, values, (key) => {
        if (key !== 'enabled' && !values.enabled) {
          values.enabled = true;
          const sw = form.querySelector('.switch-input');
          if (sw) sw.checked = true;
        }
        apply();
      });
      return form;
    },

    actions(...buttons) {
      return U.el('div', { class: 'tp-actions' }, ...buttons);
    },

    /** Un calque compatible est sélectionné ? Sinon renvoie un message à afficher. */
    requireLayer(types, { allowBase = true, message } = {}) {
      const layer = A.core.state.selected();
      if (layer && types.includes(layer.type) && (allowBase || !layer.isBase)) return { layer };
      return { empty: A.tools.kit.note(message || 'Sélectionne un calque compatible dans la liste des calques ou sur l’image.', 'empty') };
    }
  };
})(window.Arius);
