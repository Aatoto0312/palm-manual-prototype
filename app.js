/** ============================================================
 *  Palm Manual Prototype v0.1.1
 *  app.js — SPA画面遷移・写真プレビュー・診断演出・結果描画
 * ============================================================ */

(function () {
  'use strict';

  var SCREENS = ['top', 'name', 'left', 'right', 'analyzing', 'result'];

  var el = {};
  var state = {
    name: '',
    left: null,   // { url, name, size }
    right: null,  // { url, name, size }
    analyzingToken: 0
  };

  var analyzingTexts = [
    '手のひらを読み解いています…',
    '特徴をつないでいます…',
    'あなたの取扱説明書を作成中…'
  ];

  document.addEventListener('DOMContentLoaded', init);

  function $(id) { return document.getElementById(id); }

  function init() {
    cacheElements();

    // 初期画面
    show('top');

    // ボタン: 画面遷移
    bindNav();

    // 名前: Enterで次へ
    el.inputName.addEventListener('input', clearNameError);
    el.inputName.addEventListener('keydown', onNameKeydown);
    el.btnNameNext.addEventListener('click', goRightFromName);

    // 写真: 左手
    bindPhoto('left');
    // 写真: 右手
    bindPhoto('right');

    // 診断開始
    el.btnLeftNext.addEventListener('click', goRight);
    el.btnRightNext.addEventListener('click', startAnalyzing);

    // 結果ボタン
    el.btnWorld.addEventListener('click', function () { showToast('この機能は次のバージョンで追加予定です'); });
    el.btnFriends.addEventListener('click', function () { showToast('この機能は次のバージョンで追加予定です'); });
    el.btnRetry.addEventListener('click', resetAll);
  }

  function cacheElements() {
    el.top = $('screen-top');
    el.screens = {};
    SCREENS.forEach(function (s) {
      el.screens[s] = $('screen-' + s);
    });

    el.inputName = $('inputName');
    el.nameError = $('nameError');
    el.btnNameNext = $('btnNameNext');

    // 左手
    el.inputLeft = $('inputLeft');
    el.leftPreview = $('leftPreview');
    el.leftDropZone = $('leftDropZone');
    el.btnLeftRetake = $('btnLeftRetake');
    el.btnLeftNext = $('btnLeftNext');

    // 右手
    el.inputRight = $('inputRight');
    el.rightPreview = $('rightPreview');
    el.rightDropZone = $('rightDropZone');
    el.btnRightRetake = $('btnRightRetake');
    el.btnRightNext = $('btnRightNext');

    el.analyzeText = $('analyzeText');

    el.resultName = $('resultName');
    el.resultPrimaryCard = $('resultPrimaryCard');
    el.primaryGlyph = $('primaryGlyph');
    el.primaryNameJa = $('primaryNameJa');
    el.primaryNameEn = $('primaryNameEn');
    el.primaryMeaning = $('primaryMeaning');
    el.secondaryValue = $('secondaryValue');
    el.resultTitle = $('resultTitle');
    el.traitList = $('traitList');
    el.manualList = $('manualList');
    el.deepList = $('deepList');

    el.btnWorld = $('btnWorld');
    el.btnFriends = $('btnFriends');
    el.btnRetry = $('btnRetry');

    el.toast = $('toast');
    el.toastText = $('toastText');
  }

  /* ===================== 画面遷移 ===================== */
  function show(id) {
    var next = el.screens[id];
    if (!next) return;

    for (var i = 0; i < SCREENS.length; i++) {
      var key = SCREENS[i];
      var s = el.screens[key];
      s.classList.remove('is-active');
      s.setAttribute('aria-hidden', 'true');
    }
    next.classList.add('is-active');
    next.setAttribute('aria-hidden', 'false');

    // 画面切替時は必ず上端へ戻す（長文画面のアクセス時対策）
    window.scrollTo(0, 0);

    if (id === 'name') {
      setTimeout(function () { el.inputName.focus(); }, 120);
    } else if (id === 'left') {
      focusFirstNav('left');
    }
  }

  function focusFirstNav(which) {
    var btn = which === 'left' ? el.btnLeftNext : el.btnRightNext;
    if (btn && !btn.disabled) {
      setTimeout(function () { btn.focus(); }, 120);
    }
  }

  function bindNav() {
    // data-goto ボタン
    var gotoButtons = document.querySelectorAll('[data-goto]');
    Array.prototype.forEach.call(gotoButtons, function (btn) {
      btn.addEventListener('click', function () {
        show(btn.getAttribute('data-goto'));
      });
    });

    // data-back ボタン
    var backButtons = document.querySelectorAll('[data-back]');
    Array.prototype.forEach.call(backButtons, function (btn) {
      btn.addEventListener('click', goBack);
    });
  }

  function goBack() {
    var active = getActiveScreen();
    switch (active) {
      case 'name': show('top'); break;
      case 'left': show('name'); break;
      case 'right': show('left'); break;
      case 'analyzing': show('right'); break;
      case 'result': show('top'); break;
      default: show('top');
    }
  }

  function getActiveScreen() {
    for (var i = 0; i < SCREENS.length; i++) {
      var s = el.screens[SCREENS[i]];
      if (s.classList.contains('is-active')) return SCREENS[i];
    }
    return 'top';
  }

  /* ===================== 名前 ===================== */
  function onNameKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      goRightFromName();
    }
  }

  function goRightFromName() {
    var val = el.inputName.value.trim();
    if (!val) {
      el.nameError.textContent = '名前またはニックネームを入力してください';
      el.inputName.focus();
      return;
    }
    state.name = val;
    el.nameError.textContent = '';
    show('left');
  }

  function clearNameError() {
    if (el.nameError.textContent) el.nameError.textContent = '';
  }

  /* ===================== 写真 ===================== */
  function bindPhoto(which) {
    var input = which === 'left' ? el.inputLeft : el.inputRight;
    var preview = which === 'left' ? el.leftPreview : el.rightPreview;
    var dropZone = which === 'left' ? el.leftDropZone : el.rightDropZone;
    var retake = which === 'left' ? el.btnLeftRetake : el.btnRightRetake;
    var next = which === 'left' ? el.btnLeftNext : el.btnRightNext;

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) {
        clearPhoto(which);
        return;
      }
      if (!file.type || file.type.indexOf('image/') === 0) {
        setPhoto(which, file);
      }
      input.value = '';
    });

    // ドロップゾーンをタップ可能にするためラベルはそのまま。
    // 撮り直しはinputを再開放。
    retake.addEventListener('click', function () {
      clearPhoto(which);
      input.click();
    });
  }

  function setPhoto(which, file) {
    var url = URL.createObjectURL(file);
    var preview = which === 'left' ? el.leftPreview : el.rightPreview;
    var dropZone = which === 'left' ? el.leftDropZone : el.rightDropZone;
    var retake = which === 'left' ? el.btnLeftRetake : el.btnRightRetake;
    var next = which === 'left' ? el.btnLeftNext : el.btnRightNext;

    // 古いURL解放
    var before = which === 'left' ? state.left : state.right;
    if (before && before.url) URL.revokeObjectURL(before.url);

    var rec = { url: url, name: file.name || '', size: file.size || 0 };
    if (which === 'left') state.left = rec; else state.right = rec;

    preview.src = url;
    preview.hidden = false;
    dropZone.hidden = true;
    retake.hidden = false;
    next.disabled = false;
    next.removeAttribute('disabled');
  }

  function clearPhoto(which) {
    var preview = which === 'left' ? el.leftPreview : el.rightPreview;
    var dropZone = which === 'left' ? el.leftDropZone : el.rightDropZone;
    var retake = which === 'left' ? el.btnLeftRetake : el.btnRightRetake;
    var next = which === 'left' ? el.btnLeftNext : el.btnRightNext;

    if (which === 'left' ? state.left : state.right) {
      var before = which === 'left' ? state.left : state.right;
      if (before.url) URL.revokeObjectURL(before.url);
    }
    if (which === 'left') state.left = null; else state.right = null;

    preview.removeAttribute('src');
    preview.hidden = true;
    dropZone.hidden = false;
    retake.hidden = true;
    next.disabled = true;
    next.setAttribute('disabled', 'disabled');
  }

  function goRight() {
    if (!state.left) return;
    show('right');
  }

  /* ===================== ANALYZING ===================== */
  function startAnalyzing() {
    if (!state.right) return;
    show('analyzing');

    var token = ++state.analyzingToken;

    // 演出テキストを順に表示
    analyzingTexts.forEach(function (txt, i) {
      setTimeout(function () {
        if (token !== state.analyzingToken) return;
        el.analyzeText.textContent = txt;
      }, 900 * i);
    });

    // 2.7秒後に結果へ
    setTimeout(function () {
      if (token !== state.analyzingToken) return;
      renderResult();
      show('result');
    }, 2700 + 400);
  }

  /* ===================== RESULT ===================== */
  function renderResult() {
    var input = {
      name: state.name,
      leftFileName: state.left ? state.left.name : '',
      leftSize: state.left ? state.left.size : 0,
      rightFileName: state.right ? state.right.name : '',
      rightSize: state.right ? state.right.size : 0
    };

    var r = window.PalmDiagnosis.diagnose(input);

    el.resultName.textContent = r.name + 'の取扱説明書';

    // Primary
    el.resultPrimaryCard.setAttribute('data-type', r.primary.id);
    el.primaryGlyph.textContent = r.primary.glyph;
    el.primaryNameJa.textContent = r.primary.nameJa;
    el.primaryNameEn.textContent = r.primary.nameEn + ' · ' + r.primary.keywords;
    el.primaryMeaning.textContent = r.primary.meaning;

    // Secondary
    el.secondaryValue.textContent = r.secondary.nameJa + ' / ' + r.secondary.nameEn;

    // 固有愛称
    el.resultTitle.textContent = '《' + r.title + '》';

    // 特徴
    el.traitList.innerHTML = '';
    r.traits.forEach(function (t) {
      var li = document.createElement('li');

      var label = document.createElement('span');
      label.className = 'trait-label';
      label.textContent = t.label;

      var stars = document.createElement('span');
      stars.className = 'trait-stars';
      var filled = '★'.repeat(t.star);
      var empty = '☆'.repeat(5 - t.star);
      var full = document.createTextNode(filled);
      var emptySpan = document.createElement('span');
      emptySpan.className = 'empty';
      emptySpan.textContent = empty;
      stars.appendChild(full);
      stars.appendChild(emptySpan);

      li.appendChild(label);
      li.appendChild(stars);
      el.traitList.appendChild(li);
    });

    // 取扱説明書
    el.manualList.innerHTML = '';
    r.manual.forEach(function (val, i) {
      var li = document.createElement('li');

      var key = document.createElement('div');
      key.className = 'manual-key';
      key.textContent = r.manualKeys[i] || ('項目' + (i + 1));

      var value = document.createElement('div');
      value.className = 'manual-value';
      value.textContent = val;

      li.appendChild(key);
      li.appendChild(value);
      el.manualList.appendChild(li);
    });

    // 詳しい取扱説明書
    el.deepList.innerHTML = '';
    r.deepKeys.forEach(function (key) {
      var body = r.deep[key.id] || '';
      if (!body) return;

      var item = document.createElement('div');
      item.className = 'deep-item';

      var title = document.createElement('h4');
      title.className = 'deep-item-title';
      title.textContent = key.label;

      var p = document.createElement('p');
      p.className = 'deep-item-body';
      p.textContent = body;

      item.appendChild(title);
      item.appendChild(p);
      el.deepList.appendChild(item);
    });
  }

  /* ===================== トースト ===================== */
  var toastTimer = null;
  function showToast(msg) {
    el.toastText.textContent = msg;
    el.toast.hidden = false;
    el.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.classList.remove('show');
      el.toast.hidden = true;
    }, 2400);
  }

  /* ===================== リセット ===================== */
  function resetAll() {
    state.name = '';
    state.analyzingToken++;

    if (state.left && state.left.url) URL.revokeObjectURL(state.left.url);
    if (state.right && state.right.url) URL.revokeObjectURL(state.right.url);
    state.left = null;
    state.right = null;

    el.inputName.value = '';
    clearNameError();
    clearPhoto('left');
    clearPhoto('right');

    show('top');
  }
})();
