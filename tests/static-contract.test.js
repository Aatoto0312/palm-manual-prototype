'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function indexOfId(id) {
  const index = html.indexOf('id="' + id + '"');
  assert.notEqual(index, -1, id + ' が存在する');
  return index;
}

test('PersonCoreをdiagnosisより先に読み込む', () => {
  const personCoreIndex = html.indexOf('src="person-core.js"');
  const diagnosisIndex = html.indexOf('src="diagnosis.js"');
  assert.notEqual(personCoreIndex, -1);
  assert.notEqual(diagnosisIndex, -1);
  assert.ok(personCoreIndex < diagnosisIndex);
});

test('RESULTは指定された情報優先順位で並ぶ', () => {
  const orderedIds = [
    'typePair', 'resultTitle', 'resultSummary', 'personCoreGrid',
    'combinationList', 'deepList', 'howToRead'
  ];
  const positions = orderedIds.map(indexOfId);
  assert.deepEqual(positions, positions.slice().sort((a, b) => a - b));
});

test('RESULTと共有領域に元画像を表示するimg要素がない', () => {
  const start = html.indexOf('id="screen-result"');
  const end = html.indexOf('</section>', html.indexOf('id="btnRetry"', start));
  const resultMarkup = html.slice(start, end);
  assert.doesNotMatch(resultMarkup, /<img\b/i);
  const shareStart = resultMarkup.indexOf('class="share-note"');
  assert.doesNotMatch(resultMarkup.slice(shareStart), /leftPreview|rightPreview|blob:|<img\b/i);
});

test('どう読んだ？はモックseedと将来の特徴解析を明記する', () => {
  assert.match(html, /モックシード/);
  assert.match(html, /実際の手の特徴解析は今後実装予定/);
  assert.doesNotMatch(html, /生命線.{0,12}(長い|短い)|頭脳線.{0,12}(長い|短い)|指の特徴から/);
});

test('rendererは8軸と組み合わせ解釈を結果データから描画する', () => {
  assert.match(app, /r\.coreAxes\.forEach/);
  assert.match(app, /r\.combinations\.forEach/);
  assert.match(app, /'★'\.repeat\(axis\.value\)/);
  assert.match(app, /'☆'\.repeat\(5 - axis\.value\)/);
});

test('4カテゴリの色テーマと横あふれ対策がある', () => {
  for (const category of ['direction', 'thinking', 'action', 'sense']) {
    assert.match(css, new RegExp('data-category="' + category + '"'));
  }
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /min-width:\s*0/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});

test('safe-areaとreduced-motionを維持する', () => {
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
