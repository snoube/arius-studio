/*
 * Disposition téléphone (Samsung S21 et autres) :
 *  - portrait : barre du haut, image, panneau qui monte depuis le bas, barre d'outils en bas
 *  - paysage : barre d'outils à gauche, image au centre, panneau à droite
 * Toucher un outil ouvre ses réglages ; le bouton « Calques » ouvre calques et propriétés.
 * Le geste ou bouton « retour » d'Android ferme le panneau au lieu de quitter l'application.
 *
 * La disposition est choisie selon la taille de l'écran : rien à régler. Sur ordinateur, ce fichier ne fait rien.
 */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const { events } = A.core;

  // Même règle que dans css/mobile.css (classe .m sur <html>).
  const PHONE = window.matchMedia('(max-width: 900px), (pointer: coarse) and (max-height: 520px)');
  const LANDSCAPE = window.matchMedia('(orientation: landscape)');

  const root = document.documentElement;
  let mode = null;          // null | 'tool' | 'side'
  let full = false;         // panneau agrandi
  let sideTab = 'layers';   // 'layers' | 'props'
  let els = {};
  let historyPushed = false;

  const isPhone = () => root.classList.contains('m');

  function applyLayout() {
    const was = isPhone();
    root.classList.toggle('m', PHONE.matches);
    root.classList.toggle('m-land', PHONE.matches && LANDSCAPE.matches);
    if (was && !PHONE.matches) close();
    refit();
  }

  /** Réajuste l'image quand la place change, sauf si l'utilisateur a zoomé lui-même. */
  const refit = U.debounce(() => {
    if (A.ui.stage && A.ui.stage.isFitted) A.ui.stage.fit();
  }, 260);

  function syncClasses() {
    root.classList.toggle('sheet-tool', mode === 'tool');
    root.classList.toggle('sheet-side', mode === 'side');
    root.classList.toggle('sheet-full', !!mode && full);
    root.classList.toggle('side-props', sideTab === 'props');
    els.layersBtn.classList.toggle('is-active', mode === 'side');
    els.layersBtn.setAttribute('aria-pressed', String(mode === 'side'));
    els.size.innerHTML = A.ui.icon(full ? 'collapse' : 'expand', 18);
    els.size.setAttribute('aria-label', full ? 'Réduire le panneau' : 'Agrandir le panneau');
    els.size.title = els.size.getAttribute('aria-label');
    els.tabs.hidden = mode !== 'side';
    els.title.hidden = mode !== 'tool';
    if (mode === 'tool') {
      const tool = A.tools.get(A.ui.toolPanel.current);
      els.title.textContent = tool ? tool.label : '';
    }
    els.tabs.querySelectorAll('.seg').forEach((b) => {
      const on = b.dataset.tab === sideTab;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', String(on));
    });
    // la barre d'outils ne montre l'outil actif que quand ses réglages sont ouverts
    root.classList.toggle('tool-open', mode === 'tool');
  }

  function open(next) {
    if (!isPhone()) return;
    const wasClosed = !mode;
    mode = next;
    syncClasses();
    if (wasClosed) {
      // une entrée d'historique : le « retour » d'Android fermera le panneau
      try {
        history.pushState({ ariusSheet: true }, '');
        historyPushed = true;
      } catch (err) { /* page ouverte en fichier local : pas d'historique */ }
    }
    refit();
  }

  function close({ fromHistory = false } = {}) {
    if (!mode) return;
    mode = null;
    full = false;
    syncClasses();
    if (historyPushed && !fromHistory) {
      historyPushed = false;
      history.back();
    } else historyPushed = false;
    if (document.activeElement && els.sheet.contains(document.activeElement)) document.activeElement.blur();
    refit();
  }

  function setFull(v) {
    full = v;
    syncClasses();
    refit();
  }

  /* Poignée : glisser vers le haut = agrandir, vers le bas = réduire puis fermer, toucher = basculer. */
  function initGrip() {
    let start = null;
    els.handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      start = { y: e.clientY, x: e.clientX };
      els.handle.setPointerCapture(e.pointerId);
    });
    els.handle.addEventListener('pointerup', (e) => {
      if (!start) return;
      const dy = e.clientY - start.y;
      start = null;
      const landscape = root.classList.contains('m-land');
      if (Math.abs(dy) < 8) {
        if (!landscape) setFull(!full);
      } else if (dy < -40 && !landscape) setFull(true);
      else if (dy > 40) {
        if (full && !landscape) setFull(false);
        else close();
      }
    });
    els.handle.addEventListener('pointercancel', () => {
      start = null;
    });
  }

  function buildGrip() {
    const grip = document.getElementById('sheet-grip');
    els.sheet = document.getElementById('sheet');
    els.title = U.el('span', { class: 'grip-title' });
    els.tabs = U.el('span', { class: 'segmented grip-tabs', role: 'radiogroup', 'aria-label': 'Panneau' });
    [['layers', 'Calques'], ['props', 'Propriétés']].forEach(([id, label]) => {
      const b = U.el('button', { type: 'button', class: 'seg', role: 'radio', dataset: { tab: id } }, label);
      b.addEventListener('click', () => {
        sideTab = id;
        syncClasses();
      });
      els.tabs.append(b);
    });
    els.size = U.el('button', { type: 'button', class: 'icon-btn framed notch grip-size' });
    els.size.addEventListener('click', () => setFull(!full));
    const closeBtn = U.el('button', { type: 'button', class: 'icon-btn framed notch', title: 'Fermer', 'aria-label': 'Fermer le panneau', html: A.ui.icon('close', 18) });
    closeBtn.addEventListener('click', () => close());
    els.handle = U.el('div', { class: 'grip-handle' }, U.el('span', { class: 'grip-bar', 'aria-hidden': 'true' }));
    grip.append(els.handle, U.el('div', { class: 'grip-row' }, els.title, els.tabs, U.el('span', { class: 'grip-actions' }, els.size, closeBtn)));
    initGrip();
  }

  function buildLayersButton() {
    const strip = document.getElementById('tool-strip');
    els.layersBtn = U.el('button', {
      type: 'button', class: 'tool-btn layers-btn mobile-only', 'aria-pressed': 'false', title: 'Calques et propriétés',
      html: A.ui.icon('layers', 22) + '<span>Calques</span>'
    });
    els.layersBtn.addEventListener('click', () => {
      if (mode === 'side') close();
      else open('side');
    });
    strip.append(els.layersBtn);

    // Toucher un outil : ouvre ses réglages ; toucher l'outil déjà ouvert : referme.
    let wasOpenTool = null;
    strip.addEventListener('click', (e) => {
      const b = e.target.closest('.tool-btn[data-tool]');
      wasOpenTool = b && mode === 'tool' && b.classList.contains('is-active') ? b.dataset.tool : null;
    }, true);
    strip.addEventListener('click', (e) => {
      const b = e.target.closest('.tool-btn[data-tool]');
      if (!b || !isPhone()) return;
      if (wasOpenTool === b.dataset.tool) close();
      else open('tool');
      syncClasses();
    });
  }

  A.ui.mobile = {
    init() {
      buildGrip();
      buildLayersButton();
      applyLayout();
      syncClasses();

      PHONE.addEventListener('change', applyLayout);
      LANDSCAPE.addEventListener('change', applyLayout);
      window.addEventListener('resize', refit);

      window.addEventListener('popstate', () => {
        if (mode) close({ fromHistory: true });
      });
      // les panneaux se reconstruisent : le titre de l'outil doit suivre
      events.on('doc:replaced', syncClasses);

      registerServiceWorker();
    },
    open,
    close,
    get isPhone() { return isPhone(); }
  };

  /* Application installable et utilisable hors ligne, seulement quand la page est servie par un site (https). */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('[Arius] mode hors ligne indisponible', err));
  }
})(window.Arius);
