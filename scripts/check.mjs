import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = path.resolve('public');
const pages = [];
function walk(dir) { for (const entry of fs.readdirSync(dir, {withFileTypes:true})) { const file = path.join(dir, entry.name); if(entry.isDirectory()) walk(file); else if(file.endsWith('.html')) pages.push(file); } }
walk(root);
assert.equal(pages.filter(p => p.includes(path.sep + 'lessons' + path.sep)).length, 12);
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
console.log('PASS: ' + pages.length + ' HTML pages, ' + links + ' internal links, JavaScript syntax and 12 quiz answers.');
