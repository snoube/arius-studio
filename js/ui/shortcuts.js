/* Raccourcis clavier et collage d'images depuis le presse-papiers. */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const { state, events } = A.core;

  function copy() {
    if (state.copy(state.selectedId)) {
      events.emit('clipboard:changed');
      A.ui.toast('Calque copié');
    }
  }

  function nudge(dx, dy) {
    const l = state.selected();
    if (!l || l.isBase || l.locked) return;
    state.mutate(l.id, (layer) => {
      layer.x += dx;
      layer.y += dy;
    }, { source: 'drag' });
  }

  function onKey(e) {
    const mod = e.ctrlKey || e.metaKey;
    const typing = U.isTyping(e.target);
    const k = e.key.toLowerCase();

    if (mod && k === 's') {
      e.preventDefault();
      return A.ui.project.saveProject();
    }
    if (mod && k === 'o') {
      e.preventDefault();
      return A.ui.project.openProject();
    }
    if (mod && k === 'e') {
      e.preventDefault();
      return A.ui.exporter.open();
    }
    if (typing || document.querySelector('.dialog-backdrop')) return;

    if (mod && k === 'z' && !e.shiftKey) {
      e.preventDefault();
      return state.undo();
    }
    if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) {
      e.preventDefault();
      return state.redo();
    }
    if (mod && k === 'c') return copy();
    if (mod && k === 'd') {
      e.preventDefault();
      return state.duplicate(state.selectedId);
    }
    if (mod) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      return state.remove(state.selectedId);
    }
    const step = e.shiftKey ? 10 : 1;
    const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (arrows[e.key]) {
      e.preventDefault();
      return nudge(...arrows[e.key]);
    }
    if (e.key === '+' || e.key === '=') return A.ui.stage.zoomIn();
    if (e.key === '-') return A.ui.stage.zoomOut();
    if (e.key === '0') return A.ui.stage.fit();
    if (/^[1-8]$/.test(e.key)) {
      const tool = A.tools.all()[+e.key - 1];
      if (tool) A.ui.toolPanel.show(tool.id);
    }
  }

  // Ctrl+V : une image du presse-papiers devient un calque, sinon on colle le calque copié
  function onPaste(e) {
    if (U.isTyping(e.target) || document.querySelector('.dialog-backdrop')) return;
    const file = [...(e.clipboardData ? e.clipboardData.files : [])].find((f) => f.type.startsWith('image/'));
    e.preventDefault();
    if (file) return A.ui.project.importImage(file);
    if (state.paste()) A.ui.toast('Calque collé');
  }

  A.ui.shortcuts = {
    copy,
    init() {
      window.addEventListener('keydown', onKey);
      document.addEventListener('paste', onPaste);
      // touche Ctrl+V sans événement "paste" (certains navigateurs hors champ texte)
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && !U.isTyping(e.target) && !document.querySelector('.dialog-backdrop')) {
          pasteFallback = setTimeout(() => {
            if (state.paste()) A.ui.toast('Calque collé');
          }, 60);
        }
      });
      document.addEventListener('paste', () => clearTimeout(pasteFallback), true);
    }
  };
  let pasteFallback = null;
})(window.Arius);
