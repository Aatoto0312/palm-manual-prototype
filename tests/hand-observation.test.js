const test = require('node:test');
const assert = require('node:assert/strict');
const HandObservation = require('../hand-observation.js');
const PalmPersonCore = require('../person-core.js');
const PalmWorldCore = require('../world-core.js');

/** ダミーの 256x256 ImageData を生成 */
function createDummyImageData(patternType) {
  const width = 256;
  const height = 256;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let val = 128;

      if (patternType === 'grid') {
        if (x % 16 === 0 || y % 16 === 0) val = 255;
        else val = 30;
      } else if (patternType === 'stripes') {
        if (y % 8 < 4) val = 220;
        else val = 20;
      } else if (patternType === 'center_dense') {
        const dx = x - 128;
        const dy = y - 128;
        if (dx * dx + dy * dy < 2500) {
          val = (x + y) % 2 === 0 ? 255 : 0;
        } else {
          val = 180;
        }
      }

      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }

  return { data, width, height };
}

test('HandObservation: 同じピクセル画像から同じObservationを生成する', () => {
  const imgData1 = createDummyImageData('grid');
  const imgData2 = createDummyImageData('grid');

  const obs1 = HandObservation.analyzeSingleImage(imgData1);
  const obs2 = HandObservation.analyzeSingleImage(imgData2);

  assert.equal(obs1.edgeDensity, obs2.edgeDensity);
  assert.equal(obs1.orientationDiversity, obs2.orientationDiversity);
  assert.equal(obs1.complexity, obs2.complexity);
});

test('HandObservation: 異なるピクセル画像から異なるObservationを生成する', () => {
  const imgGrid = createDummyImageData('grid');
  const imgStripes = createDummyImageData('stripes');

  const obsGrid = HandObservation.analyzeSingleImage(imgGrid);
  const obsStripes = HandObservation.analyzeSingleImage(imgStripes);

  assert.notEqual(obsGrid.horizontalEdgeRatio, obsStripes.horizontalEdgeRatio);
  assert.notEqual(obsGrid.verticalEdgeRatio, obsStripes.verticalEdgeRatio);
});

test('HandObservation: 数値がすべて正常・有限範囲内(0..1)である', () => {
  const img = createDummyImageData('center_dense');
  const obs = HandObservation.analyzeSingleImage(img);

  const keys = [
    'meanLuminance', 'contrast', 'edgeDensity', 'centerEdgeDensity',
    'outerEdgeDensity', 'orientationDiversity', 'horizontalEdgeRatio',
    'verticalEdgeRatio', 'diagonalEdgeRatio', 'complexity',
    'upperDensity', 'centerDensity', 'lowerDensity', 'leftDensity', 'rightDensity'
  ];

  keys.forEach((k) => {
    assert.equal(Number.isFinite(obs[k]), true, `${k} is finite`);
    assert.equal(obs[k] >= 0 && obs[k] <= 1, true, `${k} is between 0 and 1 (val: ${obs[k]})`);
  });
});

test('HandFingerprint: 指紋データ構造体に復元可能な元画像・Base64・BlobURLを含まない', () => {
  const imgL = createDummyImageData('grid');
  const imgR = createDummyImageData('stripes');

  const pairObs = HandObservation.buildPairObservation(imgL, imgR);
  const fp = pairObs.fingerprint;

  assert.equal(typeof fp.combinedHash, 'string');
  assert.equal(Array.isArray(fp.observationVector), true);

  // 指紋オブジェクトおよびWorldSpecの中に元画像プロパティやBlob/Base64文字列がないこと
  const fpJson = JSON.stringify(pairObs);
  assert.equal(fpJson.includes('data:image'), false);
  assert.equal(fpJson.includes('blob:'), false);
});

test('PersonCore: HandObservation から連続値 (0..1) rawPersonCore と表示用 (1..5) displayPersonCore を生成', () => {
  const imgL = createDummyImageData('grid');
  const imgR = createDummyImageData('center_dense');
  const obs = HandObservation.buildPairObservation(imgL, imgR);

  const result = PalmPersonCore.buildResultData({
    name: 'テストユーザー',
    observation: obs
  });

  assert.equal(result.version, '0.4');
  assert.notEqual(result.rawPersonCore, null);

  PalmPersonCore.CORE_AXIS_ORDER.forEach((axis) => {
    const rawVal = result.rawPersonCore[axis];
    const dispVal = result.personCore[axis];

    assert.equal(typeof rawVal, 'number');
    assert.equal(rawVal >= 0 && rawVal <= 1, true, `rawVal ${axis} in 0..1`);

    assert.equal(Number.isInteger(dispVal), true);
    assert.equal(dispVal >= 1 && dispVal <= 5, true, `dispVal ${axis} in 1..5`);
  });
});

test('PersonCore: 異なる画像から異なる rawPersonCore / displayPersonCore が生成される', () => {
  const obs1 = HandObservation.buildPairObservation(
    createDummyImageData('grid'),
    createDummyImageData('grid')
  );
  const obs2 = HandObservation.buildPairObservation(
    createDummyImageData('stripes'),
    createDummyImageData('center_dense')
  );

  const res1 = PalmPersonCore.buildResultData({ name: '同一名前', observation: obs1 });
  const res2 = PalmPersonCore.buildResultData({ name: '同一名前', observation: obs2 });

  // 異なる画像ピクセル入力なら PersonCore 連続値が異なること
  assert.notEqual(res1.rawPersonCore.depth, res2.rawPersonCore.depth);
  assert.notEqual(res1.rawPersonCore.path, res2.rawPersonCore.path);
});

test('World: 異なるPersonCore / Observationから構図・構造の差異(pathStructure, counts等)が発生する', () => {
  const obs1 = HandObservation.buildPairObservation(
    createDummyImageData('grid'),
    createDummyImageData('grid')
  );
  const obs2 = HandObservation.buildPairObservation(
    createDummyImageData('stripes'),
    createDummyImageData('center_dense')
  );

  const res1 = PalmPersonCore.buildResultData({ name: 'A', observation: obs1 });
  const res2 = PalmPersonCore.buildResultData({ name: 'B', observation: obs2 });

  const world1 = PalmWorldCore.buildWorldData(res1);
  const world2 = PalmWorldCore.buildWorldData(res2);

  assert.notEqual(
    JSON.stringify(world1.worldSpec.composition.structures),
    JSON.stringify(world2.worldSpec.composition.structures)
  );

  // 単に色だけでなく、カウントや構図構造に差が出ていること
  assert.equal(typeof world1.worldSpec.composition.structures.pathStructure, 'string');
  assert.equal(typeof world1.worldSpec.composition.counts.buildingCount, 'number');
});
