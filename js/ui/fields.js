/*
 * Champs de formulaire générés à partir d'un schéma.
 *  - les couleurs se saisissent en hexadécimal (avec un nuancier en plus)
 *  - les dimensions se saisissent au clavier (champs numériques)
 *
 * Schéma : { key, label, type, min, max, step, unit, options, hint, show(values) }
 * types : number | range | color | select | segmented | checkbox | text | textarea
 */
(function (A) {
  'use strict';

  const U = A.core.utils;
  const F = {};
  let seq = 0;

  const clampItem = (item, n) => {
    let v = n;
    if (item.min != null) v = Math.max(item.min, v);
    if (item.max != null) v = Math.min(item.max, v);
    if (item.integer !== false && (item.step == null || item.step >= 1)) v = Math.round(v);
    return v;
  };

  function numberControl(item, value, emit, id) {
    const input = U.el('input', {
      id, type: 'number', value: value ?? '', step: item.step || 1,
      min: item.min, max: item.max, class: 'input num-input'
    });
    if (item.min == null || item.min >= 0) input.setAttribute('inputmode', 'decimal');
    input.addEventListener('input', () => {
      const n = parseFloat(String(input.value).replace(',', '.'));
      if (Number.isFinite(n)) {
        input.classList.remove('invalid');
        emit(clampItem(item, n));
      } else input.classList.add('invalid');
    });
    input.addEventListener('change', () => {
      const n = clampItem(item, U.toNumber(input.value, value ?? item.min ?? 0));
      input.value = n;
      input.classList.remove('invalid');
      emit(n);
    });
    return U.el('span', { class: 'num' }, input, item.unit ? U.el('span', { class: 'unit' }, item.unit) : null);
  }

  function rangeControl(item, value, emit, id) {
    const slider = U.el('input', { type: 'range', min: item.min ?? 0, max: item.max ?? 100, step: item.step || 1, value, class: 'slider', 'aria-label': item.label });
    const box = numberControl(item, value, (v) => {
      slider.value = v;
      emit(v);
    }, id);
    const num = box.querySelector('input');
    slider.addEventListener('input', () => {
      num.value = slider.value;
      emit(clampItem(item, parseFloat(slider.value)));
    });
    return U.el('span', { class: 'range' }, slider, box);
  }

  function colorControl(item, value, emit, id) {
    let last = U.normalizeHex(value) || '#000000';
    const swatch = U.el('input', { type: 'color', value: last, class: 'swatch', 'aria-label': 'Nuancier : ' + item.label });
    const hex = U.el('input', { id, type: 'text', value: last.toUpperCase(), maxlength: 7, spellcheck: 'false', autocomplete: 'off', class: 'input hex-input', placeholder: '#RRGGBB' });
    swatch.addEventListener('input', () => {
      last = swatch.value;
      hex.value = last.toUpperCase();
      hex.classList.remove('invalid');
      emit(last);
    });
    hex.addEventListener('input', () => {
      const h = U.normalizeHex(hex.value);
      const raw = hex.value.replace('#', '');
      if (h && (raw.length === 3 || raw.length === 6)) {
        last = h;
        swatch.value = h;
        hex.classList.remove('invalid');
        emit(h);
      } else hex.classList.add('invalid');
    });
    hex.addEventListener('blur', () => {
      hex.value = last.toUpperCase();
      hex.classList.remove('invalid');
    });
    return U.el('span', { class: 'color' }, U.el('span', { class: 'swatch-wrap' }, swatch), hex);
  }

  function selectControl(item, value, emit, id) {
    const sel = U.el('select', { id, class: 'input select' },
      (typeof item.options === 'function' ? item.options() : item.options).map((o) =>
        U.el('option', { value: o.value, selected: String(o.value) === String(value) }, o.label)));
    sel.addEventListener('change', () => emit(sel.value));
    return sel;
  }

  function segmentedControl(item, value, emit) {
    const group = U.el('span', { class: 'segmented', role: 'radiogroup', 'aria-label': item.label });
    item.options.forEach((o) => {
      const b = U.el('button', {
        type: 'button', class: 'seg' + (String(o.value) === String(value) ? ' is-on' : ''),
        role: 'radio', 'aria-checked': String(String(o.value) === String(value)), title: o.title || o.label,
        html: o.icon ? A.ui.icon(o.icon, 16) + (o.showLabel ? `<span>${o.label}</span>` : '') : o.label
      });
      b.addEventListener('click', () => {
        group.querySelectorAll('.seg').forEach((s) => {
          s.classList.remove('is-on');
          s.setAttribute('aria-checked', 'false');
        });
        b.classList.add('is-on');
        b.setAttribute('aria-checked', 'true');
        emit(o.value);
      });
      group.append(b);
    });
    return group;
  }

  function checkboxControl(item, value, emit, id) {
    const input = U.el('input', { id, type: 'checkbox', class: 'switch-input', checked: !!value });
    input.addEventListener('change', () => emit(input.checked));
    return U.el('span', { class: 'switch' }, input, U.el('span', { class: 'switch-track', 'aria-hidden': 'true' }));
  }

  function textControl(item, value, emit, id) {
    const tag = item.type === 'textarea' ? 'textarea' : 'input';
    const input = U.el(tag, { id, class: 'input' + (tag === 'textarea' ? ' textarea' : ''), rows: item.rows || 3, spellcheck: 'false', placeholder: item.placeholder || '' });
    input.value = value ?? '';
    input.addEventListener('input', () => emit(input.value));
    return input;
  }

  F.field = function (item, value, emit) {
    const id = 'f' + ++seq;
    const builders = {
      number: numberControl, range: rangeControl, color: colorControl, select: selectControl,
      segmented: segmentedControl, checkbox: checkboxControl, text: textControl, textarea: textControl
    };
    const control = (builders[item.type] || textControl)(item, value, emit, id);
    const label = item.type === 'segmented'
      ? U.el('span', { class: 'field-label' }, item.label)
      : U.el('label', { class: 'field-label', for: id }, item.label);
    const row = U.el('div', { class: `field field-${item.type}` }, label, control);
    if (item.hint) row.append(U.el('small', { class: 'field-hint' }, item.hint));
    return row;
  };

  /**
   * Formulaire complet. "values" est modifié directement, puis onChange(key, value, values) est appelé.
   */
  F.form = function (schema, values, onChange) {
    const root = U.el('div', { class: 'form' });
    const rows = [];
    const refresh = () => rows.forEach(({ item, row }) => {
      row.hidden = item.show ? !item.show(values) : false;
    });
    schema.forEach((item) => {
      const row = F.field(item, values[item.key], (v) => {
        values[item.key] = v;
        onChange(item.key, v, values);
        refresh();
      });
      rows.push({ item, row });
      root.append(row);
    });
    refresh();
    return root;
  };

  A.ui.fields = F;
})(window.Arius);
