# CHESSVERSE ♔ — 3D Cyber Chess Experience

> **An immersive 3D WebGL chess game built with Three.js, Minimax AI, procedural pieces, sound synthesis, and sleek cyber aesthetics.**

![ChessVerse Preview](https://img.shields.io/badge/ChessVerse-3D%20WebGL-6366f1?style=for-the-badge&logo=three.js)
![No Dependencies](https://img.shields.io/badge/Dependencies-Zero%20External%20NPM-10b981?style=for-the-badge)
![GitHub Pages Ready](https://img.shields.io/badge/GitHub%20Pages-Ready-38bdf8?style=for-the-badge&logo=github)

---

## 🌟 Features

- **🎮 3D WebGL Chess Set**: Built entirely with procedural Three.js geometry — no external `.gltf` or `.obj` assets needed, ensuring zero 404s, zero CORS errors, and instantaneous load times.
- **🤖 MiniMax AI with Alpha-Beta Pruning**: 5 difficulty levels (Beginner, Casual, Club, Strong, Brutal) plus an **Adaptive** mode that dynamically adjusts to your win/loss streak.
- **🔊 Web Audio Synthesizer**: Native in-browser audio engine generating custom acoustic clicks, heavy capture thuds, check alerts, and victory arpeggios with zero audio file downloads.
- **⏱ Clocks & Time Controls**: Supports No Clock, 3-minute Blitz, 5-minute Blitz, 10-minute Rapid, and 15-minute Classic.
- **📜 Complete Chess Rules**:
  - Full move validation (pawns, knights, bishops, rooks, queens, kings).
  - Castling (Kingside and Queenside) with check-transit validation.
  - En Passant captures.
  - Pawn promotion modal dialog.
  - Checkmate, stalemate, and 50-move rule detection.
- **🎥 Orbit & Perspective Controls**:
  - Smooth camera orbit around the 3D board (zoom, rotate, tilt).
  - Automatic perspective flip when playing as White or Black.
- **📊 Career Statistics & History**:
  - Persistent games played, wins, win streaks, and match history stored via `localStorage`.
- **📦 1-Click Project .ZIP Download**: Built-in JSZip exporter allowing players to download the entire project directly from the settings menu.

---

## 🚀 Running the Project

### Option 1: Direct in Browser
Simply double-click `index.html` in your file explorer, or right-click `index.html` and choose **Open with Browser**.

### Option 2: Local HTTP Server (Optional)
```bash
# Using Python
python -m http.server 8080

# Using Node / npx
npx serve .
```
Then navigate to `http://localhost:8080`.

### Option 3: Deploy to GitHub Pages
1. Push this repository to GitHub.
2. In your repository, go to **Settings** > **Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch` and select `main` (or `master`) / `/(root)`.
4. Click **Save**. Your 3D ChessVerse game is live globally!

---

## 📁 Project Structure

```
ChessVerse/
├── index.html            # Main HTML structure with game HUD and modals
├── css/
│   └── style.css         # Glassmorphism cyber-luxury styling & animations
├── js/
│   └── app.js            # Chess engine, MiniMax AI, 3D renderer, audio synth & UI
├── vendor/
│   ├── three.min.js      # Three.js r128 (3D WebGL graphics)
│   └── jszip.min.js      # Client-side ZIP exporter
└── README.md             # Documentation
```

---

## 📜 License
MIT License. Open-source and free to play or fork!
