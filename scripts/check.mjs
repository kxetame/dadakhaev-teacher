import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = path.resolve('public');
const pages = [];
function walk(dir) { for (const entry of fs.readdirSync(dir, {withFileTypes:true})) { const file = path.join(dir, entry.name); if(entry.isDirectory()) walk(file); else if(file.endsWith('.html')) pages.push(file); } }
walk(root);
assert.equal(pages.filter(p => p.includes(path.sep + 'lessons' + path.sep)).length, 22);
new vm.Script(fs.readFileSync('public/app.js','utf8'));
let links = 0;
for (const file of pages) {
  const html = fs.readFileSync(file,'utf8');
  assert.match(html, /<html lang="ru">/);
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1, file + ': exactly one h1');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size, ids.length, file + ': duplicate ids');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replaceAll('&amp;', '&');
    if (/^(https?:|data:|mailto:)/.test(href)) continue;
    const [relative, hash] = href.split('#');
    const target = relative ? path.resolve(path.dirname(file), relative) : file;
    assert.ok(target.startsWith(root + path.sep), 'Link outside public: ' + href);
    assert.ok(fs.existsSync(target), file + ': missing ' + href);
    if(hash && target.endsWith('.html')) assert.ok(fs.readFileSync(target,'utf8').includes('id="' + hash + '"'), 'Missing anchor ' + href);
    links++;
  }
}
const lessons=JSON.parse(fs.readFileSync('content/lessons.json','utf8'));
for(const lesson of lessons) {
  assert.ok(lesson.quiz.correct >= 0 && lesson.quiz.correct < lesson.quiz.options.length);
  const html=fs.readFileSync('public/lessons/' + lesson.id + '.html','utf8');
  assert.ok(html.includes('data-correct="' + lesson.quiz.correct + '"'));
  assert.ok(html.includes(lesson.title));
}
console.log('PASS: ' + pages.length + ' HTML pages, ' + links + ' internal links, JavaScript syntax and 22 quiz answers.');

assert.equal(lessons.length, 22);
assert.equal(new Set(lessons.map(l=>l.id)).size, 22);
for (const [course, expected] of Object.entries({drawing:3,cad:3,docs:8,ui:8})) {
  const group=lessons.filter(l=>l.course===course);
  assert.equal(group.length, expected);
  const lower=['drawing','cad'].includes(course)?'2026-01-12':'2025-11-15';
  for(const lesson of group) {
    assert.ok(lesson.studyDate>=lower && lesson.studyDate<='2026-07-31', lesson.id+': study period');
    assert.ok(['2026-09-14','2026-09-15'].includes(lesson.publishedDate));
    const html=fs.readFileSync('public/lessons/'+lesson.id+'.html','utf8');
    assert.ok(html.includes('class="study-date" datetime="'+lesson.studyDate+'"'));
    assert.ok(html.includes('Публикация на сайте: <time datetime="'+lesson.publishedDate+'"'));
    assert.equal((html.match(/class="nav-date"/g)||[]).length,expected);
  }
}
const index=fs.readFileSync('public/index.html','utf8');
const cardDates=[...index.matchAll(/data-study-date="([^"]+)"/g)].map(m=>m[1]);
assert.equal(cardDates.length,22);
assert.deepEqual(cardDates,[...cardDates].sort());
assert.ok(index.includes('max="22"'));
assert.ok(index.includes('Учебные материалы за 2025–2026 учебный год'));
console.log('PASS: 22 study dates, period boundaries, distinct publication dates, course counts and chronological catalogue.');
