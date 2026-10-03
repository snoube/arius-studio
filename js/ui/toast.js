/* Messages courts en bas de l'écran. */
(function (A) {
  'use strict';

  A.ui.toast = function (message, kind = 'info') {
    const host = document.getElementById('toast-host');
    if (!host) return;
    const t = A.core.utils.el('div', { class: `toast toast-${kind}`, role: kind === 'error' ? 'alert' : 'status' }, message);
    host.append(t);
    setTimeout(() => t.classList.add('is-leaving'), kind === 'error' ? 5200 : 2600);
    setTimeout(() => t.remove(), kind === 'error' ? 5600 : 3000);
  };
})(window.Arius);
