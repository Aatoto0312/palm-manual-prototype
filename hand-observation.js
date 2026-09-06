/**
 * Palm Manual v0.4 "Hand Observation"
 * hand-observation.js — ブラウザ標準機能 (Canvas / ImageData) による画像ピクセル観察・指紋生成モジュール
 *
 * 外部AI APIや外部ライブラリを使用せず、純粋なブラウザ機能で画像から客観的な視覚的特徴(Observation)を生成します。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HandObservation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ANALYSIS_SIZE = 256;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function hash32(str) {
    var h = 0x811c9dc5;
    var s = String(str || '');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
  }

  /**
   * 画像オブジェクト／URL／ImageDataから256x256ピクセルデータのImageDataを取得
   */
  function getImageDataFromSource(source) {
    return new Promise(function (resolve, reject) {
      if (!source) {
        resolve(null);
        return;
      }

      // すでに ImageData 互換オブジェクト（{ data, width, height }）の場合
      if (source.data && typeof source.width === 'number' && typeof source.height === 'number') {
        resolve(source);
        return;
      }

      // node環境などでCanvas / Imageが存在しない場合、ダミー配列生成
      if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
        resolve(null);
        return;
      }

      var canvas = document.createElement('canvas');
      canvas.width = ANALYSIS_SIZE;
      canvas.height = ANALYSIS_SIZE;
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(null);
        return;
      }

      var img = new Image();
      var objectUrl = null;

      img.onload = function () {
        ctx.drawImage(img, 0, 0, ANALYSIS_SIZE, ANALYSIS_SIZE);
        try {
          var imgData = ctx.getImageData(0, 0, ANALYSIS_SIZE, ANALYSIS_SIZE);
          if (objectUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
            URL.revokeObjectURL(objectUrl);
          }
          resolve(imgData);
        } catch (e) {
          if (objectUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
            URL.revokeObjectURL(objectUrl);
          }
          resolve(null);
        }
      };

      img.onerror = function () {
        if (objectUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
          URL.revokeObjectURL(objectUrl);
        }
        resolve(null);
      };

      if (typeof File !== 'undefined' && source instanceof File) {
        objectUrl = URL.createObjectURL(source);
        img.src = objectUrl;
      } else if (typeof Blob !== 'undefined' && source instanceof Blob) {
        objectUrl = URL.createObjectURL(source);
        img.src = objectUrl;
      } else if (typeof source === 'string') {
        img.src = source;
      } else if (source && typeof source.url === 'string') {
        img.src = source.url;
      } else {
        resolve(null);
      }
    });
  }

  /**
   * 256x256 ImageDataから1枚の手画像の単体Observationを抽出
   */
  function analyzeSingleImage(imageData) {
    if (!imageData || !imageData.data || imageData.width < 10 || imageData.height < 10) {
      return createEmptySingleObservation();
    }

    var width = imageData.width;
    var height = imageData.height;
    var data = imageData.data;
    var totalPixels = width * height;

    // 1. 輝度配列(Luminance)と平均輝度の計算
    var lum = new Float32Array(totalPixels);
    var lumSum = 0;

    for (var i = 0; i < totalPixels; i++) {
      var r = data[i * 4];
      var g = data[i * 4 + 1];
      var b = data[i * 4 + 2];
      // ITU-R BT.601 標準輝度変換
      var l = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
      lum[i] = l;
      lumSum += l;
    }

    var meanLuminance = lumSum / totalPixels;

    // コントラスト (標準偏差)
    var varSum = 0;
    for (var i = 0; i < totalPixels; i++) {
      var diff = lum[i] - meanLuminance;
      varSum += diff * diff;
    }
    var contrast = Math.sqrt(varSum / totalPixels);

    // 2. Sobelフィルタによるエッジ強度・方向検出
    var edgeMag = new Float32Array(totalPixels);
    var horizEdges = 0;
    var vertEdges = 0;
    var diagEdges = 0;
    var totalEdgeMag = 0;

    // グリッド領域ごとの密度集計用 (3x3 グリッド)
    var gridDensity = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var gridCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    // 方向ヒストグラム (8バケット)
    var orientationHist = [0, 0, 0, 0, 0, 0, 0, 0];

    // ぼやけ推定用 Laplacian 分散
    var laplacianSum = 0;
    var laplacianSqSum = 0;

    for (var y = 1; y < height - 1; y++) {
      for (var x = 1; x < width - 1; x++) {
        var idx = y * width + x;

        // Sobel カーネル
        // Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
        // Gy = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
        var gx =
          -1 * lum[(y - 1) * width + (x - 1)] + 1 * lum[(y - 1) * width + (x + 1)] +
          -2 * lum[y * width + (x - 1)] + 2 * lum[y * width + (x + 1)] +
          -1 * lum[(y + 1) * width + (x - 1)] + 1 * lum[(y + 1) * width + (x + 1)];

        var gy =
          -1 * lum[(y - 1) * width + (x - 1)] - 2 * lum[(y - 1) * width + x] - 1 * lum[(y - 1) * width + (x + 1)] +
           1 * lum[(y + 1) * width + (x - 1)] + 2 * lum[(y + 1) * width + x] + 1 * lum[(y + 1) * width + (x + 1)];

        var mag = Math.sqrt(gx * gx + gy * gy);
        edgeMag[idx] = mag;
        totalEdgeMag += mag;

        // ラプラシアン Filter: [[0, 1, 0], [1, -4, 1], [0, 1, 0]]
        var lap =
          lum[(y - 1) * width + x] +
          lum[(y + 1) * width + x] +
          lum[y * width + (x - 1)] +
          lum[y * width + (x + 1)] -
          4 * lum[idx];
        laplacianSum += lap;
        laplacianSqSum += lap * lap;

        // エッジ方向分類
        if (mag > 0.1) {
          var angle = Math.atan2(gy, gx); // -PI ~ PI
          if (angle < 0) angle += Math.PI; // 0 ~ PI
          var bucket = Math.floor((angle / Math.PI) * 8) % 8;
          orientationHist[bucket] += mag;

          var absGx = Math.abs(gx);
          var absGy = Math.abs(gy);
          if (absGy > absGx * 2) {
            horizEdges += mag; // 水平線成分 (y方向勾配が大きい)
          } else if (absGx > absGy * 2) {
            vertEdges += mag;  // 垂直線成分 (x方向勾配が大きい)
          } else {
            diagEdges += mag;  // 斜め成分
          }
        }

        // グリッド密度集計
        var gxIdx = Math.floor((x / width) * 3);
        var gyIdx = Math.floor((y / height) * 3);
        var gIdx = gyIdx * 3 + gxIdx;
        gridDensity[gIdx] += mag;
        gridCounts[gIdx]++;
      }
    }

    var edgeDensity = totalEdgeMag / totalPixels;

    // 方向性の多様性 (Orientation Diversity) - Shannon Entropy
    var histSum = 0;
    for (var k = 0; k < 8; k++) histSum += orientationHist[k];
    var orientationDiversity = 0;
    if (histSum > 0) {
      for (var k = 0; k < 8; k++) {
        var p = orientationHist[k] / histSum;
        if (p > 0) {
          orientationDiversity -= p * Math.log2(p);
        }
      }
      orientationDiversity /= 3.0; // 正規化 0~1 (log2(8) = 3)
    }

    var sumEdges = horizEdges + vertEdges + diagEdges || 1;
    var horizontalEdgeRatio = horizEdges / sumEdges;
    var verticalEdgeRatio = vertEdges / sumEdges;
    var diagonalEdgeRatio = diagEdges / sumEdges;

    // 領域ごとの密度
    var centerEdgeDensity = (gridCounts[4] > 0) ? (gridDensity[4] / gridCounts[4]) : 0;
    var outerEdgeSum = 0;
    var outerCountSum = 0;
    [0, 1, 2, 3, 5, 6, 7, 8].forEach(function (g) {
      outerEdgeSum += gridDensity[g];
      outerCountSum += gridCounts[g];
    });
    var outerEdgeDensity = outerCountSum > 0 ? (outerEdgeSum / outerCountSum) : 0;

    var upperDensity = (gridDensity[0] + gridDensity[1] + gridDensity[2]) / (gridCounts[0] + gridCounts[1] + gridCounts[2] || 1);
    var centerDensity = (gridDensity[3] + gridDensity[4] + gridDensity[5]) / (gridCounts[3] + gridCounts[4] + gridCounts[5] || 1);
    var lowerDensity = (gridDensity[6] + gridDensity[7] + gridDensity[8]) / (gridCounts[6] + gridCounts[7] + gridCounts[8] || 1);
    var leftDensity = (gridDensity[0] + gridDensity[3] + gridDensity[6]) / (gridCounts[0] + gridCounts[3] + gridCounts[6] || 1);
    var rightDensity = (gridDensity[2] + gridDensity[5] + gridDensity[8]) / (gridCounts[2] + gridCounts[5] + gridCounts[8] || 1);

    // 複雑さ (Complexity)
    var complexity = clamp(edgeDensity * 2.5 + orientationDiversity * 0.5, 0, 1);

    // ぼやけ推定 (Laplacian Variance)
    var innerPixels = (width - 2) * (height - 2);
    var meanLap = laplacianSum / innerPixels;
    var blurEstimate = laplacianSqSum / innerPixels - meanLap * meanLap;

    // 撮影品質評価 (Quality Check)
    var isDark = meanLuminance < 0.18;
    var isBright = meanLuminance > 0.85;
    var isLowContrast = contrast < 0.12;
    var isBlurry = blurEstimate < 0.002;

    var qualityStatus = 'ok';
    var qualityMessage = '撮影状態は良好です。';

    if (isDark) {
      qualityStatus = 'dark';
      qualityMessage = '少し暗いかもしれません。明るい場所で撮ると特徴をより再現しやすくなります。';
    } else if (isBright) {
      qualityStatus = 'bright';
      qualityMessage = '少し光が強すぎるかもしれません。反射を抑えて撮ると特徴をより拾いやすくなります。';
    } else if (isLowContrast) {
      qualityStatus = 'low_contrast';
      qualityMessage = '背景と手の明暗差が少ないかもしれません。シンプルな背景だと特徴を拾いやすくなります。';
    } else if (isBlurry) {
      qualityStatus = 'blurry';
      qualityMessage = '少しピントがブレているかもしれません。手を固定して撮ると特徴を鮮明に映せます。';
    }

    return {
      meanLuminance: clamp(meanLuminance, 0, 1),
      contrast: clamp(contrast, 0, 1),
      edgeDensity: clamp(edgeDensity, 0, 1),
      centerEdgeDensity: clamp(centerEdgeDensity, 0, 1),
      outerEdgeDensity: clamp(outerEdgeDensity, 0, 1),
      orientationDiversity: clamp(orientationDiversity, 0, 1),
      horizontalEdgeRatio: clamp(horizontalEdgeRatio, 0, 1),
      verticalEdgeRatio: clamp(verticalEdgeRatio, 0, 1),
      diagonalEdgeRatio: clamp(diagonalEdgeRatio, 0, 1),
      complexity: clamp(complexity, 0, 1),
      upperDensity: clamp(upperDensity, 0, 1),
      centerDensity: clamp(centerDensity, 0, 1),
      lowerDensity: clamp(lowerDensity, 0, 1),
      leftDensity: clamp(leftDensity, 0, 1),
      rightDensity: clamp(rightDensity, 0, 1),
      blurEstimate: blurEstimate,
      quality: {
        status: qualityStatus,
        message: qualityMessage,
        isDark: isDark,
        isBright: isBright,
        isLowContrast: isLowContrast,
        isBlurry: isBlurry
      }
    };
  }

  function createEmptySingleObservation() {
    return {
      meanLuminance: 0.5,
      contrast: 0.3,
      edgeDensity: 0.2,
      centerEdgeDensity: 0.2,
      outerEdgeDensity: 0.2,
      orientationDiversity: 0.5,
      horizontalEdgeRatio: 0.33,
      verticalEdgeRatio: 0.33,
      diagonalEdgeRatio: 0.34,
      complexity: 0.3,
      upperDensity: 0.2,
      centerDensity: 0.2,
      lowerDensity: 0.2,
      leftDensity: 0.2,
      rightDensity: 0.2,
      blurEstimate: 0.01,
      quality: {
        status: 'ok',
        message: 'デフォルト画像設定を使用しています。',
        isDark: false,
        isBright: false,
        isLowContrast: false,
        isBlurry: false
      }
    };
  }

  /**
   * 左右Observationから決定的なHandFingerprintを構築
   */
  function buildHandFingerprint(leftObs, rightObs) {
    var keys = [
      'meanLuminance', 'contrast', 'edgeDensity', 'centerEdgeDensity',
      'outerEdgeDensity', 'orientationDiversity', 'horizontalEdgeRatio',
      'verticalEdgeRatio', 'complexity', 'upperDensity', 'centerDensity',
      'lowerDensity', 'leftDensity', 'rightDensity'
    ];

    var vec = [];
    keys.forEach(function (k) {
      vec.push(Number((leftObs[k] || 0).toFixed(4)));
    });
    keys.forEach(function (k) {
      vec.push(Number((rightObs[k] || 0).toFixed(4)));
    });

    var leftStr = keys.map(function (k) { return (leftObs[k] || 0).toFixed(4); }).join(',');
    var rightStr = keys.map(function (k) { return (rightObs[k] || 0).toFixed(4); }).join(',');

    var leftHash = hash32(leftStr);
    var rightHash = hash32(rightStr);
    var combinedHash = hash32(leftHash + '|' + rightHash);

    return {
      leftHash: leftHash,
      rightHash: rightHash,
      combinedHash: combinedHash,
      observationVector: vec
    };
  }

  /**
   * 左右のObservationおよび左右差(Differences)を統合作成
   */
  function buildPairObservation(leftData, rightData) {
    var left = analyzeSingleImage(leftData);
    var right = analyzeSingleImage(rightData);

    var complexityDifference = Math.abs(left.complexity - right.complexity);
    var densityDifference = Math.abs(left.edgeDensity - right.edgeDensity);
    var orientationDifference = Math.abs(left.orientationDiversity - right.orientationDiversity);
    var contrastDifference = Math.abs(left.contrast - right.contrast);

    var fingerprint = buildHandFingerprint(left, right);

    return {
      version: '0.4',
      left: left,
      right: right,
      differences: {
        complexityDifference: clamp(complexityDifference, 0, 1),
        densityDifference: clamp(densityDifference, 0, 1),
        orientationDifference: clamp(orientationDifference, 0, 1),
        contrastDifference: clamp(contrastDifference, 0, 1)
      },
      fingerprint: fingerprint
    };
  }

  /**
   * 左右の画像ソース(File, ImageData等)から非同期でHandObservationを生成
   */
  function observePair(leftSource, rightSource) {
    return Promise.all([
      getImageDataFromSource(leftSource),
      getImageDataFromSource(rightSource)
    ]).then(function (results) {
      return buildPairObservation(results[0], results[1]);
    });
  }

  return {
    ANALYSIS_SIZE: ANALYSIS_SIZE,
    analyzeSingleImage: analyzeSingleImage,
    buildPairObservation: buildPairObservation,
    observePair: observePair,
    createEmptySingleObservation: createEmptySingleObservation
  };
});
