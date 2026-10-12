import React, { useState, useEffect } from 'react';
import {
  Link2,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Users,
  X,
  AlertTriangle,
  RotateCcw,
  Globe,
  CheckCircle2,
  HelpCircle,
  Wifi,
} from 'lucide-react';
import { sounds } from '../utils/audio';
import CabbageLogo from './CabbageLogo';

export default function ConnectModal({
  roomId,
  onSaveRoomId,
  roomSecret,
  onSaveRoomSecret,
  serverUrl,
  onSaveServerUrl,
  nickname,
  onSaveNickname,
  onClose,
  theme = 'dark',
  authError = null,
  isConnected = false,
  membersCount = 1,
}) {
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [roomInput, setRoomInput] = useState(roomId);
  const [secretInput, setSecretInput] = useState(roomSecret || 'date2026');
  const [serverInput, setServerInput] = useState(serverUrl);
  const [nameInput, setNameInput] = useState(nickname);
  const [showRemoteHelp, setShowRemoteHelp] = useState(false);
  const [discoveredIp, setDiscoveredIp] = useState(null);

  // Auto-discover the host machine's Wi-Fi / LAN IP from signaling server
  useEffect(() => {
    fetch(`${serverUrl}/api/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.localIp && data.localIp !== 'localhost' && data.localIp !== '127.0.0.1') {
          setDiscoveredIp(data.localIp);
        }
      })
      .catch(() => {});
  }, [serverUrl]);

  // Helper to get hostname / IP for the mate's computer
  const getHostAddress = () => {
    try {
      const parsed = new URL(serverInput);
      if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
        return parsed.hostname;
      }
      if (discoveredIp) {
        return discoveredIp;
      }
      return window.location.hostname && window.location.hostname !== 'localhost'
        ? window.location.hostname
        : '192.168.1.3';
    } catch {
      return discoveredIp || '192.168.1.3';
    }
  };

  const hostAddress = getHostAddress();
  const protocol = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? 'https:' : 'http:';

  // Server address for her device
  const targetServer = (serverInput.includes('localhost') || serverInput.includes('127.0.0.1')) && hostAddress !== 'localhost'
    ? serverInput.replace('localhost', hostAddress).replace('127.0.0.1', hostAddress)
    : serverInput.trim();

  // 1-Click Link with Room, Passcode and Server included
  const shareableLink = `${protocol}//${hostAddress}:5173/?room=${encodeURIComponent(
    roomInput.trim()
  )}&secret=${encodeURIComponent(secretInput.trim())}&server=${encodeURIComponent(targetServer)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    sounds.playCelebration();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGenerateSecret = () => {
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `LOVE-${randomChars}-${Math.floor(1000 + Math.random() * 9000)}`;
    setSecretInput(newKey);
    sounds.playPop();
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (roomInput.trim()) onSaveRoomId(roomInput.trim());
    if (secretInput.trim()) onSaveRoomSecret(secretInput.trim());
    if (serverInput.trim()) {
      let cleanServer = serverInput.trim().replace(/\/+$/, '');
      if (!cleanServer.startsWith('http://') && !cleanServer.startsWith('https://')) {
        cleanServer = `http://${cleanServer}`;
      }
      onSaveServerUrl(cleanServer);
    }
    if (nameInput.trim()) onSaveNickname(nameInput.trim());
    sounds.playPop();
    onClose();
  };

  const isWhite = theme === 'white';
  const isBlush = theme === 'blush';

  const modalBg = isWhite
    ? 'bg-white/95 text-slate-800 border-slate-200 shadow-2xl'
    : isBlush
    ? 'bg-rose-50/95 text-rose-950 border-rose-200/90 shadow-2xl'
    : 'bg-slate-900/95 text-slate-100 border-indigo-500/30 shadow-2xl';

  const inputBg = isWhite
    ? 'bg-slate-100 border-slate-300 text-slate-800 focus:bg-white'
    : isBlush
    ? 'bg-rose-100/70 border-rose-300 text-rose-900 focus:bg-white'
    : 'bg-slate-800 border-slate-700 text-white focus:bg-slate-850';

  return (
    <div className={`p-4 rounded-3xl border backdrop-blur-2xl max-w-sm w-full ${modalBg} animate-fadeIn`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center p-0.5">
            <CabbageLogo size={24} animated />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs">Amigo 🎉 Connect & Reconnect</h3>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                Zero Loophole
              </span>
            </div>
            <p className="text-[10px] opacity-70">Always reconnects on reboot • Locked to 2 devices</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Security Warning if Auth Error */}
      {authError && (
        <div className="mb-3 p-2.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-start gap-2 text-rose-600 dark:text-rose-300 text-xs animate-shake">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">
            <strong>Security Block:</strong> {authError}
            <div className="opacity-80 text-[10px] mt-0.5">Please check and re-enter the correct room passcode below.</div>
          </div>
        </div>
      )}

      {/* Connection & Auto-Reconnect Status Banner */}
      <div className="mb-3 p-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className="font-medium text-[10px]">
            {isConnected ? `Connected (Partners: ${membersCount}/2)` : 'Reconnecting in background...'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px] opacity-75 font-mono">
          <Zap className="w-2.5 h-2.5 text-amber-500" />
          <span>Auto-Reconnect On</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-2.5">
        {/* Your Name */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
            Your Nickname
          </label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="e.g. Hemant"
            className={`w-full px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none transition ${inputBg}`}
          />
        </div>

        {/* Room Code */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
            Shared Room Name (Both computers join this)
          </label>
          <input
            type="text"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="e.g. our-study-date"
            className={`w-full px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none font-mono transition ${inputBg}`}
          />
        </div>

        {/* Secret Passcode - Zero Loophole Protection */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Lock className="w-3 h-3" />
              Room Passcode (Zero-Loophole Key)
            </label>
            <button
              type="button"
              onClick={handleGenerateSecret}
              className="text-[9px] opacity-80 hover:opacity-100 text-indigo-500 flex items-center gap-0.5 hover:underline"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Generate
            </button>
          </div>

          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="e.g. love-study-2026"
              className={`w-full pl-2.5 pr-8 py-1.5 text-xs rounded-xl border focus:outline-none font-mono transition ${inputBg}`}
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white/80 transition"
              title={showSecret ? 'Hide Passcode' : 'Show Passcode'}
            >
              {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[9px] opacity-65 mt-0.5">
            🔒 Only someone with this exact key can connect. Anyone else is rejected instantly.
          </p>
        </div>

        {/* Server Address */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
            Signaling Server URL
          </label>
          <input
            type="text"
            value={serverInput}
            onChange={(e) => setServerInput(e.target.value)}
            placeholder="http://localhost:4000 or http://192.168.x.x:4000"
            className={`w-full px-2.5 py-1.5 text-[11px] rounded-xl border focus:outline-none font-mono transition ${inputBg}`}
          />
          <p className="text-[9px] opacity-60 mt-0.5">
            Tip: Use your computer's local IP or host name (e.g. <span className="font-mono font-bold">192.168.1.3:4000</span>) so her computer reaches yours!
          </p>
        </div>

        {/* 1-Click Shareable Link with embedded passcode */}
        <div className="p-2.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-500 dark:text-indigo-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              1-Click Link For Her
            </span>
            <span className="text-[9px] opacity-75 font-normal bg-indigo-500/20 px-1 rounded">Passcode Embedded</span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={shareableLink}
              className="flex-1 px-2 py-1 text-[10px] font-mono bg-black/20 rounded-lg border border-indigo-500/20 truncate opacity-90 select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow shrink-0"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-[9px] opacity-75">
            When she opens this link, her companion app <strong className="font-semibold">automatically saves</strong> the room & passcode so her computer will reconnect immediately even after rebooting!
          </p>
        </div>

        {/* Security Guarantee Cards */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <div className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[9px] leading-tight flex items-start gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[10px]">Strict 2-Device Lock</strong>
              Max 2 partners. Zero 3rd-party eavesdroppers can enter.
            </div>
          </div>
          <div className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[9px] leading-tight flex items-start gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[10px]">Instant Reboot Sync</strong>
              Saved in localStorage. Both laptops reconnect automatically.
            </div>
          </div>
        </div>

        {/* Different Wi-Fi / Remote Guide Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowRemoteHelp(!showRemoteHelp)}
            className="text-[9px] opacity-75 hover:opacity-100 flex items-center gap-1 text-indigo-500 hover:underline cursor-pointer"
          >
            <Globe className="w-2.5 h-2.5" />
            <span>{showRemoteHelp ? 'Hide remote connection guide' : 'Studying from different houses / Wi-Fis?'}</span>
          </button>

          {showRemoteHelp && (
            <div className="mt-1.5 p-2 rounded-xl bg-black/10 dark:bg-white/5 text-[9px] space-y-1 opacity-90 border border-black/5 dark:border-white/5">
              <p className="font-semibold">If you are NOT on the same Wi-Fi router:</p>
              <ul className="list-disc pl-3.5 space-y-0.5 opacity-80">
                <li>Option 1: Use <strong>Tailscale</strong> (free private encrypted P2P tunnel between your 2 computers).</li>
                <li>Option 2: Run <code className="bg-black/20 px-1 rounded">cloudflared tunnel --url http://localhost:4000</code> or <code className="bg-black/20 px-1 rounded">ngrok http 4000</code> and paste the resulting HTTPS URL above!</li>
                <li>WebRTC audio/video/screen share remains 100% end-to-end encrypted with DTLS-SRTP.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Save & Connect Button */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs opacity-60 hover:opacity-100 px-2 py-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Save & Connect</span>
          </button>
        </div>
      </form>
    </div>
  );
}
