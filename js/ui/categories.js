/* Rail des catégories (le créateur d'image est la première ; d'autres pourront s'ajouter ici). */
(function (A) {
  'use strict';

  const U = A.core.utils;

  const CATEGORIES = [{ id: 'image', label: 'Créateur d’image', icon: 'image' }];

  A.ui.categories = {
    init() {
      const rail = document.getElementById('category-rail');
      rail.append(U.el('img', { class: 'rail-logo', src: 'assets/logo.png', alt: 'Arius' }));
      const list = U.el('div', { class: 'rail-list', role: 'tablist', 'aria-label': 'Catégories' });
      CATEGORIES.forEach((c, i) => {
        list.append(U.el('button', {
          type: 'button', class: 'rail-btn' + (i === 0 ? ' is-active' : ''), role: 'tab',
          'aria-selected': String(i === 0), title: c.label, 'aria-label': c.label, html: A.ui.icon(c.icon, 22)
        }));
      });
      list.append(U.el('button', { type: 'button', class: 'rail-btn is-soon', disabled: true, title: 'Prochaines catégories', 'aria-label': 'Prochaines catégories', html: A.ui.icon('plus', 18) }));
      rail.append(list);
    }
  };
})(window.Arius);
