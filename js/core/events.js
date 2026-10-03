/* Petit bus d'événements : les modules communiquent sans dépendre les uns des autres. */
(function (A) {
  'use strict';

  const listeners = new Map();

  A.core.events = {
    on(name, fn) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(fn);
      return () => listeners.get(name).delete(fn);
    },
    emit(name, data) {
      const set = listeners.get(name);
      if (!set) return;
      [...set].forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error(`[Arius] erreur dans l'écouteur "${name}"`, err);
        }
      });
    }
  };
})(window.Arius);
