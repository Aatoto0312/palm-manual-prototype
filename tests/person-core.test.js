'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const personCore = require(path.join(projectRoot, 'person-core.js'));

const AXES = [
  'core', 'path', 'curiosity', 'connection',
  'ignition', 'persistence', 'sensor', 'depth'
];

const REQUIRED_COMBINATIONS = [
  'core_path',
  'curiosity_path',
  'curiosity_persistence',
  'connection_depth',
  'ignition_persistence',
  'core_sensor',
  'curiosity_connection',
  'ignition_depth'
];

const fixture = {
  name: 'ミナト',
  leftFileName: 'left-hand.jpg',
  leftSize: 123456,
  rightFileName: 'right-hand.jpg',
  rightSize: 234567
};

test('同じ5入力から同じseedとPersonCoreを生成する', () => {
  const seedA = personCore.buildSeed(fixture);
  const seedB = personCore.buildSeed({ ...fixture });
  assert.equal(seedA, seedB);
  assert.deepEqual(
    personCore.generatePersonCore(seedA),
    personCore.generatePersonCore(seedB)
  );
});

test('ファイルサイズが変わればseedが変わる', () => {
  const changed = { ...fixture, rightSize: fixture.rightSize + 1 };
  assert.notEqual(personCore.buildSeed(fixture), personCore.buildSeed(changed));
});

test('PersonCoreは8軸をすべて整数1〜5で返す', () => {
  const gen = personCore.generatePersonCore(personCore.buildSeed(fixture));
  const core = gen.display;
  assert.deepEqual(Object.keys(core), AXES);
  for (const axis of AXES) {
    assert.equal(Number.isInteger(core[axis]), true, axis);
    assert.ok(core[axis] >= 1 && core[axis] <= 5, axis);
  }
});

test('平均への補正をせず複数の1や5を含む尖った結果を生成できる', () => {
  let found = null;
  for (let seed = 0; seed < 10000; seed += 1) {
    const gen = personCore.generatePersonCore(seed);
    const values = Object.values(gen.display);
    const extremes = values.filter((value) => value === 1 || value === 5);
    if (extremes.length >= 3) {
      found = values;
      break;
    }
  }
  assert.ok(found, '3軸以上が1または5になるseedが存在する');
});

test('指定された8組をAIへ渡せる構造で解釈する', () => {
  const core = {
    core: 5, path: 5, curiosity: 4, connection: 2,
    ignition: 1, persistence: 5, sensor: 3, depth: 4
  };
  const interpretations = personCore.interpretCombinations(core);
  assert.deepEqual(interpretations.map((item) => item.id), REQUIRED_COMBINATIONS);
  for (const item of interpretations) {
    assert.equal(item.axes.length, 2);
    assert.equal(item.levels.length, 2);
    assert.ok(item.headline.length > 0);
    assert.ok(item.text.length > 0);
    assert.ok(Array.isArray(item.tags));
  }
  assert.match(
    interpretations.find((item) => item.id === 'ignition_persistence').headline,
    /始動は慎重.*長く続く/
  );
});

test('6属性を採点しPrimaryとSecondaryを必ず分ける', () => {
  const core = {
    core: 3, path: 3, curiosity: 3, connection: 3,
    ignition: 3, persistence: 3, sensor: 3, depth: 3
  };
  const result = personCore.calculateTypeScores(core);
  assert.deepEqual(Object.keys(result.scores), ['WIND', 'PRISM', 'TIDE', 'ROOT', 'FORGE', 'VEIL']);
  assert.notEqual(result.primaryId, result.secondaryId);
  assert.equal(result.ranking.length, 6);
});

test('結果データはPersonCore中心の表示契約を満たす', () => {
  const result = personCore.buildResultData(fixture);
  assert.deepEqual(Object.keys(result.personCore), AXES);
  assert.equal(result.coreAxes.length, 8);
  assert.equal(result.categories.length, 4);
  assert.equal(result.combinations.length, 8);
  assert.notEqual(result.primary.id, result.secondary.id);
  assert.ok(result.title.length > 0);
  assert.ok(result.summary.length > 0);
  assert.deepEqual(Object.keys(result.deep), [
    'overview', 'thinking', 'action', 'relations',
    'bug', 'restart', 'misread', 'hidden'
  ]);
  assert.match(result.howToRead, /モックシード/);
  assert.doesNotMatch(result.howToRead, /生命線|頭脳線|指の特徴/);
});

test('PalmDiagnosisの入口は結果データと旧20パターンを保持する', () => {
  const context = vm.createContext({ console });
  context.window = context;
  context.globalThis = context;
  for (const file of ['types.js', 'person-core.js', 'diagnosis.js']) {
    vm.runInContext(fs.readFileSync(path.join(projectRoot, file), 'utf8'), context, {
      filename: file
    });
  }
  const result = context.PalmDiagnosis.diagnose(fixture);
  assert.equal(result.version, '0.4');
  assert.equal(Object.keys(result.personCore).length, 8);
  assert.equal(context.PalmDiagnosis.RESULT_PATTERNS.length, 20);
  assert.equal(context.PalmDiagnosis.buildSeed(fixture), personCore.buildSeed(fixture));
});
