# Amigo 🥬✨
### Always-On-Top Circular Study Date Companion for Windows, macOS & Linux

[![GitHub Release](https://img.shields.io/github/v/release/hemantdhayal7/amigo-companion?color=success&label=Official%20Release)](https://github.com/hemantdhayal7/amigo-companion/releases/tag/v1.0.0)
[![Website Status](https://img.shields.io/website?url=https%3A%2F%2Fstudy-companion-overlay.vercel.app&label=Live%20Web%20App)](https://study-companion-overlay.vercel.app)

**Amigo** is a cross-platform desktop study companion designed in a sleek **Circle Format (Circular Hub & Floating Orb)** that floats gracefully above all your windows (IDEs, browsers, PDFs, lecture notes). Featuring our cute cabbage mascot **Amigo 🥬**, it keeps you and your study partner connected with real-time face-to-face video calls, crisp voice chat, animated celebration showers, target checklist sync, and caring emotional support.

---

## 📥 Direct Downloads (Official Builds)

You do **not** need to open a terminal or run build commands! Download your installer directly below:

| Platform | Format | Direct 1-Click Download | How to Run |
| :--- | :--- | :--- | :--- |
| **🪟 Windows** | 64-bit Installer (`.exe`) | [**Download Amigo for Windows (.exe)**](https://github.com/hemantdhayal7/amigo-companion/releases/download/v1.0.0/Amigo_1.0.0_x64-setup.exe) | Double-click `Amigo_1.0.0_x64-setup.exe` to install and launch. |
| **🍎 macOS** | Apple Silicon (`.dmg`) | [**Download Amigo for macOS (.dmg)**](https://github.com/hemantdhayal7/amigo-companion/releases/download/v1.0.0/Amigo_1.0.0_aarch64.dmg) | Open `.dmg` and drag `Amigo` to your Applications folder. |
| **🐧 Linux** | Universal AppImage | [**Download Amigo AppImage (.AppImage)**](https://github.com/hemantdhayal7/amigo-companion/releases/download/v1.0.0/Amigo_1.0.0_amd64.AppImage) | Make executable (`chmod +x Amigo*.AppImage`) and run. |
| **🐧 Linux** | Debian / Ubuntu (`.deb`) | [**Download Amigo Debian/Ubuntu (.deb)**](https://github.com/hemantdhayal7/amigo-companion/releases/download/v1.0.0/Amigo_1.0.0_amd64.deb) | Install via `sudo dpkg -i Amigo*.deb` |
| **🌐 Web App** | Browser (No install needed) | [**Launch Live Web App (Vercel)**](https://study-companion-overlay.vercel.app) | Instant access in Chrome, Edge, Safari, Brave. |

> 📦 **All Release Packages**: Browse all files, checksums, and updates on the [**GitHub Releases Page**](https://github.com/hemantdhayal7/amigo-companion/releases/tag/v1.0.0).

---

## 🖥️ System Tray / Menu Bar & 5s Auto-Pop System
Amigo sits quietly in your **Menu Bar** (macOS) or **System Tray** (Windows & Linux):
- **5-Second Auto-Popout**: Whenever an update occurs (10-minute check-in, emoji shower, goal accomplished, or buddy joining), Amigo automatically pops onto your screen with a 5-second countdown timer, then slides away so it never clutters your workspace.
- **Active Call Persistence**: When Camera, Microphone, or Screen Sharing is in use, Amigo automatically stays visible on screen without timing out.
- **Toggle Modes**: Switch between `[📌 PINNED]` (always floating) and `[⏱️ 5s POP]` mode anytime with one click.
- **Tray Menu**: Left-click or right-click the Amigo tray icon anytime to show or hide the companion.

---

## 🥬 Meet Amigo the Cabbage

Amigo is your cute kawaii study mascot:
- Bounces with celebration joy and emoji rainfall when clicked or when tasks are completed.
- Sits in the center of your floating circular companion hub, keeping study sessions warm and encouraging.
- Cheers you on during 10-minute accountability goal check-ins.
- connect to your study buddies with a real time webcame

---

## 🟢 Redesigned in Circle Format

1. **The Floating Circular Hub**:
   - Designed as an aesthetic **circular glassmorphic orb** that looks stunning above any desktop background or dark-mode workspace.
   - **Outer Animated Progress Halo Ring**: An SVG circular progress ring wraps around the perimeter, dynamically tracking your combined study synergy % in real time.
2. **Circular Live Video Lens (Portal Mode)**:
   - When either you or your partner turns on the webcam, the center circle seamlessly transforms into a **Circular Live Video Lens**!
   - Her live webcam stream appears face-to-face inside the circular glass portal.
   - When both cameras are on, your stream floats in an adorable round Picture-in-Picture satellite bubble in the corner.
3. **Circular Satellite Orbit Controls**:
   - Orbiting around the disc:
     - `[ 🎙️ ]` **Circular Mic**: Glowing green wave when speaking, with real-time partner speaking wave indicator.
     - `[ 📹 ]` **Circular Camera**: Instant toggle for face-to-face circular video date.
     - `[ 📺 ]` **Circular Screen Share**: Mini PiP screen stream.
     - `[ 🎯 ]` **Circular Target**: Today's goals, progress %, and shared checklist.
     - `[ 🆘 ]` **Circular SOS**: Crisis lifelines & 4-7-8 breathing pacer.
     - `[ 🎨 ]` **Circular Palette**: Customizable 8-slot emoji reaction bar.
4. **Collapsible Mini Cabbage Bubble (Orb Mode)**:
   - One click collapses the companion into a tiny **76px circular floating cabbage bubble**.
   - Features Amigo smiling in the center, with the circular progress ring orbiting around him!
   - Click to expand back to the full circular hub anytime.

---

## 🔒 Zero-Loophole Security

1. **Cryptographic Room Passcode / Secret Key**:
   - Every room is protected by a secret key (`roomSecret`). Intruders with an invalid key are rejected immediately and severed over TCP.
2. **Strict 2-Device Max Peer Lock**:
   - Exclusively capped at **2 verified devices max**. Strangers cannot enter even if they have the link while you two are studying.
3. **P2P DTLS-SRTP Encrypted Video & Audio**:
   - Media streams flow directly peer-to-peer with AES-128/256 encryption.

---

## 🚀 Development & Local Build

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
**Desktop Floating App (Tauri 2):**
```bash
npm run tauri dev
```

**Web Mode:**
```bash
npm run dev
```

### 3. Connect Across Computers
1. Click `[ 🔒 #room ]` on the top bar.
2. Click **Copy** next to `1-Click Link For Her`.
3. Send the link to her. Her browser opens Amigo, saves the passcode, and connects automatically!
