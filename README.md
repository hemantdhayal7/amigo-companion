# Amigo 🥬✨
### Always-On-Top Circular Study Date Companion for macOS & Linux

**Amigo** is a cross-platform desktop study companion designed in a sleek **Circle Format (Circular Hub & Floating Orb)** that floats gracefully above all your windows (IDEs, browsers, PDFs, lecture notes). Featuring our cute cabbage mascot **Amigo 🥬**, it keeps you and your study partner connected with real-time face-to-face video calls, crisp voice chat, animated celebration showers, target checklist sync, and caring emotional support.

---

## 🥬 Meet Amigo the Cabbage

Amigo is your cute kawaii study mascot:
- Bounces with celebration joy and emoji rainfall when clicked or when tasks are completed.
- Sits in the center of your floating circular companion hub, keeping study sessions warm and encouraging.
- Cheers you on during 10-minute accountability goal check-ins.

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

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Amigo
**Desktop Floating App (macOS & Linux Tauri 2):**
```bash
./run.sh
```

**Web Mode with HTTPS (For Cross-Computer Video & Mic on Wi-Fi):**
```bash
./run.sh --web --https
```

### 3. Connect Her Computer
1. Click `[ 🔒 #room ]` on the top bar.
2. Click **Copy** next to `1-Click Link For Her`.
3. Send the link to her. Her browser opens Amigo, saves the passcode, and connects automatically!
