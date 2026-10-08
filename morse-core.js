/**
 * morse-core.js
 * Core engine for Morse Code Picture Translator Chrome Extension.
 * Fully offline, zero external dependencies, 100% Manifest V3 CSP compliant.
 */

(function (global) {
  'use strict';

  // 1. Morse Alphabet and Symbol Dictionary
  const MORSE_MAP = {
    'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',
    'E': '.',     'F': '..-.',  'G': '--.',   'H': '....',
    'I': '..',    'J': '.---',  'K': '-.-',   'L': '.-..',
    'M': '--',    'N': '-.',    'O': '---',   'P': '.--.',
    'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
    'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',
    'Y': '-.--',  'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--',
    '/': '-..-.',  '(': '-.--.',  ')': '-.--.-', ':': '---...',
    ';': '-.-.-.', '=': '-...-',  '+': '.-.-.',  '-': '-....-',
    '_': '..--.-', '$': '...-..-', '@': '.--.-.', '\'': '.----.',
    '"': '.-..-.', '&': '.-...',  ':': '---...',
    ' ': '/'
  };

  const REVERSE_MORSE_MAP = {};
  Object.keys(MORSE_MAP).forEach((char) => {
    if (char !== ' ') {
      REVERSE_MORSE_MAP[MORSE_MAP[char]] = char;
    }
  });
  REVERSE_MORSE_MAP['/'] = ' ';
  REVERSE_MORSE_MAP['|'] = ' ';

  // 2. Text <-> Morse Translation
  function textToMorse(text) {
    if (!text) return '';
    const upper = text.toUpperCase();
    const result = [];
    for (let i = 0; i < upper.length; i++) {
      const char = upper[i];
      if (char === '\n' || char === '\r') {
        result.push('\n');
      } else if (char === ' ') {
        result.push('/');
      } else if (MORSE_MAP[char]) {
        result.push(MORSE_MAP[char]);
      }
    }
    return result.join(' ').replace(/\s*\n\s*/g, '\n').replace(/\s*\/\s*/g, ' / ').trim();
  }

  function morseToText(morse) {
    if (!morse) return '';
    // Normalize spaces and slashes
    const lines = morse.split(/\r?\n/);
    const decodedLines = lines.map((line) => {
      const tokens = line.trim().split(/\s+/);
      let lineText = '';
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === '/' || token === '|') {
          lineText += ' ';
        } else if (REVERSE_MORSE_MAP[token]) {
          lineText += REVERSE_MORSE_MAP[token];
        }
      }
      return lineText;
    });
    return decodedLines.join('\n').trim();
  }

  // 3. Canvas Picture Generator
  function drawMorseCanvas(canvas, morse, options = {}) {
    if (!canvas) return { width: 0, height: 0 };
    const ctx = canvas.getContext('2d');
    if (!ctx) return { width: 0, height: 0 };

    const symbolSize = options.size || 20;
    const fgColor = options.fgColor || '#0f172a';
    const bgColor = options.bgColor || '#ffffff';
    const ms = (morse || '').trim();

    // Polyfill roundRect if needed
    if (!ctx.roundRect) {
      ctx.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
      };
    }

    if (!ms) {
      canvas.width = 560;
      canvas.height = 140;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = fgColor;
      ctx.globalAlpha = 0.35;
      ctx.font = '600 15px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Morse code picture will appear here', canvas.width / 2, canvas.height / 2);
      ctx.globalAlpha = 1.0;
      return { width: canvas.width, height: canvas.height };
    }

    const dot = symbolSize;
    const dash = symbolSize * 3;
    const charSpacing = symbolSize * 2.5;
    const wordSpacing = symbolSize * 6;
    const lineSpacing = symbolSize * 3.5;
    const padding = symbolSize * 2;
    const maxLineWidth = Math.max(760, symbolSize * 28);

    let curX = padding;
    let curY = padding;
    let maxContentX = padding;
    const lines = [[]];
    let curLineIdx = 0;

    const words = ms.split('/');
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];
      const chars = word.trim().split(/\s+/).filter(Boolean);
      let wordPixelWidth = 0;

      for (let ci = 0; ci < chars.length; ci++) {
        const ch = chars[ci];
        for (let si = 0; si < ch.length; si++) {
          const s = ch[si];
          if (s === '.') wordPixelWidth += dot;
          else if (s === '-') wordPixelWidth += dash;
          if (si < ch.length - 1) wordPixelWidth += dot;
        }
        if (ci < chars.length - 1) wordPixelWidth += charSpacing;
      }

      // Check line wrap
      if (curX + wordPixelWidth + padding > maxLineWidth && curX > padding) {
        curX = padding;
        curY += dot + lineSpacing;
        curLineIdx++;
        lines[curLineIdx] = [];
      }

      for (let ci = 0; ci < chars.length; ci++) {
        const ch = chars[ci];
        for (let si = 0; si < ch.length; si++) {
          const s = ch[si];
          if (s === '.') {
            lines[curLineIdx].push({ type: 'dot', x: curX, y: curY });
            curX += dot;
          } else if (s === '-') {
            lines[curLineIdx].push({ type: 'dash', x: curX, y: curY });
            curX += dash;
          }
          if (si < ch.length - 1) curX += dot;
        }
        if (ci < chars.length - 1) curX += charSpacing;
      }

      if (curX > maxContentX) maxContentX = curX;
      if (wi < words.length - 1) curX += wordSpacing;
    }

    const finalWidth = Math.max(maxContentX + padding, 320);
    const finalHeight = curY + dot + padding;

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, finalWidth, finalHeight);
    ctx.fillStyle = fgColor;

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      if (!line) continue;
      for (let ci = 0; ci < line.length; ci++) {
        const item = line[ci];
        if (item.type === 'dot') {
          ctx.beginPath();
          ctx.arc(item.x + dot / 2, item.y + dot / 2, dot / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'dash') {
          ctx.beginPath();
          ctx.roundRect(item.x, item.y, dash, dot, dot / 2);
          ctx.fill();
        }
      }
    }

    return { width: finalWidth, height: finalHeight };
  }

  // 4. Offline Pixel Shape Detector (BFS Connected Components)
  // Scans image pixels locally in browser with zero network calls and zero CSP issues.
  function scanPixelsForMorse(img) {
    return new Promise((resolve) => {
      try {
        const cvs = document.createElement('canvas');
        const cctx = cvs.getContext('2d');
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        if (!w || !h) {
          resolve(null);
          return;
        }

        // Downscale oversized images for fast, accurate processing
        const maxDim = 1000;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        cvs.width = w;
        cvs.height = h;
        cctx.drawImage(img, 0, 0, w, h);
        const px = cctx.getImageData(0, 0, w, h).data;
        const totalPixels = w * h;

        // Compute average luminance
        let sumLuminance = 0;
        for (let i = 0; i < totalPixels; i++) {
          sumLuminance += (px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114);
        }
        const avgLum = sumLuminance / totalPixels;

        // Binary threshold grid
        const grid = new Uint8Array(totalPixels);
        const visited = new Uint8Array(totalPixels);
        const delta = 22;

        for (let i = 0; i < totalPixels; i++) {
          const lum = px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114;
          const alpha = px[i * 4 + 3];
          if (alpha > 35) {
            if (avgLum > 128) {
              // Dark marks on light background
              if (lum < avgLum - delta) grid[i] = 1;
            } else {
              // Light marks on dark background
              if (lum > avgLum + delta) grid[i] = 1;
            }
          }
        }

        // BFS Blob detection
        const blobs = [];
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (grid[idx] !== 1 || visited[idx] === 1) continue;

            let mnX = x, mxX = x, mnY = y, mxY = y, count = 0;
            const queue = [idx];
            visited[idx] = 1;
            let qHead = 0;

            while (qHead < queue.length) {
              const curr = queue[qHead++];
              count++;
              const cy = Math.floor(curr / w);
              const cx = curr % w;
              if (cx < mnX) mnX = cx;
              if (cx > mxX) mxX = cx;
              if (cy < mnY) mnY = cy;
              if (cy > mxY) mxY = cy;

              const neighbours = [curr - 1, curr + 1, curr - w, curr + w];
              for (let ni = 0; ni < 4; ni++) {
                const n = neighbours[ni];
                if (n >= 0 && n < totalPixels && grid[n] === 1 && visited[n] === 0) {
                  visited[n] = 1;
                  queue.push(n);
                }
              }
            }

            const bw = mxX - mnX + 1;
            const bh = mxY - mnY + 1;

            // Filter noise and border artifacts
            if (count < 5) continue;
            if (bw >= w * 0.88 || bh >= h * 0.88) continue;

            blobs.push({
              mnX, mxX, mnY, mxY,
              bw, bh,
              cx: mnX + bw / 2,
              cy: mnY + bh / 2
            });
          }
        }

        if (blobs.length === 0) {
          resolve(null);
          return;
        }

        // Group into lines by vertical centers
        blobs.sort((a, b) => a.cy - b.cy);
        const lines = [];

        for (let bi = 0; bi < blobs.length; bi++) {
          const b = blobs[bi];
          let placed = false;
          for (let li = 0; li < lines.length; li++) {
            const grp = lines[li];
            let sumY = 0;
            let maxH = b.bh;
            for (let gi = 0; gi < grp.length; gi++) {
              sumY += grp[gi].cy;
              if (grp[gi].bh > maxH) maxH = grp[gi].bh;
            }
            const avgY = sumY / grp.length;
            if (Math.abs(b.cy - avgY) < maxH * 0.85) {
              grp.push(b);
              placed = true;
              break;
            }
          }
          if (!placed) lines.push([b]);
        }

        // Classify each blob as dot or dash & detect spacing
        const resultLines = [];
        for (let li = 0; li < lines.length; li++) {
          const grp = lines[li];
          grp.sort((a, b) => a.mnX - b.mnX);
          let lineStr = '';

          for (let si = 0; si < grp.length; si++) {
            const blob = grp[si];
            const ratio = blob.bh > 0 ? blob.bw / blob.bh : 1;
            // Aspect ratio >= 1.5 indicates a dash
            lineStr += (ratio >= 1.5 ? '-' : '.');

            if (si < grp.length - 1) {
              const nextBlob = grp[si + 1];
              const gap = nextBlob.mnX - blob.mxX;
              const refW = Math.min(blob.bw, nextBlob.bw);

              if (gap > refW * 2.4) {
                lineStr += ' / ';
              } else if (gap > refW * 1.05) {
                lineStr += ' ';
              }
            }
          }

          const trimmed = lineStr.trim();
          if (trimmed) resultLines.push(trimmed);
        }

        if (resultLines.length > 0) {
          resolve(resultLines.join(' / '));
        } else {
          resolve(null);
        }
      } catch (err) {
        console.error('Error scanning pixels:', err);
        resolve(null);
      }
    });
  }

  // 5. Audio Synthesizer & Timing Engine
  function buildMorseAudioEvents(morse, wpm = 20) {
    const dotDuration = 1.2 / Math.max(5, Math.min(50, wpm));
    const events = [];
    let curTime = 0;

    for (let i = 0; i < morse.length; i++) {
      const c = morse[i];
      if (c === '.') {
        events.push({ start: curTime, end: curTime + dotDuration, type: '.', vibrated: false });
        curTime += dotDuration * 2; // symbol duration + inter-element gap
      } else if (c === '-') {
        events.push({ start: curTime, end: curTime + dotDuration * 3, type: '-', vibrated: false });
        curTime += dotDuration * 4; // symbol duration + inter-element gap
      } else if (c === ' ') {
        curTime += dotDuration * 2; // inter-character gap (total 3 dots)
      } else if (c === '/' || c === '|') {
        curTime += dotDuration * 6; // word gap (total 7 dots)
      } else if (c === '\n') {
        curTime += dotDuration * 6;
      }
    }

    return { events, totalDuration: curTime };
  }

  function scheduleMorseAudio(ctx, events, startOffset, options = {}) {
    const pitch = options.pitch || 600;
    const vol = Math.max(0, Math.min(1, options.volume !== undefined ? options.volume : 0.5));
    const type = options.soundType || 'cw';
    const scheduledOscs = [];

    if (type === 'cw') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);

      const base = startOffset > 0 ? startOffset : ctx.currentTime;
      gain.gain.setValueAtTime(0, base);

      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        const s0 = Math.max(base, ev.start - 0.005);
        gain.gain.setValueAtTime(0, s0);
        gain.gain.linearRampToValueAtTime(vol, ev.start);

        const e0 = Math.max(ev.start, ev.end - 0.005);
        gain.gain.setValueAtTime(vol, e0);
        gain.gain.linearRampToValueAtTime(0, ev.end);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (events.length > 0) {
        osc.start(events[0].start);
        osc.stop(events[events.length - 1].end + 0.1);
      }
      scheduledOscs.push(osc);
    } else {
      // Telegraph sounder: click impulses
      for (let i = 0; i < events.length; i++) {
        const osc1 = scheduleClick(ctx, events[i].start, vol);
        const osc2 = scheduleClick(ctx, events[i].end, vol * 0.7);
        if (osc1) scheduledOscs.push(osc1);
        if (osc2) scheduledOscs.push(osc2);
      }
    }

    return scheduledOscs;
  }

  function scheduleClick(ctx, t, vol) {
    if (t < ctx.currentTime) return null;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.02);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
    return osc;
  }

  // 6. Offline WAV Export via OfflineAudioContext
  function renderWavBlob(morse, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const wpm = options.wpm || 20;
        const pitch = options.pitch || 600;
        const volume = options.volume !== undefined ? options.volume : 0.5;
        const soundType = options.soundType || 'cw';

        const data = buildMorseAudioEvents(morse, wpm);
        if (!data.events || data.events.length === 0) {
          reject(new Error('No Morse code events to render.'));
          return;
        }

        const sampleRate = 44100;
        const totalSamples = Math.ceil(sampleRate * (data.totalDuration + 0.5));
        const OffCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        const offCtx = new OffCtx(1, totalSamples, sampleRate);

        scheduleMorseAudio(offCtx, data.events, 0, { pitch, volume, soundType });

        offCtx.startRendering().then((buffer) => {
          const numChannels = buffer.numberOfChannels;
          const length = buffer.length;
          const arrayBuffer = new ArrayBuffer(44 + length * numChannels * 2);
          const view = new DataView(arrayBuffer);
          let pos = 0;

          function write16(d) { view.setUint16(pos, d, true); pos += 2; }
          function write32(d) { view.setUint32(pos, d, true); pos += 4; }

          // RIFF header
          write32(0x46464952); // "RIFF"
          write32(36 + length * numChannels * 2);
          write32(0x45564157); // "WAVE"

          // fmt sub-chunk
          write32(0x20746d66); // "fmt "
          write32(16); // Subchunk1Size (16 for PCM)
          write16(1);  // AudioFormat (1 = PCM)
          write16(numChannels);
          write32(buffer.sampleRate);
          write32(buffer.sampleRate * numChannels * 2); // ByteRate
          write16(numChannels * 2); // BlockAlign
          write16(16); // BitsPerSample

          // data sub-chunk
          write32(0x61746164); // "data"
          write32(length * numChannels * 2);

          const channels = [];
          for (let c = 0; c < numChannels; c++) {
            channels.push(buffer.getChannelData(c));
          }

          for (let s = 0; s < length; s++) {
            for (let c = 0; c < numChannels; c++) {
              let sample = channels[c][s];
              if (sample > 1) sample = 1;
              if (sample < -1) sample = -1;
              const val = sample < 0 ? sample * 32768 : sample * 32767;
              view.setInt16(pos, Math.floor(val), true);
              pos += 2;
            }
          }

          const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
          resolve(blob);
        }).catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Export to namespace
  global.MorseCore = {
    MORSE_MAP,
    REVERSE_MORSE_MAP,
    textToMorse,
    morseToText,
    drawMorseCanvas,
    scanPixelsForMorse,
    buildMorseAudioEvents,
    scheduleMorseAudio,
    renderWavBlob
  };

})(typeof window !== 'undefined' ? window : this);
