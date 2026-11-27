/* Kinderfile – Logik der Kinderfilm-Web-App */
(function () {
  'use strict';

  var FRAME_W = 960;
  var FRAME_H = 540;
  var TITLE_MS = 2200;
  var FADE_MS = 400;
  var ZOOM_MAX = 0.08;
  var MIN_DUR = 500;
  var MAX_DUR = 6000;
  var DUR_STEP = 500;

  var state = { title: '', music: 'stern', volume: 0.8, scenes: [] };
  var sceneSeq = 1;

  var els = {};
  var play = {
    mode: null,
    ac: null,
    bus: null,
    raf: null,
    timeline: null,
    total: 0,
    startAt: 0,
    recorder: null,
    chunks: [],
    discard: false
  };
  var camStream = null;
  var toastTimer = null;
  var titleStars = [];

  var ID_LIST = ['stage', 'btnPlay', 'btnStop', 'btnExport', 'progressFill', 'status',
    'gallery', 'emptyHint', 'inputTitle', 'selectMusic', 'rangeVolume', 'sfxTest',
    'btnCamera', 'fileUpload', 'btnSave', 'fileLoad', 'cameraModal', 'camVideo',
    'btnSnap', 'btnCamClose', 'sceneCount', 'toast', 'snapFlash'];

  function init() {
    ID_LIST.forEach(function (id) { els[id] = document.getElementById(id); });
    els.stageCtx = els.stage.getContext('2d');

    for (var i = 0; i < 26; i++) {
      titleStars.push({ x: Math.random() * FRAME_W, y: Math.random() * FRAME_H, r: 1 + Math.random() * 2.4 });
    }

    buildMusicSelect();
    buildSfxTest();

    els.btnCamera.addEventListener('click', openCamera);
    els.btnSnap.addEventListener('click', snapPhoto);
    els.btnCamClose.addEventListener('click', closeCamera);
    els.fileUpload.addEventListener('change', onFilesSelected);
    els.fileLoad.addEventListener('change', onProjectLoad);
    els.btnSave.addEventListener('click', saveProject);
    els.inputTitle.addEventListener('input', function () { state.title = els.inputTitle.value; });
    els.selectMusic.addEventListener('change', onMusicChange);
    els.rangeVolume.addEventListener('input', onVolumeChange);
    els.btnPlay.addEventListener('click', startPreview);
    els.btnExport.addEventListener('click', startExport);
    els.btnStop.addEventListener('click', stopAll);
    els.gallery.addEventListener('click', onGalleryClick);
    els.gallery.addEventListener('change', onGalleryChange);
    window.addEventListener('beforeunload', function (e) {
      if (state.scenes.length) { e.preventDefault(); e.returnValue = ''; }
    });

    renderAll();
  }

  /* ---------- Szenen ---------- */

  function makeScene(img) {
    var s = {
      id: sceneSeq++,
      img: img,
      bitmap: null,
      broken: false,
      ready: null,
      duration: 2000,
      sound: 'kein',
      active: true
    };
    loadBitmap(s);
    return s;
  }

  function loadBitmap(s) {
    s.ready = new Promise(function (resolve) {
      var im = new window.Image();
      im.onload = function () { s.bitmap = im; resolve(); };
      im.onerror = function () { s.broken = true; resolve(); };
      im.src = s.img;
    });
  }

  function addPhoto(dataUrl) {
    state.scenes.push(makeScene(dataUrl));
    renderAll();
  }

  function fmtDur(ms) {
    return (ms / 1000).toFixed(1).replace('.', ',') + ' s';
  }

  function onGalleryClick(e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) { return; }
    var card = e.target.closest('[data-idx]');
    if (!card) { return; }
    var idx = parseInt(card.getAttribute('data-idx'), 10);
    var scene = state.scenes[idx];
    if (!scene) { return; }
    var act = btn.getAttribute('data-act');

    if (act === 'left' && idx > 0) {
      state.scenes.splice(idx - 1, 0, state.scenes.splice(idx, 1)[0]);
    } else if (act === 'right' && idx < state.scenes.length - 1) {
      state.scenes.splice(idx + 1, 0, state.scenes.splice(idx, 1)[0]);
    } else if (act === 'active') {
      scene.active = !scene.active;
    } else if (act === 'del') {
      if (window.confirm('Diese Szene wirklich löschen?')) {
        state.scenes.splice(idx, 1);
        showToast('🗑️ Szene gelöscht');
      }
    } else if (act === 'dur-') {
      scene.duration = Math.max(MIN_DUR, scene.duration - DUR_STEP);
    } else if (act === 'dur+') {
      scene.duration = Math.min(MAX_DUR, scene.duration + DUR_STEP);
    }
    renderAll();
  }

  function onGalleryChange(e) {
    var sel = e.target.closest('select[data-act="sound"]');
    if (!sel) { return; }
    var card = e.target.closest('[data-idx]');
    if (!card) { return; }
    var scene = state.scenes[parseInt(card.getAttribute('data-idx'), 10)];
    if (!scene) { return; }
    scene.sound = sel.value;
  }

  function renderAll() {
    renderGallery();
    updateCount();
    if (!play.mode) { drawIdle(); }
  }

  function renderGallery() {
    els.gallery.innerHTML = '';
    state.scenes.forEach(function (scene, idx) {
      var card = document.createElement('div');
      card.className = 'scene' + (scene.active ? '' : ' inactive');
      card.setAttribute('data-idx', String(idx));

      var head = document.createElement('div');
      head.className = 'scene-head';
      head.innerHTML = '<span>Szene ' + (idx + 1) + '</span><span>' +
        (scene.active ? '👀 im Film' : '😴 pausiert') + '</span>';

      var thumb = document.createElement('img');
      thumb.className = 'thumb';
      thumb.alt = 'Szene ' + (idx + 1);
      thumb.src = scene.img;

      var act = document.createElement('div');
      act.className = 'btnrow scene-ctrl';
      act.appendChild(miniBtn('left', idx > 0 ? '⬅️' : '↔️', 'Nach vorn tauschen'));
      act.appendChild(miniBtn('right', idx < state.scenes.length - 1 ? '➡️' : '↔️', 'Nach hinten tauschen'));
      act.appendChild(miniBtn('active', scene.active ? '⏸️' : '▶️', 'Aktivieren/deaktivieren'));
      act.appendChild(miniBtn('del', '🗑️', 'Löschen'));

      var durRow = document.createElement('div');
      durRow.className = 'scene-row';
      durRow.appendChild(miniBtn('dur-', '−', 'Schneller'));
      var dur = document.createElement('span');
      dur.className = 'dur';
      dur.textContent = fmtDur(scene.duration);
      durRow.appendChild(dur);
      durRow.appendChild(miniBtn('dur+', '+', 'Länger'));

      var soundRow = document.createElement('div');
      soundRow.className = 'scene-row';
      var select = document.createElement('select');
      select.setAttribute('data-act', 'sound');
      select.appendChild(new Option('🔇 Ton: keiner', 'kein', false, scene.sound === 'kein'));
      Object.keys(window.AudioEngine.SFX_LABELS).forEach(function (id) {
        select.appendChild(new Option(window.AudioEngine.SFX_LABELS[id], id, false, scene.sound === id));
      });
      soundRow.appendChild(select);

      card.appendChild(head);
      card.appendChild(thumb);
      card.appendChild(act);
      card.appendChild(durRow);
      card.appendChild(soundRow);
      els.gallery.appendChild(card);
    });
    els.emptyHint.hidden = state.scenes.length > 0;
  }

  function miniBtn(act, label, title) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-mini';
    b.setAttribute('data-act', act);
    b.title = title;
    b.setAttribute('aria-label', title);
    b.textContent = label;
    return b;
  }

  function updateCount() {
    if (!state.scenes.length) {
      els.sceneCount.textContent = '';
      return;
    }
    var active = state.scenes.filter(function (s) { return s.active; });
    var total = state.title.trim() ? TITLE_MS : 0;
    active.forEach(function (s) { total += s.duration; });
    els.sceneCount.textContent = '📦 ' + state.scenes.length + ' Szenen (' +
      active.length + ' im Film) – Filmlänge: ' + fmtDur(total);
  }

  /* ---------- Fotos ---------- */

  function openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Dein Browser unterstützt die Kamera leider nicht. 🙈');
      return;
    }
    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false
    }).then(function (stream) {
      camStream = stream;
      els.camVideo.srcObject = stream;
      els.cameraModal.hidden = false;
    }).catch(function () {
      showToast('Kein Kamerazugriff. Bitte erlauben! 🙏');
    });
  }

  function closeCamera() {
    if (camStream) {
      camStream.getTracks().forEach(function (t) { t.stop(); });
      camStream = null;
    }
    els.camVideo.srcObject = null;
    els.cameraModal.hidden = true;
  }

  function snapPhoto() {
    var v = els.camVideo;
    if (!v.videoWidth) {
      showToast('Die Kamera ist noch nicht bereit – gib ihr einen Moment. 📷');
      return;
    }
    var scale = Math.min(1, 1280 / v.videoWidth);
    var c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    var ctx = c.getContext('2d');
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, c.width, c.height);
    addPhoto(c.toDataURL('image/jpeg', 0.85));
    els.snapFlash.classList.remove('flash');
    void els.snapFlash.offsetWidth;
    els.snapFlash.classList.add('flash');
    showToast('📸 Knipps! Szene ' + state.scenes.length + ' ist da.');
  }

  function onFilesSelected(e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    files.forEach(function (file) {
      var reader = new FileReader();
      reader.onload = function () {
        shrinkImage(String(reader.result), function (dataUrl) { addPhoto(dataUrl); });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function shrinkImage(dataUrl, cb) {
    var im = new window.Image();
    im.onload = function () {
      var scale = Math.min(1, 1280 / Math.max(im.width, im.height));
      if (scale >= 1) { cb(dataUrl); return; }
      var c = document.createElement('canvas');
      c.width = Math.round(im.width * scale);
      c.height = Math.round(im.height * scale);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', 0.85));
    };
    im.onerror = function () { showToast('Das Bild konnte ich leider nicht lesen. 😕'); };
    im.src = dataUrl;
  }

  /* ---------- Projekt speichern / laden ---------- */

  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function saveProject() {
    if (!state.scenes.length) { showToast('Erst ein Foto aufnehmen! 📸'); return; }
    var data = {
      app: 'kinderfile',
      version: 1,
      title: state.title,
      music: state.music,
      volume: state.volume,
      scenes: state.scenes.map(function (s) {
        return { img: s.img, duration: s.duration, sound: s.sound, active: s.active };
      })
    };
    downloadBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), 'kinderfilm-projekt.json');
    showToast('💾 Projekt gespeichert!');
  }

  function onProjectLoad(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) { return; }
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try {
        data = JSON.parse(String(reader.result));
      } catch (err) {
        showToast('Das ist keine Projekt-Datei. 😕');
        return;
      }
      if (!data || data.app !== 'kinderfile' || !Array.isArray(data.scenes) || !data.scenes.length) {
        showToast('Das Projekt sieht kaputt aus. 😕');
        return;
      }
      stopAll();
      state.title = typeof data.title === 'string' ? data.title : '';
      els.inputTitle.value = state.title;
      state.music = window.AudioEngine.MELODIES[data.music] ? data.music : 'stern';
      els.selectMusic.value = state.music;
      state.volume = typeof data.volume === 'number' ? Math.min(1, Math.max(0, data.volume)) : 0.8;
      els.rangeVolume.value = Math.round(state.volume * 100);
      state.scenes = data.scenes
        .filter(function (s) { return s && typeof s.img === 'string' && s.img.indexOf('data:image') === 0; })
        .map(function (s) {
          var scene = makeScene(s.img);
          scene.duration = Math.min(MAX_DUR, Math.max(MIN_DUR, Number(s.duration) || 2000));
          scene.sound = s.sound && window.AudioEngine.SFX_LABELS[s.sound] ? s.sound : 'kein';
          scene.active = s.active !== false;
          return scene;
        });
      renderAll();
      showToast('📂 Projekt geladen! 🎉');
    };
    reader.readAsText(file);
  }

  /* ---------- Musik & Töne ---------- */

  function buildMusicSelect() {
    els.selectMusic.appendChild(new Option('🔇 Keine Musik', 'none', false, state.music === 'none'));
    Object.keys(window.AudioEngine.MELODIES).forEach(function (id) {
      els.selectMusic.appendChild(new Option(window.AudioEngine.MELODIES[id].label, id, false, state.music === id));
    });
  }

  function onMusicChange() {
    state.music = els.selectMusic.value;
    if (state.music === 'none') { return; }
    var ac = window.AudioEngine.ensure();
    window.AudioEngine.playMelody(ac, ac.destination, state.music, ac.currentTime + 0.05, state.volume);
  }

  function onVolumeChange() {
    state.volume = parseInt(els.rangeVolume.value, 10) / 100;
    if (play.bus) { play.bus.gain.value = state.volume; }
  }

  function buildSfxTest() {
    Object.keys(window.AudioEngine.SFX_LABELS).forEach(function (id) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-mini';
      b.textContent = window.AudioEngine.SFX_LABELS[id];
      b.addEventListener('click', function () {
        var ac = window.AudioEngine.ensure();
        window.AudioEngine.playSfx(ac, ac.destination, id, ac.currentTime + 0.05, state.volume);
      });
      els.sfxTest.appendChild(b);
    });
  }

  /* ---------- Film-Zeitachse & Rendern ---------- */

  function buildTimeline() {
    var t = 0;
    var segs = [];
    state.scenes.forEach(function (s) {
      if (!s.active) { return; }
      segs.push({ scene: s, start: t, end: t + s.duration });
      t += s.duration;
    });
    return { segs: segs, total: t };
  }

  function ensureBitmaps(timeline) {
    return Promise.all(timeline.segs.map(function (seg) {
      if (seg.scene.broken) { return; }
      return seg.scene.ready;
    }));
  }

  function drawCover(ctx, img, zoom) {
    var scale = Math.max(FRAME_W / img.naturalWidth, FRAME_H / img.naturalHeight) * zoom;
    var w = img.naturalWidth * scale;
    var h = img.naturalHeight * scale;
    ctx.drawImage(img, (FRAME_W - w) / 2, (FRAME_H - h) / 2, w, h);
  }

  function drawSceneImg(ctx, scene, localMs, durMs) {
    if (scene.broken || !scene.bitmap || !scene.bitmap.complete) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);
      return;
    }
    var zoom = 1 + ZOOM_MAX * (localMs / Math.max(1, durMs));
    drawCover(ctx, scene.bitmap, zoom);
  }

  function drawTitleCard(localMs) {
    var ctx = els.stageCtx;
    var fadeIn = 300;
    var a;
    if (localMs < fadeIn) {
      a = localMs / fadeIn;
    } else if (localMs > TITLE_MS - FADE_MS) {
      a = Math.max(0, (TITLE_MS - localMs) / FADE_MS);
    } else {
      a = 1;
    }
    ctx.save();
    var bg = ctx.createLinearGradient(0, 0, 0, FRAME_H);
    bg.addColorStop(0, '#1a1a3e');
    bg.addColorStop(1, '#2d1b4e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, FRAME_W, FRAME_H);
    ctx.fillStyle = '#ffe98a';
    titleStars.forEach(function (st) {
      ctx.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin((localMs / 500) + st.x)));
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 58px "Baloo 2", "Comic Sans MS", sans-serif';
    ctx.shadowColor = 'rgba(255, 93, 143, 0.8)';
    ctx.shadowBlur = 24;
    ctx.fillText(state.title.trim().slice(0, 40), FRAME_W / 2, FRAME_H / 2);
    ctx.restore();
  }

  function renderFrame(tMs) {
    var ctx = els.stageCtx;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, FRAME_W, FRAME_H);
    var hasTitle = !!state.title.trim();
    var sceneT = hasTitle ? tMs - TITLE_MS : tMs;
    if (hasTitle && sceneT < 0) {
      drawTitleCard(sceneT + TITLE_MS);
      return;
    }
    var tl = play.timeline;
    if (!tl || !tl.segs.length) { return; }
    var i = 0;
    while (i < tl.segs.length && sceneT >= tl.segs[i].end) { i++; }
    if (i >= tl.segs.length || sceneT < tl.segs[i].start) { return; }
    var seg = tl.segs[i];
    var local = sceneT - seg.start;
    var prev = i > 0 ? tl.segs[i - 1] : null;
    if (prev && local < FADE_MS && prev.scene.bitmap && prev.scene.bitmap.complete) {
      drawSceneImg(ctx, prev.scene, prev.end - prev.start, prev.scene.duration);
      ctx.globalAlpha = local / FADE_MS;
      drawSceneImg(ctx, seg.scene, local, seg.scene.duration);
      ctx.globalAlpha = 1;
    } else {
      drawSceneImg(ctx, seg.scene, local, seg.scene.duration);
    }
  }

  function drawIdle() {
    var ctx = els.stageCtx;
    var bg = ctx.createLinearGradient(0, 0, 0, FRAME_H);
    bg.addColorStop(0, '#2b1f66');
    bg.addColorStop(1, '#0d0d24');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, FRAME_W, FRAME_H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 74px "Baloo 2", "Comic Sans MS", sans-serif';
    ctx.fillText('🎬', FRAME_W / 2, FRAME_H / 2 - 40);
    ctx.font = 'bold 34px "Baloo 2", "Comic Sans MS", sans-serif';
    ctx.fillText('Dein Film erscheint hier!', FRAME_W / 2, FRAME_H / 2 + 50);
    ctx.font = '22px "Baloo 2", "Comic Sans MS", sans-serif';
    ctx.fillStyle = '#c9c9ee';
    ctx.fillText('Knipse Fotos und drück auf ▶️ Vorschau', FRAME_W / 2, FRAME_H / 2 + 100);
  }

  /* ---------- Abspielen & Export ---------- */

  function scheduleAudio(ac, out, t0, timeline) {
    if (state.music !== 'none' && timeline.segs.length) {
      var len = window.AudioEngine.melodyLengthSec(state.music);
      var loops = Math.min(80, Math.ceil((play.total / 1000) / (len || 1)));
      for (var i = 0; i < loops; i++) {
        window.AudioEngine.playMelody(ac, out, state.music, t0 + i * len, 1);
      }
    }
    var sceneT0 = t0 + (state.title.trim() ? TITLE_MS : 0) / 1000;
    timeline.segs.forEach(function (seg) {
      if (seg.scene.sound !== 'kein') {
        window.AudioEngine.playSfx(ac, out, seg.scene.sound, sceneT0 + seg.start / 1000, 1);
      }
    });
  }

  function setStatus(text) { els.status.textContent = text; }

  function updateProgress(p) {
    els.progressFill.style.width = Math.round(Math.min(1, Math.max(0, p)) * 100) + '%';
  }

  function setPlayingUI(playing) {
    els.btnPlay.disabled = playing;
    els.btnExport.disabled = playing;
    els.btnCamera.disabled = playing;
    els.btnSave.disabled = playing;
    els.btnStop.disabled = !playing;
    els.fileUpload.disabled = playing;
    els.fileLoad.disabled = playing;
  }

  function startPlayback(mode) {
    if (play.mode) { return Promise.resolve(false); }
    var timeline = buildTimeline();
    if (!timeline.segs.length) {
      showToast('Erst ein Foto aufnehmen (oder eine Szene aktivieren)! 📸');
      return Promise.resolve(false);
    }
    play.total = (state.title.trim() ? TITLE_MS : 0) + timeline.total;
    return ensureBitmaps(timeline).then(function () {
      if (play.mode) { return false; }
      var ac = window.AudioEngine.ensure();
      play.ac = ac;
      play.timeline = timeline;
      play.bus = ac.createGain();
      play.bus.gain.value = state.volume;
      play.mode = mode;
      play.chunks = [];
      var t0 = ac.currentTime + 0.15;
      play.startAt = t0;
      return ac.resume().then(function () {
        if (mode === 'export') {
          if (!window.MediaRecorder || !els.stage.captureStream) {
            showToast('Video-Export geht in diesem Browser leider nicht. Probier Chrome! 🙈');
            play.mode = null;
            play.bus = null;
            return false;
          }
          var mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
            .filter(function (m) { return MediaRecorder.isTypeSupported(m); })[0];
          if (!mime) {
            showToast('WebM wird hier leider nicht unterstützt. Probier Chrome! 🙈');
            play.mode = null;
            play.bus = null;
            return false;
          }
          var dest = ac.createMediaStreamDestination();
          play.bus.connect(dest);
          play.bus.connect(ac.destination);
          var stream = els.stage.captureStream(30);
          stream.getVideoTracks().forEach(function (track) { dest.stream.addTrack(track); });
          play.recorder = new MediaRecorder(dest.stream, {
            mimeType: mime,
            videoBitsPerSecond: 4000000
          });
          play.recorder.ondataavailable = function (e) {
            if (e.data && e.data.size) { play.chunks.push(e.data); }
          };
          play.recorder.onstop = function () {
            var wasDiscard = play.discard;
            stopPlaybackUI();
            if (!wasDiscard) {
              downloadBlob(new Blob(play.chunks, { type: 'video/webm' }), 'kinderfilm.webm');
              showToast('🎉 Dein Film ist gespeichert!');
              setStatus('Film als kinderfilm.webm gespeichert! ⭐');
            } else {
              setStatus('Export abgebrochen.');
            }
          };
          renderFrame(0);
          play.recorder.start(250);
          setStatus('🎬 Export läuft – dein Film wird aufgenommen …');
        } else {
          play.bus.connect(ac.destination);
          setStatus('🍿 Vorschau läuft …');
        }
        scheduleAudio(ac, play.bus, t0, timeline);
        play.raf = requestAnimationFrame(tick);
        setPlayingUI(true);
        return true;
      });
    });
  }

  function tick() {
    if (!play.mode) { return; }
    var t = (play.ac.currentTime - play.startAt) * 1000;
    if (t >= play.total) {
      renderFrame(play.total);
      if (play.mode === 'export' && play.recorder) {
        play.recorder.stop();
        play.recorder = null;
      }
      stopPlaybackUI();
      return;
    }
    renderFrame(t);
    updateProgress(t / play.total);
    play.raf = requestAnimationFrame(tick);
  }

  function stopPlaybackUI() {
    if (play.raf) { cancelAnimationFrame(play.raf); }
    play.raf = null;
    var wasMode = play.mode;
    play.mode = null;
    play.discard = false;
    play.timeline = null;
    var bus = play.bus;
    play.bus = null;
    play.ac = null;
    if (bus) {
      try { bus.disconnect(); } catch (e) { /* schon getrennt */ }
    }
    setPlayingUI(false);
    updateProgress(0);
    if (wasMode === 'preview') {
      setStatus('Bereit! Nochmal? 🍿');
    }
    drawIdle();
  }

  function startPreview() {
    startPlayback('preview');
  }

  function startExport() {
    startPlayback('export');
  }

  function stopAll() {
    if (!play.mode) { return; }
    if (play.mode === 'export' && play.recorder) {
      play.discard = true;
      var rec = play.recorder;
      play.recorder = null;
      try { rec.stop(); } catch (e) { /* läuft schon nicht mehr */ }
      return;
    }
    stopPlaybackUI();
  }

  /* ---------- Toast ---------- */

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    if (toastTimer) { clearTimeout(toastTimer); }
    toastTimer = setTimeout(function () { els.toast.hidden = true; }, 2600);
  }

  init();
})();
