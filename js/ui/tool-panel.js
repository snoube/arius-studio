/* Barre d'outils verticale + panneau des réglages de l'outil actif. */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const { events } = A.core;
  let current = null;
  let strip;
  let panel;

  function mount() {
    const tool = A.tools.get(current);
    if (!tool || !panel) return;
    const old = panel.querySelector('.tp-body');
    const scroll = old ? old.scrollTop : 0;
    panel.innerHTML = '';
    const body = U.el('div', { class: 'tp-body' });
    panel.append(
      U.el('header', { class: 'tp-header' },
        U.el('span', { class: 'tp-icon', html: A.ui.icon(tool.icon, 22) }),
        U.el('div', null, U.el('h2', { class: 'tp-name' }, tool.label), U.el('p', { class: 'tp-desc' }, tool.description))),
      body);
    tool.mount(body, mount);
    body.scrollTop = scroll;
  }

  function show(id) {
    if (!A.tools.get(id)) return;
    current = id;
    strip.querySelectorAll('.tool-btn').forEach((b) => {
      const on = b.dataset.tool === id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    mount();
  }

  A.ui.toolPanel = {
    init() {
      strip = document.getElementById('tool-strip');
      panel = document.getElementById('tool-panel');
      strip.append(U.el('span', { class: 'strip-label' }, 'Outils'));
      A.tools.all().forEach((tool, i) => {
        const b = U.el('button', {
          type: 'button', class: 'tool-btn', dataset: { tool: tool.id }, 'aria-pressed': 'false',
          title: `${tool.label} (touche ${i + 1})`,
          html: A.ui.icon(tool.icon, 22) + `<span>${tool.short}</span>`
        });
        b.addEventListener('click', () => show(tool.id));
        strip.append(b);
      });

      events.on('selection:changed', mount);
      events.on('doc:replaced', mount);
      events.on('fonts:changed', () => current === 'text' && mount());
      events.on('doc:changed', ({ source }) => {
        if (['panel', 'drag', 'doc-name', 'layers'].includes(source)) return;
        if (panel.contains(document.activeElement)) return;
        mount();
      });
    },
    show,
    get current() { return current; },
    refresh: mount
  };
})(window.Arius);
