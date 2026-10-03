/* Démarrage de l'application. */
(function (A) {
  'use strict';

  const { state } = A.core;

  async function start() {
    await A.fonts.init();

    if (!A.ui.project.restoreAutosave()) {
      state.newDocument({ width: 300, height: 200, color: '#14121f', opacity: 100, name: 'Sans titre' });
    }

    A.ui.categories.init();
    A.ui.topbar.init();
    A.ui.toolPanel.init();
    A.ui.stage.init();
    A.ui.layersPanel.init();
    A.ui.propertiesPanel.init();
    A.ui.shortcuts.init();
    A.ui.mobile.init();
    A.ui.project.initAutosave();

    A.ui.toolPanel.show('background');
    requestAnimationFrame(() => A.ui.stage.fit());
    document.body.classList.add('is-ready');
  }

  window.addEventListener('DOMContentLoaded', () => {
    start().catch((err) => {
      console.error(err);
      document.body.innerHTML = '<p style="color:#fff;font:16px sans-serif;padding:24px">Arius Studio n’a pas pu démarrer : ' + err.message + '</p>';
    });
  });
})(window.Arius);
