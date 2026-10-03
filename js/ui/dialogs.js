/* Fenêtres modales : demande de texte, confirmation, contenu libre. */
(function (A) {
  'use strict';

  const U = A.core.utils;

  function open({ title, body, actions = [], onClose }) {
    const host = document.getElementById('dialog-host');
    const previous = document.activeElement;
    const box = U.el('div', { class: 'dialog framed notch', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      U.el('h2', { class: 'dialog-title' }, title),
      U.el('div', { class: 'dialog-body' }, body));
    const footer = U.el('div', { class: 'dialog-actions' });
    const backdrop = U.el('div', { class: 'dialog-backdrop' }, box);

    let closed = false;
    const close = (result) => {
      if (closed) return;
      closed = true;
      backdrop.remove();
      document.removeEventListener('keydown', onKey, true);
      if (previous && previous.focus) previous.focus();
      if (onClose) onClose(result);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(null);
      }
    };

    actions.forEach((a) => {
      const b = U.el('button', { type: 'button', class: 'btn framed notch' + (a.primary ? ' btn-primary' : '') + (a.danger ? ' btn-danger' : '') }, a.label);
      b.addEventListener('click', () => a.onClick(close));
      footer.append(b);
    });
    box.append(footer);
    backdrop.addEventListener('mousedown', (e) => {
      if (e.target === backdrop) close(null);
    });
    document.addEventListener('keydown', onKey, true);
    host.append(backdrop);
    const first = box.querySelector('input, select, textarea, button.btn-primary, button');
    if (first) setTimeout(() => first.focus(), 0);
    return { close, box };
  }

  A.ui.dialogs = {
    open,

    prompt({ title, label, value = '', okLabel = 'Valider' }) {
      return new Promise((resolve) => {
        const input = U.el('input', { class: 'input', type: 'text', value, spellcheck: 'false' });
        const body = U.el('label', { class: 'dialog-field' }, U.el('span', { class: 'field-label' }, label), input);
        const d = open({
          title, body, onClose: resolve,
          actions: [
            { label: 'Annuler', onClick: (close) => close(null) },
            { label: okLabel, primary: true, onClick: (close) => close(input.value.trim() || null) }
          ]
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') d.close(input.value.trim() || null);
        });
        setTimeout(() => input.select(), 0);
      });
    },

    confirm({ title, message, okLabel = 'Confirmer', danger = false }) {
      return new Promise((resolve) => {
        open({
          title, body: U.el('p', { class: 'dialog-text' }, message), onClose: (r) => resolve(!!r),
          actions: [
            { label: 'Annuler', onClick: (close) => close(false) },
            { label: okLabel, primary: !danger, danger, onClick: (close) => close(true) }
          ]
        });
      });
    }
  };
})(window.Arius);
