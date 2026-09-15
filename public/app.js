'use strict';
(() => {
  const ids = ["docs-4","ui-4","docs-1","ui-1","drawing-1","cad-1","docs-5","ui-5","docs-2","ui-6","docs-6","ui-7","drawing-2","cad-2","docs-7","ui-2","ui-3","docs-8","docs-3","drawing-3","ui-8","cad-3"];
  const key = 'dadakhaev-study-progress-v1';
  let completed = new Set();
  let storageOk = true;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || '[]');
      completed = new Set(Array.isArray(raw) ? raw.filter(id => ids.includes(id)) : []);
    } catch (_) { storageOk = false; completed = new Set(); }
  }
  function persist() {
    try { localStorage.setItem(key, JSON.stringify([...completed])); storageOk = true; }
    catch (_) { storageOk = false; }
    renderProgress();
  }
  function renderProgress() {
    const count = completed.size;
    if ($('#progress-percent')) $('#progress-percent').textContent = Math.round(count / ids.length * 100) + '%';
    if ($('#progress-bar')) $('#progress-bar').value = count;
    if ($('#progress-text')) $('#progress-text').textContent = 'Изучено ' + count + ' из ' + ids.length + ' тем';
    $$('[data-completed]').forEach(el => { el.hidden = !completed.has(el.dataset.completed); });
    const lesson = $('[data-lesson]')?.dataset.lesson;
    const button = $('#complete-lesson');
    if (button) {
      const done = completed.has(lesson);
      button.textContent = done ? '✓ Изучено — снять отметку' : 'Отметить изученным';
      button.setAttribute('aria-pressed', String(done));
    }
    const message = storageOk ? '' : 'Браузер не разрешает сохранение: отметки доступны только до закрытия страницы.';
    ['#storage-status', '#lesson-storage-status'].forEach(id => { if ($(id)) $(id).textContent = message; });
  }
  read(); renderProgress();
  $('#complete-lesson')?.addEventListener('click', () => {
    const id = $('[data-lesson]').dataset.lesson;
    if (!ids.includes(id)) return;
    completed.has(id) ? completed.delete(id) : completed.add(id);
    persist();
  });
  $('#reset-progress')?.addEventListener('click', () => {
    if (completed.size && !window.confirm('Сбросить отметки об изучении всех тем в этом браузере?')) return;
    completed.clear(); persist();
  });
  window.addEventListener('storage', e => { if (e.key === key || e.key === null) { read(); renderProgress(); } });
  window.addEventListener('pageshow', () => { read(); renderProgress(); });
  let course = 'all';
  const cards = $$('.material');
  const normalize = value => value.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
  function filter() {
    const query = normalize($('#search')?.value || '');
    const level = $('#level')?.value || '';
    const month = $('#study-month')?.value || '';
    let count = 0;
    cards.forEach(card => {
      const visible = (course === 'all' || card.dataset.course === course)
        && (!level || card.dataset.level === level)
        && (!month || card.dataset.studyDate?.startsWith(month))
        && normalize(card.dataset.search).includes(query);
      card.hidden = !visible;
      if (visible) count++;
    });
    if ($('#result-count')) $('#result-count').textContent = 'Найдено материалов: ' + count;
    if ($('#empty')) $('#empty').hidden = count !== 0;
    $$('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === course)));
  }
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => { course = button.dataset.filter; filter(); }));
  $$('[data-course-link]').forEach(link => link.addEventListener('click', () => {
    course = link.dataset.courseLink;
    if ($('#search')) $('#search').value = '';
    if ($('#level')) $('#level').value = '';
    if ($('#study-month')) $('#study-month').value = '';
    filter();
  }));
  $('#search')?.addEventListener('input', filter);
  $('#level')?.addEventListener('change', filter);
  $('#study-month')?.addEventListener('change', filter);
  $$('.quiz').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const selected = form.querySelector('input[name="answer"]:checked');
    if (!selected) return;
    const correct = selected.value === form.dataset.correct;
    form.querySelector('.quiz-result').textContent = (correct ? 'Верно. ' : 'Пока неверно. ') + form.dataset.explanation;
  }));
  $('#print-lesson')?.addEventListener('click', () => { $$('details').forEach(d => { d.open = true; }); window.print(); });
  $('#feedback-form')?.addEventListener('submit', event => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const title = $('#feedback-title').value.trim();
    const message = $('#feedback-message').value.trim();
    if (!title || message.length < 10) {
      $('#feedback-message').setCustomValidity('Опишите вопрос: не менее 10 символов без пробелов по краям.');
      $('#feedback-message').reportValidity(); return;
    }
    const topic = $('#feedback-topic').value;
    const params = new URLSearchParams({title: '[' + topic + '] ' + title, body: 'Направление: ' + topic + '\n\n' + message + '\n\nМатериал или шаг, который вызывает вопрос:\n'});
    window.location.assign('https://github.com/kxetame/dadakhaev-teacher/issues/new?' + params.toString());
  });
  $('#feedback-message')?.addEventListener('input', e => e.target.setCustomValidity(''));
})();
