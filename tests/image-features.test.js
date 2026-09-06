const test = require('node:test');
const assert = require('node:assert/strict');
const PalmImageFeatures = require('../image-features.js');
const PalmPersonCore = require('../person-core.js');

test('PalmImageFeatures v1 スキーマを正しく構築できる', () => {
  const features = PalmImageFeatures.buildHandFeatures({
    palmAspectRatio: 0.85,
    palmBounds: { x: 10, y: 10, width: 200, height: 235 }
  });
  assert.equal(features.palmAspectRatio, 0.85);
  assert.equal(features.palmBounds.width, 200);
  assert.equal(features.majorLines.lifeLine, null);
});

test('extractPairFeatures は非同期で v1 構造体を返す', async () => {
  const leftObj = { palmAspectRatio: 0.8 };
  const rightObj = { palmAspectRatio: 0.9 };
  const features = await PalmImageFeatures.extractPairFeatures(leftObj, rightObj);

  assert.equal(features.version, '1.0');
  assert.equal(features.left.palmAspectRatio, 0.8);
  assert.equal(features.right.palmAspectRatio, 0.9);
});

test('画像特徴(imageFeatures)が存在するとseedが変化する', () => {
  const inputBase = {
    name: 'テストユーザー',
    leftFileName: 'hand.jpg',
    leftSize: 100000,
    rightFileName: 'hand.jpg',
    rightSize: 100000
  };

  const seedNoFeat = PalmPersonCore.buildSeed(inputBase);

  const inputWithFeat1 = {
    ...inputBase,
    imageFeatures: {
      version: '1.0',
      left: { palmAspectRatio: 0.85 },
      right: { palmAspectRatio: 0.85 }
    }
  };
  const seedFeat1 = PalmPersonCore.buildSeed(inputWithFeat1);

  const inputWithFeat2 = {
    ...inputBase,
    imageFeatures: {
      version: '1.0',
      left: { palmAspectRatio: 0.75 },
      right: { palmAspectRatio: 0.85 }
    }
  };
  const seedFeat2 = PalmPersonCore.buildSeed(inputWithFeat2);

  assert.notEqual(seedNoFeat, seedFeat1);
  assert.notEqual(seedFeat1, seedFeat2);
});

test('howToReadText は imageFeatures の有無に応じて適切に変化する', () => {
  const resultWithoutFeat = PalmPersonCore.buildResultData({ name: '太郎' });
  assert.match(resultWithoutFeat.howToRead, /モックシードをもとにPersonCoreを生成/);

  const resultWithFeat = PalmPersonCore.buildResultData({
    name: '太郎',
    imageFeatures: {
      version: '1.0',
      left: { palmAspectRatio: 0.8 },
      right: { palmAspectRatio: 0.8 }
    }
  });
  assert.match(resultWithFeat.howToRead, /Palm Image Features v1/);
});
