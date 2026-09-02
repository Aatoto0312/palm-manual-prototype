'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const worldCore = require(path.join(root, 'world-core.js'));

const AXES = [
  'core', 'path', 'curiosity', 'connection',
  'ignition', 'persistence', 'sensor', 'depth'
];

const baseCore = {
  core: 3, path: 3, curiosity: 3, connection: 3,
  ignition: 3, persistence: 3, sensor: 3, depth: 3
};

const combinations = [
  { id: 'core_path', label: '芯 × 道', headline: '中心と道', text: '中心へ複数の道を作ります。', values: [5, 4] },
  { id: 'curiosity_path', label: '好奇心 × 道', headline: '発見の道', text: '発見へ向かう道を探します。', values: [4, 4] },
  { id: 'connection_depth', label: 'つながり × 深さ', headline: '奥でつながる', text: '深い場所で領域をつなぎます。', values: [4, 5] }
];

test('VisualProfileは指定特徴量を0〜1で返し、同じ入力で決定的である', () => {
  const first = worldCore.buildVisualProfile(baseCore);
  const second = worldCore.buildVisualProfile({ ...baseCore });
  assert.deepEqual(first, second);
  const required = [
    'openness', 'branching', 'destinationClarity', 'connectivity',
    'motion', 'persistence', 'sensitivity', 'depth', 'complexity',
    'warmth', 'mystery', 'socialDensity', 'natureUrbanBlend', 'verticality'
  ];
  assert.deepEqual(Object.keys(first), required);
  for (const [key, value] of Object.entries(first)) {
    assert.equal(typeof value, 'number', key);
    assert.ok(value >= 0 && value <= 1, key + ':' + value);
  }
});

test('PersonCoreの全8軸がVisualProfileへ寄与する', () => {
  const baseline = worldCore.buildVisualProfile(baseCore);
  for (const axis of AXES) {
    const changed = { ...baseCore, [axis]: 5 };
    assert.notDeepEqual(worldCore.buildVisualProfile(changed), baseline, axis);
  }
});

test('同じPersonCoreと属性から同じWorldSpecを生成する', () => {
  const profile = worldCore.buildVisualProfile({
    core: 5, path: 4, curiosity: 5, connection: 2,
    ignition: 1, persistence: 4, sensor: 3, depth: 5
  });
  const first = worldCore.buildWorldSpec(profile, 'WIND', 'VEIL', combinations);
  const second = worldCore.buildWorldSpec(profile, 'WIND', 'VEIL', combinations);
  assert.deepEqual(first, second);
  assert.ok(first.title.length > 0);
  assert.ok(first.tagline.length > 0);
  assert.ok(first.summary.length > 0);
  assert.ok(first.imagePrompt.length > 80);
  assert.ok(first.reasoning.length >= 3);
});

test('PrimaryとSecondaryはWorldSpecの美術方向へ反映される', () => {
  const profile = worldCore.buildVisualProfile(baseCore);
  const windVeil = worldCore.buildWorldSpec(profile, 'WIND', 'VEIL', combinations);
  const forgeRoot = worldCore.buildWorldSpec(profile, 'FORGE', 'ROOT', combinations);
  assert.deepEqual(windVeil.affinities, { primary: 'WIND', secondary: 'VEIL' });
  assert.deepEqual(forgeRoot.affinities, { primary: 'FORGE', secondary: 'ROOT' });
  assert.notDeepEqual(windVeil.motifs, forgeRoot.motifs);
  assert.notEqual(windVeil.imagePrompt, forgeRoot.imagePrompt);
});

test('同じPrimaryとSecondaryでもPersonCoreが違えば世界構造が変わる', () => {
  const quietOpen = worldCore.buildVisualProfile({
    core: 1, path: 1, curiosity: 2, connection: 2,
    ignition: 1, persistence: 2, sensor: 1, depth: 1
  });
  const layeredConnected = worldCore.buildVisualProfile({
    core: 5, path: 5, curiosity: 5, connection: 5,
    ignition: 4, persistence: 5, sensor: 5, depth: 5
  });
  const first = worldCore.buildWorldSpec(quietOpen, 'WIND', 'VEIL', combinations);
  const second = worldCore.buildWorldSpec(layeredConnected, 'WIND', 'VEIL', combinations);
  assert.notEqual(first.title, second.title);
  assert.notDeepEqual(first.environment, second.environment);
  assert.notDeepEqual(first.composition, second.composition);
});

test('imagePromptは構造化済みの描写だけを含み画像情報を含めない', () => {
  const profile = worldCore.buildVisualProfile(baseCore);
  const spec = worldCore.buildWorldSpec(profile, 'PRISM', 'TIDE', combinations);
  assert.match(spec.imagePrompt, /Environment:/);
  assert.match(spec.imagePrompt, /Composition:/);
  assert.match(spec.imagePrompt, /Motifs:/);
  assert.match(spec.imagePrompt, /Atmosphere:/);
  assert.match(spec.imagePrompt, /Lighting:/);
  assert.match(spec.imagePrompt, /Camera:/);
  assert.match(spec.imagePrompt, /Palette:/);
  assert.match(spec.imagePrompt, /Constraints:/);
  assert.doesNotMatch(spec.imagePrompt, /left-hand\.jpg|right-hand\.jpg|blob:|base64|data:image/i);
  assert.doesNotMatch(spec.imagePrompt, /千路|庭園|世界名|日本語の文字/);
  assert.doesNotMatch(spec.imagePrompt, /[\u3040-\u30ff\u3400-\u9fff]/);
});

test('world-coreはMath.randomを使わず入力を変更しない', () => {
  const source = fs.readFileSync(path.join(root, 'world-core.js'), 'utf8');
  assert.doesNotMatch(source, /Math\.random\s*\(/);
  const frozenCore = Object.freeze({ ...baseCore });
  const before = structuredClone(frozenCore);
  worldCore.buildVisualProfile(frozenCore);
  assert.deepEqual(frozenCore, before);
});

test('buildWorldDataは診断結果から写真由来情報を引き継がない', () => {
  const result = {
    personCore: { ...baseCore },
    primary: { id: 'WIND' },
    secondary: { id: 'ROOT' },
    combinations,
    leftFileName: 'private-left.jpg',
    previewUrl: 'blob:private-photo',
    base64: 'data:image/jpeg;base64,secret'
  };
  const serialized = JSON.stringify(worldCore.buildWorldData(result));
  assert.doesNotMatch(serialized, /private-left|blob:|data:image|base64|FileName|previewUrl/i);
});
