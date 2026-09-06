/**
 * Palm Manual Prototype v0.3.5
 * image-features.js — Palm Image Features v1 領域モデルおよびブラウザ軽量特徴抽出器
 *
 * 【設計思想】
 * - 目的: 将来のモデル(MediaPipe Hands等)導入に向け、手・画像幾何特徴の正規化インターフェースを提供する。
 * - プライバシー重視: ピクセルデータやURLは保持せず、幾何特徴量ベクトルのみを構造化する。
 * - 相対評価: 色・明るさ・ファイルサイズ等は手相的意味を持たないため除外する。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PalmImageFeatures = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VERSION = '1.0';

  /**
   * 縦横比（aspectRatio = width / height）から分類カテゴリを判定する純粋関数
   */
  function classifyAspectCategory(aspectRatio) {
    if (!aspectRatio || typeof aspectRatio !== 'number' || isNaN(aspectRatio)) return 'unknown';
    if (aspectRatio < 0.75) return 'tall';      // 縦長（手・手のひらが縦に長い構図）
    if (aspectRatio > 1.33) return 'wide';      // 横長
    return 'standard';                          // 標準的比例（約3:4〜4:3）
  }

  /**
   * 空の PalmImageFeatures v1 オブジェクトを構築
   */
  function createEmptyFeatures() {
    return {
      version: VERSION,
      left: { width: 0, height: 0, aspectRatio: 0, aspectCategory: 'unknown' },
      right: { width: 0, height: 0, aspectRatio: 0, aspectCategory: 'unknown' }
    };
  }

  /**
   * Palm Image Features v1 構造体を生成。
   * 写真解像度自体ではなく、手・手相の幾何学領域（将来のMediaPipe HandsやCanvas輪郭抽出）の
   * プレースホルダー／構造化表現として設計する。
   */
  function buildHandFeatures(source) {
    var s = source || {};
    return {
      // 写真解像度・ファイル属性ではなく、撮影された「手・手のひら・指」の領域・長さ・線特徴の標準構造
      palmBounds: s.palmBounds || null,                   // { x, y, width, height } 手のひら領域
      palmAspectRatio: Number(s.palmAspectRatio) || 0,   // 手のひら縦横比
      fingerLengthRatios: s.fingerLengthRatios || null,   // 指長比率 { index, middle, ring, pinky, thumb }
      majorLines: s.majorLines || {                       // 主要線データ
        lifeLine: null,      // { length, curvature, depth }
        headLine: null,      // { length, angle, depth }
        heartLine: null,     // { length, curvature, depth }
        fateLine: null       // { presents, length, depth }
      }
    };
  }

  /**
   * ブラウザ環境で画像ソース (File, Blob, URL, または {width, height} オブジェクト) から解像度情報を非同期取得
   */
  function extractDimensions(source) {
    return new Promise(function (resolve) {
      if (!source) {
        resolve({ width: 0, height: 0 });
        return;
      }

      // すでに {width, height} が数値で与えられている場合（テストや直接オブジェクト）
      if (typeof source.width === 'number' && typeof source.height === 'number') {
        resolve({ width: source.width, height: source.height });
        return;
      }

      // ブラウザ Image 要素の利用可能チェック
      if (typeof Image === 'undefined') {
        resolve({ width: 0, height: 0 });
        return;
      }

      var img = new Image();
      var objectUrl = null;

      img.onload = function () {
        var w = img.naturalWidth || img.width || 0;
        var h = img.naturalHeight || img.height || 0;
        if (objectUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
          URL.revokeObjectURL(objectUrl);
        }
        resolve({ width: w, height: h });
      };

      img.onerror = function () {
        if (objectUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
          URL.revokeObjectURL(objectUrl);
        }
        resolve({ width: 0, height: 0 });
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
        resolve({ width: 0, height: 0 });
      }
    });
  }

  /**
   * 左右画像のソースを受け取り、PalmImageFeatures v1 構造体を非同期抽出。
   * Phase 1では手相や手の幾何抽出器の正規化スキーマ枠組みを提供し、
   * 手のひら画像から将来抽出される手相的構造のインターフェースを確定する。
   */
  function extractPairFeatures(leftSource, rightSource) {
    return Promise.all([
      extractDimensions(leftSource),
      extractDimensions(rightSource)
    ]).then(function (results) {
      return {
        version: VERSION,
        left: buildHandFeatures(leftSource),
        right: buildHandFeatures(rightSource)
      };
    });
  }

  return {
    VERSION: VERSION,
    classifyAspectCategory: classifyAspectCategory,
    createEmptyFeatures: createEmptyFeatures,
    buildHandFeatures: buildHandFeatures,
    extractDimensions: extractDimensions,
    extractPairFeatures: extractPairFeatures
  };
});
