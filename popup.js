/**
 * popup.js
 * Logic for Morse Code Picture Translator Chrome Extension Popup.
 * Zero-CSP violations, 100% offline-first, uses chrome.storage.local.
 */

(function () {
  'use strict';

  // State
  const state = {
    mode: 'morse',
    swapped: false,
    isPlaying: false,
    isPaused: false,
    audioCtx: null,
    events: [],
    totalDuration: 0,
    rafId: null,
    oscs: [],
    eventIndex: 0,
    lastVisualState: null,
    saveDebounceTimer: null
  };

  // DOM Elements
  const el = {};

  function initElements() {
    el.app = document.getElementById('mc-translator-app');
    el.topLightbulb = document.getElementById('top-lightbulb');
    el.btnOpenTab = document.getElementById('btn-open-tab');

    // Nav tabs
    el.navTabs = document.querySelectorAll('.nav-tab');
    el.tabContents = document.querySelectorAll('.tab-content');

    // Mode toggles
    el.modeBtnMorse = document.getElementById('mode-btn-morse');
    el.modeBtnText = document.getElementById('mode-btn-text');

    // Text & Morse Boxes
    el.boxText = document.getElementById('box-text');
    el.boxMorse = document.getElementById('box-morse');
    el.textInput = document.getElementById('text-input');
    el.morseInput = document.getElementById('morse-input');
    el.countText = document.getElementById('count-text');
    el.countMorse = document.getElementById('count-morse');
    el.swapBtn = document.getElementById('swap-btn');
    el.btnCopyText = document.getElementById('btn-copy-text');
    el.btnClearText = document.getElementById('btn-clear-text');
    el.btnCopyMorse = document.getElementById('btn-copy-morse');
    el.btnClearMorse = document.getElementById('btn-clear-morse');

    // Canvas
    el.canvas = document.getElementById('mc-canvas');
    el.canvasDimBadge = document.getElementById('canvas-dim-badge');
    el.sizeSlider = document.getElementById('mc-size-slider');
    el.sizeVal = document.getElementById('mc-size-val');
    el.fgColor = document.getElementById('mc-fg-color');
    el.bgColor = document.getElementById('mc-bg-color');
    el.btnDownloadPicture = document.getElementById('btn-download-picture');

    // Scanner
    el.uploadZone = document.getElementById('mc-upload-zone');
    el.fileInput = document.getElementById('mc-file-input');
    el.btnBrowseFile = document.getElementById('btn-browse-file');
    el.progressWrap = document.getElementById('mc-progress-wrap');
    el.progressBar = document.getElementById('mc-progress-bar');
    el.statusText = document.getElementById('mc-status-text');

    // Audio
    el.btnPlayAudio = document.getElementById('btn-play-audio');
    el.btnPauseAudio = document.getElementById('btn-pause-audio');
    el.btnStopAudio = document.getElementById('btn-stop-audio');
    el.repeatOpt = document.getElementById('repeat-opt');
    el.soundOpt = document.getElementById('sound-opt');
    el.lightOpt = document.getElementById('light-opt');
    el.vibrateOpt = document.getElementById('vibrate-opt');
    el.soundType = document.getElementById('sound-type');
    el.speedSlider = document.getElementById('speed-slider');
    el.speedVal = document.getElementById('speed-val');
    el.pitchSlider = document.getElementById('pitch-slider');
    el.pitchVal = document.getElementById('pitch-val');
    el.volumeSlider = document.getElementById('volume-slider');
    el.volumeVal = document.getElementById('volume-val');
    el.btnSaveAudio = document.getElementById('btn-save-audio');
    el.btnCopyLink = document.getElementById('btn-copy-link');
    el.btnClearAll = document.getElementById('btn-clear-all');

    // Reference Chart
    el.chartFilter = document.getElementById('chart-filter');
    el.chartGrid = document.getElementById('mc-chart-grid');

    // Toast
    el.toast = document.getElementById('mc-toast');
  }

  // Toast Notification
  function showToast(message) {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.classList.add('show');
    clearTimeout(el.toastTimer);
    el.toastTimer = setTimeout(() => {
      el.toast.classList.remove('show');
    }, 2400);
  }

  // Tab Switcher
  function switchTab(tabId) {
    el.navTabs.forEach((tab) => {
      const active = tab.dataset.tab === tabId;
      tab.classList.toggle('active', active);
    });
    el.tabContents.forEach((content) => {
      const active = content.id === tabId;
      content.classList.toggle('active', active);
    });
  }

  // Update Counters
  function updateCounters() {
    const textLen = el.textInput.value.length;
    const morseVal = el.morseInput.value.trim();
    const morseSymbols = morseVal ? morseVal.split(/\s+/).filter(Boolean).length : 0;
    el.countText.textContent = `${textLen} char${textLen === 1 ? '' : 's'}`;
    el.countMorse.textContent = `${morseSymbols} symbol${morseSymbols === 1 ? '' : 's'}`;
  }

  // Render Canvas
  function updateCanvas() {
    const morse = el.morseInput.value;
    const size = parseInt(el.sizeSlider.value, 10) || 20;
    const fg = el.fgColor.value || '#0f172a';
    const bg = el.bgColor.value || '#ffffff';
    const dims = MorseCore.drawMorseCanvas(el.canvas, morse, { size, fgColor: fg, bgColor: bg });
    if (el.canvasDimBadge) {
      el.canvasDimBadge.textContent = `${dims.width} × ${dims.height}`;
    }
  }

  // Save Settings to Storage (Debounced)
  function saveStateToStorage() {
    clearTimeout(state.saveDebounceTimer);
    state.saveDebounceTimer = setTimeout(() => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          textInput: el.textInput.value,
          morseInput: el.morseInput.value,
          mode: state.mode,
          swapped: state.swapped,
          size: el.sizeSlider.value,
          fgColor: el.fgColor.value,
          bgColor: el.bgColor.value,
          speed: el.speedSlider.value,
          pitch: el.pitchSlider.value,
          volume: el.volumeSlider.value,
          soundType: el.soundType.value,
          soundOpt: el.soundOpt.checked,
          lightOpt: el.lightOpt.checked,
          vibrateOpt: el.vibrateOpt.checked,
          repeatOpt: el.repeatOpt.checked
        });
      }
    }, 250);
  }

  // Restore State from Storage
  function restoreStateFromStorage() {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      updateCanvas();
      updateCounters();
      return;
    }

    chrome.storage.local.get([
      'textInput', 'morseInput', 'mode', 'swapped', 'size',
      'fgColor', 'bgColor', 'speed', 'pitch', 'volume',
      'soundType', 'soundOpt', 'lightOpt', 'vibrateOpt', 'repeatOpt',
      'pendingText'
    ], (stored) => {
      if (!stored) return;

      // Handle pending text from right-click context menu
      if (stored.pendingText) {
        el.textInput.value = stored.pendingText;
        el.morseInput.value = MorseCore.textToMorse(stored.pendingText);
        chrome.storage.local.remove('pendingText');
      } else {
        if (stored.textInput !== undefined) el.textInput.value = stored.textInput;
        if (stored.morseInput !== undefined) el.morseInput.value = stored.morseInput;
      }

      if (stored.mode) setMode(stored.mode);
      if (stored.swapped) setSwap(stored.swapped);

      if (stored.size) {
        el.sizeSlider.value = stored.size;
        el.sizeVal.textContent = `${stored.size}px`;
      }
      if (stored.fgColor) el.fgColor.value = stored.fgColor;
      if (stored.bgColor) el.bgColor.value = stored.bgColor;

      if (stored.speed) {
        el.speedSlider.value = stored.speed;
        el.speedVal.textContent = `${stored.speed} wpm`;
      }
      if (stored.pitch) {
        el.pitchSlider.value = stored.pitch;
        el.pitchVal.textContent = `${stored.pitch} Hz`;
      }
      if (stored.volume) {
        el.volumeSlider.value = stored.volume;
        el.volumeVal.textContent = `${stored.volume}%`;
      }
      if (stored.soundType) el.soundType.value = stored.soundType;

      if (stored.soundOpt !== undefined) el.soundOpt.checked = stored.soundOpt;
      if (stored.lightOpt !== undefined) el.lightOpt.checked = stored.lightOpt;
      if (stored.vibrateOpt !== undefined) el.vibrateOpt.checked = stored.vibrateOpt;
      if (stored.repeatOpt !== undefined) el.repeatOpt.checked = stored.repeatOpt;

      updateCounters();
      updateCanvas();
    });
  }

  // Mode Selection
  function setMode(mode) {
    state.mode = mode;
    if (el.modeBtnMorse) el.modeBtnMorse.classList.toggle('mc-active', mode === 'morse');
    if (el.modeBtnText) el.modeBtnText.classList.toggle('mc-active', mode === 'text');
    saveStateToStorage();
  }

  // Swap Layout Order
  function setSwap(swapped) {
    state.swapped = swapped;
    if (el.boxText && el.boxMorse) {
      el.boxText.style.order = swapped ? '3' : '1';
      el.boxMorse.style.order = swapped ? '1' : '3';
    }
  }

  // Download Picture
  function downloadCanvas() {
    if (!el.morseInput.value.trim()) {
      showToast('Enter some text first!');
      return;
    }
    const dataUrl = el.canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'morse_code_picture.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Morse picture downloaded!');
  }

  // Audio Playback Engine
  function getAudioContext() {
    if (!state.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AudioCtx();
    }
    return state.audioCtx;
  }

  function setVisualSignal(isLit) {
    if (isLit === state.lastVisualState) return;
    state.lastVisualState = isLit;

    if (el.topLightbulb) {
      el.topLightbulb.classList.toggle('lit', isLit);
    }

    const lightFlashEnabled = el.lightOpt ? el.lightOpt.checked : false;
    const boxes = [el.boxText, el.boxMorse];
    boxes.forEach((box) => {
      if (!box) return;
      if (isLit && lightFlashEnabled) {
        box.classList.add('tool-flash');
      } else {
        box.classList.remove('tool-flash');
      }
    });
  }

  function syncAudioVisuals() {
    if (!state.isPlaying) return;
    if (state.isPaused) {
      state.rafId = requestAnimationFrame(syncAudioVisuals);
      return;
    }

    const ctx = state.audioCtx;
    if (!ctx || ctx.state !== 'running') {
      state.rafId = requestAnimationFrame(syncAudioVisuals);
      return;
    }

    const curTime = ctx.currentTime;
    let lit = false;

    while (state.eventIndex < state.events.length) {
      if (curTime <= state.events[state.eventIndex].end) break;
      state.eventIndex++;
    }

    if (state.eventIndex < state.events.length) {
      const ev = state.events[state.eventIndex];
      if (curTime >= ev.start && curTime <= ev.end) {
        lit = true;
        if (!ev.vibrated && el.vibrateOpt && el.vibrateOpt.checked && navigator.vibrate) {
          navigator.vibrate(Math.round((ev.end - curTime) * 1000));
          ev.vibrated = true;
        }
      }
    }

    setVisualSignal(lit);

    if (curTime > state.totalDuration) {
      stopAudio();
      if (el.repeatOpt && el.repeatOpt.checked) {
        setTimeout(playAudio, 400);
      }
      return;
    }

    state.rafId = requestAnimationFrame(syncAudioVisuals);
  }

  function playAudio() {
    if (state.isPlaying) {
      if (state.isPaused) {
        if (state.audioCtx) state.audioCtx.resume();
        state.isPaused = false;
        syncAudioVisuals();
      }
      return;
    }

    const morse = el.morseInput.value.trim();
    if (!morse) {
      showToast('No Morse code to play! Type some text first.');
      return;
    }

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const wpm = parseInt(el.speedSlider.value, 10) || 20;
    const pitch = parseInt(el.pitchSlider.value, 10) || 600;
    const volume = (parseInt(el.volumeSlider.value, 10) || 50) / 100;
    const soundType = el.soundType.value || 'cw';
    const soundEnabled = el.soundOpt.checked;

    const t0 = ctx.currentTime + 0.05;
    const data = MorseCore.buildMorseAudioEvents(morse, wpm);

    state.events = data.events.map((ev) => ({
      start: t0 + ev.start,
      end: t0 + ev.end,
      type: ev.type,
      vibrated: false
    }));

    state.totalDuration = t0 + data.totalDuration;
    state.eventIndex = 0;
    state.isPlaying = true;
    state.isPaused = false;

    if (soundEnabled) {
      state.oscs = MorseCore.scheduleMorseAudio(ctx, state.events, t0, { pitch, volume, soundType });
    }

    syncAudioVisuals();
  }

  function pauseAudio() {
    if (!state.isPlaying || state.isPaused) return;
    if (state.audioCtx) state.audioCtx.suspend();
    state.isPaused = true;
    setVisualSignal(false);
    if (navigator.vibrate) navigator.vibrate(0);
  }

  function stopAudio() {
    if (state.audioCtx) {
      try { state.audioCtx.close(); } catch (e) {}
      state.audioCtx = null;
    }
    state.oscs.forEach((osc) => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    state.oscs = [];
    state.isPlaying = false;
    state.isPaused = false;
    state.eventIndex = 0;
    cancelAnimationFrame(state.rafId);
    setVisualSignal(false);
    if (navigator.vibrate) navigator.vibrate(0);
  }

  // Save Audio WAV
  function saveAudioWav() {
    const morse = el.morseInput.value.trim();
    if (!morse) {
      showToast('Nothing to save! Type some text first.');
      return;
    }

    showToast('Rendering WAV audio...');
    const wpm = parseInt(el.speedSlider.value, 10) || 20;
    const pitch = parseInt(el.pitchSlider.value, 10) || 600;
    const volume = (parseInt(el.volumeSlider.value, 10) || 50) / 100;
    const soundType = el.soundType.value || 'cw';

    MorseCore.renderWavBlob(morse, { wpm, pitch, volume, soundType })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'morse_code.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Audio (.wav) saved!');
      })
      .catch((err) => {
        console.error('WAV render error:', err);
        showToast('Error generating audio file.');
      });
  }

  // Offline Image Processing (BFS Shape Scanner)
  function handleImageFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image (PNG, JPG, WebP).');
      return;
    }

    el.progressWrap.style.display = 'flex';
    el.progressBar.style.width = '25%';
    el.statusText.textContent = 'Loading image...';

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      el.statusText.textContent = 'Failed to load image.';
      setTimeout(() => {
        el.progressWrap.style.display = 'none';
        el.progressBar.style.width = '0%';
      }, 2500);
    };

    img.onload = () => {
      el.progressBar.style.width = '60%';
      el.statusText.textContent = 'Scanning shapes locally...';

      MorseCore.scanPixelsForMorse(img).then((morseResult) => {
        URL.revokeObjectURL(objectUrl);
        if (morseResult) {
          el.progressBar.style.width = '100%';
          el.statusText.textContent = 'Morse code detected!';
          const textResult = MorseCore.morseToText(morseResult);

          el.morseInput.value = morseResult;
          el.textInput.value = textResult;
          updateCounters();
          updateCanvas();
          saveStateToStorage();

          showToast('Morse code extracted successfully!');
          setTimeout(() => {
            el.progressWrap.style.display = 'none';
            el.progressBar.style.width = '0%';
            // Switch to Translate view so user sees decoded result
            switchTab('tab-translate');
          }, 1200);
        } else {
          el.progressBar.style.width = '100%';
          el.statusText.textContent = 'No Morse patterns recognized.';
          showToast('No clear Morse shapes detected.');
          setTimeout(() => {
            el.progressWrap.style.display = 'none';
            el.progressBar.style.width = '0%';
          }, 3000);
        }
      });
    };

    img.src = objectUrl;
  }

  // Populate Reference Chart
  function buildReferenceChart(filterQuery = '') {
    if (!el.chartGrid) return;
    el.chartGrid.innerHTML = '';
    const q = filterQuery.toUpperCase().trim();
    const keys = Object.keys(MorseCore.MORSE_MAP).filter((k) => k !== ' ');

    keys.forEach((key) => {
      const code = MorseCore.MORSE_MAP[key];
      if (q && !key.includes(q) && !code.includes(q)) return;

      const item = document.createElement('div');
      item.className = 'chart-item';

      const letterSpan = document.createElement('span');
      letterSpan.className = 'chart-letter';
      letterSpan.textContent = key;

      const morseSpan = document.createElement('span');
      morseSpan.className = 'chart-morse';
      morseSpan.textContent = code;

      item.appendChild(letterSpan);
      item.appendChild(morseSpan);
      el.chartGrid.appendChild(item);
    });
  }

  // Attach All Event Listeners (Zero-CSP violation)
  function attachListeners() {
    // Open in Full Tab
    if (el.btnOpenTab) {
      el.btnOpenTab.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url: 'fulltab.html' });
        } else {
          window.open('fulltab.html', '_blank');
        }
      });
    }

    // Navigation Tabs
    el.navTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        switchTab(tab.dataset.tab);
      });
    });

    // Mode Toggle Buttons
    if (el.modeBtnMorse) {
      el.modeBtnMorse.addEventListener('click', () => setMode('morse'));
    }
    if (el.modeBtnText) {
      el.modeBtnText.addEventListener('click', () => setMode('text'));
    }

    // Live Text Input
    let isTranslating = false;
    el.textInput.addEventListener('input', () => {
      if (isTranslating) return;
      isTranslating = true;
      el.morseInput.value = MorseCore.textToMorse(el.textInput.value);
      isTranslating = false;
      updateCounters();
      updateCanvas();
      saveStateToStorage();
    });

    // Live Morse Input
    el.morseInput.addEventListener('input', () => {
      if (isTranslating) return;
      isTranslating = true;
      el.textInput.value = MorseCore.morseToText(el.morseInput.value);
      isTranslating = false;
      updateCounters();
      updateCanvas();
      saveStateToStorage();
    });

    // Swap Button
    if (el.swapBtn) {
      el.swapBtn.addEventListener('click', () => {
        setSwap(!state.swapped);
        saveStateToStorage();
      });
    }

    // Copy Buttons
    if (el.btnCopyText) {
      el.btnCopyText.addEventListener('click', () => {
        if (!el.textInput.value) return;
        navigator.clipboard.writeText(el.textInput.value).then(() => {
          showToast('Text copied to clipboard!');
        });
      });
    }
    if (el.btnCopyMorse) {
      el.btnCopyMorse.addEventListener('click', () => {
        if (!el.morseInput.value) return;
        navigator.clipboard.writeText(el.morseInput.value).then(() => {
          showToast('Morse code copied!');
        });
      });
    }

    // Clear Buttons
    if (el.btnClearText) {
      el.btnClearText.addEventListener('click', () => {
        el.textInput.value = '';
        el.morseInput.value = '';
        updateCounters();
        updateCanvas();
        saveStateToStorage();
      });
    }
    if (el.btnClearMorse) {
      el.btnClearMorse.addEventListener('click', () => {
        el.textInput.value = '';
        el.morseInput.value = '';
        updateCounters();
        updateCanvas();
        saveStateToStorage();
      });
    }

    // Canvas Size Slider
    if (el.sizeSlider) {
      el.sizeSlider.addEventListener('input', () => {
        el.sizeVal.textContent = `${el.sizeSlider.value}px`;
        updateCanvas();
        saveStateToStorage();
      });
    }

    // Canvas Colors
    if (el.fgColor) {
      el.fgColor.addEventListener('input', () => {
        updateCanvas();
        saveStateToStorage();
      });
    }
    if (el.bgColor) {
      el.bgColor.addEventListener('input', () => {
        updateCanvas();
        saveStateToStorage();
      });
    }

    // Download Picture
    if (el.btnDownloadPicture) {
      el.btnDownloadPicture.addEventListener('click', downloadCanvas);
    }

    // File Upload Drag & Drop
    if (el.uploadZone) {
      el.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        el.uploadZone.classList.add('mc-drag');
      });
      el.uploadZone.addEventListener('dragleave', () => {
        el.uploadZone.classList.remove('mc-drag');
      });
      el.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        el.uploadZone.classList.remove('mc-drag');
        if (e.dataTransfer.files.length > 0) {
          handleImageFile(e.dataTransfer.files[0]);
        }
      });
      el.uploadZone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
          el.fileInput.click();
        }
      });
    }

    if (el.btnBrowseFile) {
      el.btnBrowseFile.addEventListener('click', (e) => {
        e.stopPropagation();
        el.fileInput.click();
      });
    }

    if (el.fileInput) {
      el.fileInput.addEventListener('change', () => {
        if (el.fileInput.files.length > 0) {
          handleImageFile(el.fileInput.files[0]);
        }
      });
    }

    // Audio Transport Buttons
    if (el.btnPlayAudio) el.btnPlayAudio.addEventListener('click', playAudio);
    if (el.btnPauseAudio) el.btnPauseAudio.addEventListener('click', pauseAudio);
    if (el.btnStopAudio) el.btnStopAudio.addEventListener('click', stopAudio);

    // Audio Sliders
    if (el.speedSlider) {
      el.speedSlider.addEventListener('input', () => {
        el.speedVal.textContent = `${el.speedSlider.value} wpm`;
        saveStateToStorage();
      });
    }
    if (el.pitchSlider) {
      el.pitchSlider.addEventListener('input', () => {
        el.pitchVal.textContent = `${el.pitchSlider.value} Hz`;
        saveStateToStorage();
      });
    }
    if (el.volumeSlider) {
      el.volumeSlider.addEventListener('input', () => {
        el.volumeVal.textContent = `${el.volumeSlider.value}%`;
        saveStateToStorage();
      });
    }

    // Audio Options Toggles
    [el.soundOpt, el.lightOpt, el.vibrateOpt, el.repeatOpt, el.soundType].forEach((toggle) => {
      if (toggle) {
        toggle.addEventListener('change', saveStateToStorage);
      }
    });

    // Save WAV & Clear All
    if (el.btnSaveAudio) el.btnSaveAudio.addEventListener('click', saveAudioWav);
    if (el.btnCopyLink) {
      el.btnCopyLink.addEventListener('click', () => {
        const textVal = el.textInput.value.trim();
        const morseVal = el.morseInput.value.trim();
        if (!textVal && !morseVal) {
          showToast('Nothing to copy!');
          return;
        }
        const formatted = `TEXT: ${textVal}\nMORSE: ${morseVal}`;
        navigator.clipboard.writeText(formatted).then(() => {
          showToast('Formatted Morse copied!');
        });
      });
    }
    if (el.btnClearAll) {
      el.btnClearAll.addEventListener('click', () => {
        el.textInput.value = '';
        el.morseInput.value = '';
        stopAudio();
        updateCounters();
        updateCanvas();
        saveStateToStorage();
        showToast('All fields cleared!');
      });
    }

    // Chart Filter Search
    if (el.chartFilter) {
      el.chartFilter.addEventListener('input', (e) => {
        buildReferenceChart(e.target.value);
      });
    }
  }

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initElements();
    attachListeners();
    buildReferenceChart();
    restoreStateFromStorage();
  });

})();
