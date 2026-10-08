# Morse Code Picture Translator

**Morse Code Picture Translator** is a free, offline Chrome extension that converts text into Morse code, decodes Morse code from pictures, generates customizable Morse code images, and creates Morse code audio.

Built with HTML, CSS, and JavaScript using Chrome Manifest V3, the extension offers a simple interface for students, developers, educators, amateur radio enthusiasts, and Morse code learners.

🌐 **Try the Online Tool:** [Morse Code Picture Translator](https://justmorsecodetranslator.com/morse-code-translator-picture/)

## Features

### Text to Morse Code Translator
- Instantly convert text into Morse code.
- Decode Morse code into readable text.
- Supports letters, numbers, and common punctuation.
- Copy translated results with one click.
- Real-time character and Morse symbol counters.

### Morse Code Picture Generator
- Convert Morse code into visual dots and dashes.
- Customize the picture's foreground and background colors.
- Adjust symbol sizes from 10px to 60px.
- Preview generated Morse code images.
- Download Morse code pictures in PNG format.

### Morse Code Picture Decoder
- Upload images containing Morse code symbols.
- Supports PNG, JPG, and WebP images.
- Uses built-in image processing to recognize dots and dashes.
- Decodes recognized Morse sequences into readable text.
- Processes images locally without requiring an internet connection.

### Morse Code Audio Generator
- Generate and play Morse code sounds.
- Choose CW radio tones or mechanical telegraph sounds.
- Adjust playback speed, pitch, and volume.
- Use visual signal indicators and repeat playback.
- Download generated Morse code audio in WAV format.

### Chrome Extension Features
- Compact popup interface for quick translation.
- Full-screen studio for advanced controls.
- Right-click selected text to translate it into Morse code.
- Keyboard shortcut for quick access.
- Local storage to preserve settings.
- Offline functionality without external libraries.

## How to Use

1. Open the Morse Code Picture Translator extension.
2. Select text translation, picture scanning, or audio generation.
3. Enter text, paste Morse code, or upload a supported image.
4. View the translated or generated result.
5. Copy the result or download a PNG or WAV file.

## Installation

1. Download or clone this repository.
2. Extract the project files if downloaded as a ZIP.
3. Open Google Chrome and navigate to `chrome://extensions`.
4. Enable **Developer Mode**.
5. Click **Load unpacked**.
6. Select the project folder containing `manifest.json`.
7. Pin Morse Code Picture Translator to your browser toolbar.

## Keyboard Shortcuts

**Windows/Linux:** `Ctrl + Shift + U`

**macOS:** `Command + Shift + U`

You can also select text on a webpage, right-click, and choose the Morse code translation option to open the full-screen studio.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Chrome Extensions Manifest V3
- HTML5 Canvas API
- Web Audio API
- Chrome Storage API
- Browser Context Menus

## Privacy and Offline Processing

Morse Code Picture Translator is designed to work locally in your browser. Text conversion, image processing, and Morse audio generation do not require uploading user content to a remote server.

The extension uses local browser storage to save preferences and translation settings.

## Who Can Use It?

- Students learning Morse code
- Teachers and educational institutions
- Amateur radio operators
- Developers and programmers
- Morse code hobbyists
- Communication and electronics enthusiasts

## Contributing

Contributions are welcome. You can fork the repository, suggest improvements, report issues, or submit pull requests to help improve the extension.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
