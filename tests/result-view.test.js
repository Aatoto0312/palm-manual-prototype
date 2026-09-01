'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const view = require(path.resolve(__dirname, '..', 'result-view.js'));

test('軸値を点数ではなく肯定的な傾向ラベルへ変換する', () => {
  assert.deepEqual(view.getAxisPresentation('core', 5), {
    strength: 'かなり強め',
    typeLabel: '方向を守るタイプ'
  });
  assert.deepEqual(view.getAxisPresentation('core', 2), {
    strength: 'やや控えめ',
    typeLabel: '状況に合わせるタイプ'
  });
  assert.deepEqual(view.getAxisPresentation('depth', 1), {
    strength: '控えめ',
    typeLabel: 'まず全体を見るタイプ'
  });
});

test('8軸の1〜5すべてに空でない肯定的ラベルがある', () => {
  const axes = [
    'core', 'path', 'curiosity', 'connection',
    'ignition', 'persistence', 'sensor', 'depth'
  ];
  for (const axis of axes) {
    for (let value = 1; value <= 5; value += 1) {
      const result = view.getAxisPresentation(axis, value);
      assert.ok(result.strength.length > 0, axis + ':' + value);
      assert.ok(result.typeLabel.length > 0, axis + ':' + value);
      assert.doesNotMatch(result.typeLabel, /弱い|苦手|不足|劣る/);
    }
  }
});

test('平均から離れた値を含む組み合わせを先頭3件へ安定順位付けする', () => {
  const combinations = [
    { id: 'a', values: [3, 3] },
    { id: 'b', values: [5, 1] },
    { id: 'c', values: [4, 3] },
    { id: 'd', values: [1, 2] },
    { id: 'e', values: [5, 3] },
    { id: 'f', values: [2, 3] },
    { id: 'g', values: [4, 4] },
    { id: 'h', values: [3, 2] }
  ];
  const before = structuredClone(combinations);
  const ranked = view.rankCombinations(combinations);
  assert.deepEqual(ranked.featured.map((item) => item.id), ['b', 'd', 'e']);
  assert.deepEqual(ranked.more.map((item) => item.id), ['g', 'c', 'f', 'h', 'a']);
  assert.deepEqual(combinations, before);
});

test('同点時は元の配列順を維持する', () => {
  const ranked = view.rankCombinations([
    { id: 'first', values: [4, 3] },
    { id: 'second', values: [2, 3] },
    { id: 'third', values: [3, 4] },
    { id: 'fourth', values: [3, 2] }
  ]);
  assert.deepEqual(ranked.featured.map((item) => item.id), ['first', 'second', 'third']);
  assert.deepEqual(ranked.more.map((item) => item.id), ['fourth']);
});

