/* Stockage local (préréglages, polices importées, sauvegarde automatique). */
(function (A) {
  'use strict';

  const PREFIX = 'arius.';

  A.core.storage = {
    read(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (err) {
        return fallback;
      }
    },
    /** Renvoie false si l'écriture a échoué (quota plein, stockage désactivé...). */
    write(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (err) {
        console.warn('[Arius] stockage impossible pour', key, err);
        return false;
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(PREFIX + key);
      } catch (err) {
        /* rien */
      }
    }
  };
})(window.Arius);
