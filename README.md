# Morse Code Picture Translator — Chrome Extension (Manifest V3)

A production-ready, fully functional Google Chrome Extension built according to the strict **Manifest V3** standard with **Zero-CSP violations**, offline-first architecture, dual-view UI (compact popup + full-screen studio), and system-level Chrome integration.

---

## 🚀 Key Features

1. **Dual-View UI (Popup & Full Tab Studio)**:
   - **Popup Mode (`popup.html`)**: Compact 500px × 560px window with an organized tab bar (`Translate & Canvas`, `Scan Picture`, `Audio Synth`, `Chart`) preventing awkward scrollbars. Includes a one-click **"Full Tab"** button.
   - **Studio Mode (`fulltab.html`)**: Expansive multi-column dashboard for large screens with high-definition canvas rendering, audio synthesis controls, and interactive reference tables.

2. **Bidirectional Live Translation**:
   - Instant text-to-Morse and Morse-to-text conversion.
   - Character and Morse symbol counter.
   - Swap button to flip input order.
   - One-click copy with toast notifications.

3. **Morse Code Picture Generator (HTML5 Canvas)**:
   - Visual rendering of Morse dots and dashes.
   - Adjustable symbol size slider (10px–60px).
   - Custom foreground and background color pickers.
   - One-click **Download Picture (PNG)** export.

4. **100% Offline Image Morse Decoder (BFS Computer Vision)**:
   - Drag-and-drop or browse image upload (PNG, JPG, WebP).
   - **Zero external CDNs or remote scripts**: Uses a built-in 4-connected Breadth-First Search (BFS) blob detection and luminance thresholding algorithm directly in browser memory.
   - 100% private and offline — zero data leaves the user's computer.

5. **Web Audio Synthesizer & WAV Exporter**:
   - **Tone engines**: CW Radio (sine wave with envelope anti-click ramp) & Mechanical Telegraph Sounder (click impulses).
   - Adjustable Speed (5–50 WPM), Pitch (300–1000 Hz), and Volume (0–100%).
   - Visual Morse Lightbulb indicator & tool flash animation synchronized with audio.
   - Optional vibration feedback (`navigator.vibrate`) and repeat playback.
   - **Export Audio (.wav)**: Generates 44.1kHz 16-bit PCM WAV audio using `OfflineAudioContext`.

6. **Chrome Integration & Storage**:
   - **Storage Persistence**: Uses `chrome.storage.local` to preserve user inputs, sliders, colors, and toggles across browser restarts.
   - **Right-Click Context Menu**: Highlight text on any website and right-click -> *"Translate to Morse Code"* to instantly load it into the Studio.
   - **Keyboard Shortcut**: Press `Ctrl+Shift+U` (or `Cmd+Shift+U` on macOS) to open the extension from anywhere.

---

## 📂 Project Structure

```text
morse-picture-translator-chrome/
├── manifest.json         # Manifest V3 configuration & permissions
├── popup.html            # Clean HTML popup structure (Zero inline JS)
├── popup.css             # Scoped popup styles & custom sliders
├── popup.js              # Popup controller & event listeners
├── fulltab.html          # Full-screen Studio mode layout
├── fulltab.css           # Expansive Studio dashboard styles
├── fulltab.js            # Studio controller & clipboard integration
├── morse-core.js         # Shared engine: translation, canvas, BFS scanner, audio & WAV
├── background.js         # Service worker: context menus & keyboard shortcuts
├── generate-icons.js     # Standalone icon generator
└── icons/
    ├── icon.svg          # High-resolution vector icon
    ├── icon16.png        # 16x16 toolbar icon
    ├── icon32.png        # 32x32 retina icon
    ├── icon48.png        # 48x48 extensions management icon
    └── icon128.png       # 128x128 Chrome Web Store icon
```

---

## 🛠️ How to Install in Google Chrome (Load Unpacked)

1. Open **Google Chrome**.
2. In the URL address bar, enter:
   ```text
   chrome://extensions
   ```
3. In the top-right corner, toggle **Developer mode** to **ON**.
4. Click the **Load unpacked** button in the top-left corner.
5. Browse to and select the folder:
   ```text
   c:\Users\realb\Downloads\soft rank\morse-picture-translator-chrome
   ```
6. The extension **Morse Code Picture Translator** will now appear in your extensions list!
7. Click the extension puzzle icon in the Chrome toolbar and pin **Morse Code Picture Translator** for instant access.

---

## ⌨️ Shortcuts & Context Menus

- **Open Extension**: Press `Ctrl+Shift+U` (Windows/Linux) or `Command+Shift+U` (macOS).
- **Translate Web Selection**: Select any text on a webpage -> Right-click -> Select **"Translate '[selection]' to Morse Code"**. Studio mode will open automatically with the text translated.
