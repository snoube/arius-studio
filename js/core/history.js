/* Historique annuler / rétablir (instantanés JSON du document). */
(function (A) {
  'use strict';

  const LIMIT = 80;
  let stack = [];
  let index = -1;

  const notify = () => A.core.events.emit('history:changed');

  A.core.history = {
    reset(snapshot) {
      stack = [snapshot];
      index = 0;
      notify();
    },
    push(snapshot) {
      if (stack[index] === snapshot) return;
      stack = stack.slice(0, index + 1);
      stack.push(snapshot);
      if (stack.length > LIMIT) stack.shift();
      index = stack.length - 1;
      notify();
    },
    undo() {
      if (index <= 0) return null;
      index -= 1;
      notify();
      return stack[index];
    },
    redo() {
      if (index >= stack.length - 1) return null;
      index += 1;
      notify();
      return stack[index];
    },
    canUndo: () => index > 0,
    canRedo: () => index < stack.length - 1
  };
})(window.Arius);
