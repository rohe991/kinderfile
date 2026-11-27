/* Kinderfile Audio-Engine: alle Melodien und Geräusche werden direkt im
   Browser mit der Web Audio API erzeugt – ganz ohne Audiodateien. */
(function () {
  'use strict';

  var SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, H: 11 };

  function noteFreq(name) {
    var m = /^([A-H])(#?)(-?\d)$/.exec(name);
    if (!m) { return 440; }
    var midi = (parseInt(m[3], 10) + 1) * 12 + SEMITONES[m[1]] + (m[2] ? 1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  var MELODIES = {
    stern: {
      label: '✨ Funkelstern',
      tempo: 108,
      notes: [
        ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2],
        ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2],
        ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
        ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
        ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2]
      ]
    },
    haenschen: {
      label: '🚶 Hänschen klein',
      tempo: 120,
      notes: [
        ['G4', 1], ['E4', 1], ['E4', 1], ['F4', 1], ['D4', 1], ['D4', 1],
        ['C4', 1], ['D4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['G4', 2],
        ['G4', 1], ['E4', 1], ['E4', 1], ['F4', 1], ['D4', 1], ['D4', 1],
        ['C4', 1], ['D4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['G4', 2]
      ]
    },
    sonne: {
      label: '🌞 Sonnentanz',
      tempo: 138,
      notes: [
        ['C4', 0.5], ['E4', 0.5], ['G4', 0.5], ['C5', 0.5], ['G4', 0.5], ['E4', 0.5], ['C4', 0.5], ['E4', 0.5],
        ['D4', 0.5], ['F4', 0.5], ['A4', 0.5], ['D5', 0.5], ['A4', 0.5], ['F4', 0.5], ['D4', 0.5], ['F4', 0.5],
        ['C4', 0.5], ['E4', 0.5], ['G4', 0.5], ['C5', 0.5], ['G4', 0.5], ['E4', 0.5], ['C5', 0.5], ['C5', 0.5],
        ['G4', 0.5], ['E4', 0.5], ['C4', 0.5], ['E4', 0.5], ['C4', 1], ['C4', 1]
      ]
    },
    mond: {
      label: '🌙 Mondwiese',
      tempo: 84,
      notes: [
        ['E4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
        ['A4', 1], ['G4', 1], ['E4', 2],
        ['F4', 1], ['E4', 1], ['D4', 1], ['C4', 3]
      ]
    },
    sternenkrieg: {
      label: '🚀 Sternenflotte',
      tempo: 126,
      wave: 'sawtooth',
      vol: 0.15,
      bass: true,
      notes: [
        ['C5', 1.5], ['G4', 0.5], ['C5', 1], ['E5', 2], ['D5', 1], ['C5', 1], ['D5', 1], ['B4', 1],
        ['G4', 1], ['A4', 1], ['B4', 1], ['C5', 2], ['G4', 1], ['E4', 1], ['C4', 2],
        ['C5', 1.5], ['G4', 0.5], ['C5', 1], ['E5', 2], ['F5', 1], ['E5', 1], ['D5', 1], ['B4', 1],
        ['G4', 1], ['A4', 1], ['B4', 1], ['C5', 3]
      ]
    },
    spannung: {
      label: '🦈 Spannung',
      tempo: 100,
      wave: 'sine',
      vol: 0.3,
      bass: true,
      notes: [
        ['E3', 0.5], ['F3', 0.5], ['E3', 0.5], ['F3', 0.5], ['E3', 0.5], ['F3', 0.5], ['E3', 0.5], ['F3', 0.5],
        ['E3', 0.5], ['F3', 0.5], ['E3', 0.5], ['F3', 0.5], ['G3', 0.5], ['F3', 0.5], ['E3', 0.5], ['F3', 0.5],
        ['E3', 0.5], ['F3', 0.5], ['E3', 0.5], ['F3', 0.5], ['E3', 0.5], ['F3', 0.5], ['E3', 0.5], ['F3', 0.5],
        ['G3', 0.5], ['G#3', 0.5], ['A3', 0.5], ['G#3', 0.5], ['G3', 0.5], ['F#3', 0.5], ['F3', 1]
      ]
    },
    abenteuer: {
      label: '🗺️ Abenteuer',
      tempo: 140,
      wave: 'triangle',
      vol: 0.22,
      bass: true,
      notes: [
        ['C4', 1], ['E4', 1], ['G4', 0.5], ['A4', 0.5], ['G4', 1], ['E4', 1],
        ['F4', 1], ['G4', 1], ['E4', 0.5], ['C4', 0.5], ['D4', 2],
        ['E4', 1], ['G4', 1], ['A4', 0.5], ['B4', 0.5], ['C5', 1], ['G4', 1],
        ['A4', 1], ['G4', 1], ['E4', 0.5], ['D4', 0.5], ['C4', 2]
      ]
    },
    geistervilla: {
      label: '👻 Geistervilla',
      tempo: 92,
      wave: 'triangle',
      vol: 0.2,
      bass: true,
      notes: [
        ['A4', 1], ['C5', 1], ['B4', 1], ['A4', 1], ['E5', 2], ['D5', 1], ['C5', 1],
        ['B4', 1], ['A4', 1], ['G4', 1], ['A4', 2], ['E4', 1], ['A4', 3]
      ]
    }
  };

  var SFX_LABELS = {
    pling: '✨ Pling',
    plop: '💧 Plop',
    ente: '🦆 Ente',
    hund: '🐶 Hund',
    boing: '🌀 Boing',
    donner: '⛈️ Donner',
    trommel: '🥁 Trommel',
    fanfare: '🎉 Fanfare'
  };

  function playTone(ac, out, opt) {
    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(opt.freq, opt.t);
    if (opt.freqEnd) {
      o.frequency.exponentialRampToValueAtTime(Math.max(20, opt.freqEnd), opt.t + opt.dur);
    }
    g.gain.setValueAtTime(0, opt.t);
    g.gain.linearRampToValueAtTime(opt.vol, opt.t + (opt.attack || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, opt.t + opt.dur);
    o.connect(g);
    g.connect(out);
    o.start(opt.t);
    o.stop(opt.t + opt.dur + 0.05);
  }

  function playNoise(ac, out, opt) {
    if (!ac.__kinderfileNoise) {
      var len = ac.sampleRate * 2;
      var buf = ac.createBuffer(1, len, ac.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) { data[i] = Math.random() * 2 - 1; }
      ac.__kinderfileNoise = buf;
    }
    var src = ac.createBufferSource();
    src.buffer = ac.__kinderfileNoise;
    src.loop = true;
    var filter = ac.createBiquadFilter();
    filter.type = opt.filter || 'lowpass';
    filter.frequency.value = opt.freq || 400;
    var g = ac.createGain();
    g.gain.setValueAtTime(0, opt.t);
    g.gain.linearRampToValueAtTime(opt.vol, opt.t + (opt.attack || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, opt.t + opt.dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(out);
    src.start(opt.t);
    src.stop(opt.t + opt.dur + 0.05);
  }

  function playSfx(ac, out, id, t, vol) {
    switch (id) {
      case 'pling':
        playTone(ac, out, { freq: 1319, t: t, dur: 0.16, vol: vol * 0.5, type: 'sine' });
        playTone(ac, out, { freq: 1760, t: t + 0.14, dur: 0.3, vol: vol * 0.5, type: 'sine' });
        break;
      case 'plop':
        playTone(ac, out, { freq: 380, freqEnd: 95, t: t, dur: 0.2, vol: vol * 0.6, type: 'sine' });
        break;
      case 'ente':
        playTone(ac, out, { freq: 320, freqEnd: 190, t: t, dur: 0.13, vol: vol * 0.25, type: 'sawtooth' });
        playTone(ac, out, { freq: 300, freqEnd: 175, t: t + 0.17, dur: 0.13, vol: vol * 0.25, type: 'sawtooth' });
        break;
      case 'hund':
        playTone(ac, out, { freq: 150, freqEnd: 95, t: t, dur: 0.1, vol: vol * 0.5, type: 'square' });
        playTone(ac, out, { freq: 150, freqEnd: 95, t: t + 0.17, dur: 0.1, vol: vol * 0.5, type: 'square' });
        break;
      case 'boing':
        playTone(ac, out, { freq: 420, freqEnd: 80, t: t, dur: 0.45, vol: vol * 0.4, type: 'triangle' });
        break;
      case 'donner':
        playNoise(ac, out, { filter: 'lowpass', freq: 320, t: t, dur: 1.3, vol: vol * 0.7, attack: 0.06 });
        playTone(ac, out, { freq: 90, freqEnd: 40, t: t, dur: 1.1, vol: vol * 0.3, type: 'sine' });
        break;
      case 'trommel':
        playNoise(ac, out, { filter: 'bandpass', freq: 160, t: t, dur: 0.16, vol: vol * 0.6 });
        playTone(ac, out, { freq: 120, freqEnd: 55, t: t, dur: 0.18, vol: vol * 0.5, type: 'sine' });
        break;
      case 'fanfare':
        playTone(ac, out, { freq: noteFreq('C5'), t: t, dur: 0.18, vol: vol * 0.3, type: 'sawtooth' });
        playTone(ac, out, { freq: noteFreq('E5'), t: t + 0.17, dur: 0.18, vol: vol * 0.3, type: 'sawtooth' });
        playTone(ac, out, { freq: noteFreq('G5'), t: t + 0.34, dur: 0.18, vol: vol * 0.3, type: 'sawtooth' });
        playTone(ac, out, { freq: noteFreq('C6'), t: t + 0.51, dur: 0.5, vol: vol * 0.3, type: 'sawtooth' });
        break;
      default:
        break;
    }
  }

  function melodyLengthSec(id) {
    var m = MELODIES[id];
    if (!m) { return 0; }
    var beats = 0;
    for (var i = 0; i < m.notes.length; i++) { beats += m.notes[i][1]; }
    return beats / m.tempo * 60;
  }

  function playMelody(ac, out, id, t0, vol) {
    var m = MELODIES[id];
    if (!m) { return; }
    var spb = 60 / m.tempo;
    var wave = m.wave || 'triangle';
    var level = vol * (m.vol || 0.22);
    var t = t0;
    for (var i = 0; i < m.notes.length; i++) {
      var note = m.notes[i];
      var dur = note[1] * spb;
      playTone(ac, out, {
        freq: noteFreq(note[0]),
        t: t,
        dur: dur * 0.9,
        vol: level,
        type: wave,
        attack: 0.015
      });
      if (m.bass) {
        playTone(ac, out, {
          freq: noteFreq(note[0]) / 2,
          t: t,
          dur: dur * 0.9,
          vol: level * 0.6,
          type: 'sine',
          attack: 0.02
        });
      }
      t += dur;
    }
    return t - t0;
  }

  window.AudioEngine = {
    MELODIES: MELODIES,
    SFX_LABELS: SFX_LABELS,
    melodyLengthSec: melodyLengthSec,
    ensure: function () {
      if (!window.__kinderfileAC) {
        window.__kinderfileAC = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (window.__kinderfileAC.state === 'suspended') {
        window.__kinderfileAC.resume();
      }
      return window.__kinderfileAC;
    },
    playMelody: playMelody,
    melodyLengthSec: melodyLengthSec,
    playSfx: playSfx
  };
})();
