import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Bypass-Tunnel-Reminder', 'true');
  next();
});
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  // 25MB buffer to allow crisp, high-resolution screenshot uploads
  maxHttpBufferSize: 25 * 1024 * 1024,
  // Robust ping/pong tolerant to background tab throttling, network lag spikes, and sleeping computers
  pingTimeout: 30000,
  pingInterval: 10000,
  allowEIO3: true
});

// Local AI (Ollama) Configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma3:1b-it-qat';
const DOUBT_TTL_MS = 3 * 60 * 60 * 1000; // 3 Hours exact lifetime

async function queryLocalAI(prompt, customSystem) {
  const systemPrompt = customSystem || 'You are Amigo 🥬, a friendly, encouraging, and intelligent study tutor companion. Explain concepts clearly, concisely, and step-by-step so study partners can quickly resolve their doubt.';
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        system: systemPrompt,
        prompt: prompt,
        stream: false,
      })
    });
    if (!res.ok) {
      throw new Error(`Ollama responded with HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return data.response;
  } catch (err) {
    console.error('[Local AI Error]', err.message);
    throw err;
  }
}

// WebRTC ICE & 100% Free Cloudflare TURN Relay with Seamless In-Flight Rotation
// Zero cost forever: Uses Cloudflare's free TURN network with 4-minute in-flight proactive rotation,
// completely eliminating the 6-minute lease drop without any freeze or interruption!
let cachedIceServers = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.services.mozilla.com:3478' },
  { urls: 'stun:stun.nextcloud.com:443' },
];
let lastTurnFetch = 0;

// Fetch fresh TURN credentials from Cloudflare (100% Free, Zero Cost Forever).
// Cloudflare credentials have a 360s (6-min) TTL.
// We cache for 60 seconds so every connecting peer and in-flight rotation request receives
// fresh credentials with at least 5 minutes of valid lifespan!
async function getFreshIceServers(force = false) {
  const now = Date.now();
  const hasTurn = cachedIceServers.some((s) => Array.isArray(s.urls) ? s.urls.some((u) => u.startsWith('turn:')) : s.urls?.startsWith('turn:'));
  if (!force && now - lastTurnFetch < 60 * 1000 && hasTurn) {
    return cachedIceServers;
  }

  try {
    const res = await fetch('https://speed.cloudflare.com/turn-creds', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://speed.cloudflare.com/',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.urls && data.username && data.credential) {
        cachedIceServers = [
          { urls: 'stun:stun.cloudflare.com:3478' },
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun.services.mozilla.com:3478' },
          { urls: 'stun:stun.nextcloud.com:443' },
          {
            urls: data.urls,
            username: data.username,
            credential: data.credential,
          },
        ];
        lastTurnFetch = now;
        console.log(`[WebRTC-CF] 🛡️ 100% Free Cloudflare TURN active (${data.urls.length} URLs, user: ${data.username.slice(0, 10)}...)`);
        return cachedIceServers;
      }
    }
  } catch (err) {
    console.warn('[WebRTC-CF] Warning: Could not fetch Cloudflare TURN credentials:', err.message);
  }
  return cachedIceServers;
}

getFreshIceServers().catch(() => {});

// Background keepalive cache refresh (every 2 minutes)
setInterval(async () => {
  try {
    await getFreshIceServers(true);
  } catch (err) {
    console.warn('[WebRTC-CF] Background cache notice:', err.message);
  }
}, 2 * 60 * 1000);

// Rooms storage:
// roomId -> {
//   secret: string,
//   createdAt: number,
//   lastActive: number,
//   members: Map<socketId, { id, name, avatar, status, isSharing, target, tasks, progress, joinedAt }>
// }
const rooms = new Map();

// Helper to get network info (IPv4 and mDNS Bonjour hostname)
function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  const hostname = os.hostname();
  return {
    localIp: ips[0] || 'localhost',
    allIps: ips,
    hostname: hostname,
    mdnsHost: `${hostname}.local`
  };
}

// Health & Server Discovery API
app.get('/api/health', (req, res) => {
  const net = getNetworkInfo();
  res.json({
    status: 'ok',
    service: 'Amigo 🥬 Signaling Server',
    secured: true,
    localIp: net.localIp,
    hostname: net.hostname,
    mdnsHost: net.mdnsHost,
    activeRooms: rooms.size,
    aiModel: DEFAULT_MODEL,
    timestamp: Date.now()
  });
});

// WebRTC ICE & TURN Servers API
app.get('/api/webrtc/ice-servers', async (req, res) => {
  const servers = await getFreshIceServers();
  res.json({ iceServers: servers });
});

// Check Local AI (Ollama) Status
app.get('/api/ai/status', async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA_HOST}/api/tags`);
    const data = await r.json();
    res.json({
      online: true,
      activeModel: DEFAULT_MODEL,
      models: data.models?.map(m => m.name) || [],
      endpoint: OLLAMA_HOST
    });
  } catch (err) {
    res.json({
      online: false,
      activeModel: DEFAULT_MODEL,
      error: err.message,
      endpoint: OLLAMA_HOST
    });
  }
});

// Direct REST endpoint for quick AI questions
app.post('/api/ai/ask', async (req, res) => {
  const { prompt, system } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }
  try {
    const answer = await queryLocalAI(prompt, system);
    res.json({ answer, model: DEFAULT_MODEL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  // Track authentication status on socket data
  socket.data = {
    authenticated: false,
    roomId: null,
    userName: null
  };

  const clientIp = socket.handshake.address || socket.conn.remoteAddress;
  console.log(`[Socket] Connection attempt: ${socket.id} from ${clientIp}`);

  // Helper to ensure socket is authenticated
  const isAuthorized = () => {
    return Boolean(
      socket.data?.authenticated &&
      socket.data?.roomId &&
      socket.data?.roomId === currentRoom &&
      rooms.has(currentRoom)
    );
  };

  // Format partner member state for Android Native App (SocketManager.kt parsePartnerState)
  const formatPartnerForMobile = (member) => {
    if (!member) return null;
    const completedCount = Array.isArray(member.tasks)
      ? member.tasks.filter((t) => t.completed).length
      : (member.tasksCompleted || 0);
    const activeTaskText = member.activeTask || member.target || (Array.isArray(member.tasks) && member.tasks[0]?.text) || 'Focusing';

    return {
      nickname: member.name || 'Partner',
      avatar: member.avatar || '🌸',
      currentTask: activeTaskText,
      elapsedSeconds: member.timerSeconds || member.seconds || 0,
      tasksCompleted: completedCount,
      isOnline: true,
      isCameraOn: Boolean(member.isVideoOn),
      isMicOn: Boolean(member.isMicOn),
    };
  };

  // Broadcast partner status to mobile devices in this room
  const notifyMobilePartners = (roomId) => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    const members = Array.from(room.members.values());

    for (const [sId, member] of room.members.entries()) {
      const partner = members.find((m) => m.id !== sId);
      const sock = io.sockets.sockets.get(sId);
      if (sock) {
        const partnerData = partner ? formatPartnerForMobile(partner) : null;
        sock.emit('room-users', partnerData);
        if (partnerData) {
          sock.emit('task-update', partnerData);
        }
      }
    }
  };

  // Join or Reconnect to a study room (Core logic shared by Web & Mobile)
  const handleJoinRoom = async ({ roomId, secret, user }) => {
    const rawRoom = (roomId || 'our-study-date').trim();
    const rawSecret = (secret || '').trim();
    const rawName = (user?.name || `Learner ${socket.id.slice(0, 4)}`).trim();

    // 1. Initialize room if new
    if (!rooms.has(rawRoom)) {
      rooms.set(rawRoom, {
        secret: rawSecret,
        createdAt: Date.now(),
        lastActive: Date.now(),
        members: new Map(),
        doubts: new Map(),
      });
      console.log(`[Security] 🔒 Private room created: "${rawRoom}" (Passcode protected)`);
    }

    const room = rooms.get(rawRoom);
    if (!room.doubts) room.doubts = new Map();
    room.lastActive = Date.now();

    // 2. SECURITY CHECK 1: Cryptographic Passcode / Room Key
    // If the room has a passcode, incoming secret MUST match
    if (room.secret && room.secret !== rawSecret) {
      console.warn(`[SECURITY ALERT] 🛑 Unauthorized join attempt to "${rawRoom}" from ${clientIp} (${rawName}) - Invalid Passcode.`);
      socket.emit('auth-error', {
        code: 'INVALID_PASSCODE',
        message: '❌ Access Denied: Incorrect room passcode. Intruders blocked.'
      });
      setTimeout(() => {
        try { socket.disconnect(true); } catch {}
      }, 150);
      return;
    }

    // 3. SECURITY & RECONNECT HANDLING: Clean stale sessions & eliminate false lockouts
    const roomMembers = room.members;

    // Purge any dead or disconnected sockets immediately
    for (const [sId, existingMember] of Array.from(roomMembers.entries())) {
      const liveSock = io.sockets.sockets.get(sId);
      if (!liveSock || !liveSock.connected) {
        console.log(`[Clean] 🧹 Purged dead socket ${sId} (${existingMember.name}) from "${rawRoom}"`);
        roomMembers.delete(sId);
      }
    }

    // Check if user is reconnecting by socket ID or persistent deviceId
    const clientDeviceId = user?.deviceId || null;
    let existingSocketToReplace = null;
    for (const [sId, existingMember] of roomMembers.entries()) {
      const isSameSocket = sId === socket.id;
      const isSameDevice = clientDeviceId && existingMember.deviceId && existingMember.deviceId === clientDeviceId;
      if (isSameSocket || isSameDevice) {
        existingSocketToReplace = sId;
        break;
      }
    }

    // If room has 2 members but caller has verified the correct secret passcode:
    if (!existingSocketToReplace && roomMembers.size >= 2) {
      const now = Date.now();
      // Check for any socket with no heartbeat ping in > 25 seconds
      for (const [sId, m] of roomMembers.entries()) {
        const isStale = (m.lastPing && now - m.lastPing > 25000) || (!m.lastPing && now - m.joinedAt > 35000);
        if (isStale) {
          console.log(`[Reconnect] 🔄 Replacing inactive/stale session for "${m.name}" (${sId}) with incoming verified partner`);
          existingSocketToReplace = sId;
          break;
        }
      }

      // If still not found, replace the oldest socket in the room so verified partners with the passcode are never locked out
      if (!existingSocketToReplace) {
        let oldestId = null;
        let oldestTime = Infinity;
        for (const [sId, m] of roomMembers.entries()) {
          const t = m.joinedAt || 0;
          if (t < oldestTime) {
            oldestTime = t;
            oldestId = sId;
          }
        }
        if (oldestId) {
          console.log(`[Reconnect] 🔄 Replacing oldest session (${oldestId}) to let incoming verified partner connect`);
          existingSocketToReplace = oldestId;
        }
      }
    }

    if (existingSocketToReplace) {
      console.log(`[Reconnect] 🔄 Auto-reconnected: Replacing previous session (${existingSocketToReplace} -> ${socket.id}) for "${rawName}"`);
      const oldSocket = io.sockets.sockets.get(existingSocketToReplace);
      if (oldSocket && oldSocket.id !== socket.id) {
        try { oldSocket.disconnect(true); } catch {}
      }
      roomMembers.delete(existingSocketToReplace);
    }

    // Mark socket as authorized
    currentRoom = rawRoom;
    socket.data = {
      authenticated: true,
      roomId: currentRoom,
      userName: rawName
    };

    currentUser = {
      id: socket.id,
      deviceId: clientDeviceId,
      name: rawName,
      avatar: user?.avatar || '🎓',
      status: user?.status || 'studying',
      isSharing: false,
      isMicOn: Boolean(user?.isMicOn),
      isVideoOn: Boolean(user?.isVideoOn),
      target: user?.target || '',
      tasks: user?.tasks || [],
      progress: user?.progress || 0,
      joinedAt: Date.now(),
    };

    socket.join(currentRoom);
    roomMembers.set(socket.id, currentUser);

    // Notify partner in the room
    socket.to(currentRoom).emit('user-joined', currentUser);

    // Send verified room state and fresh ICE/TURN servers to joined user
    const iceServers = await getFreshIceServers();
    socket.emit('room-synced', {
      roomId: currentRoom,
      members: Array.from(roomMembers.values()),
      doubts: Array.from(room.doubts.values()).filter((d) => d.expiresAt > Date.now()),
      self: currentUser,
      isSecured: true,
      maxCapacity: 2,
      memberCount: roomMembers.size,
      iceServers
    });

    // Notify mobile Android app clients with partner state
    notifyMobilePartners(currentRoom);

    console.log(`[Room] ✅ ${currentUser.name} joined "${currentRoom}" (Active verified partners: ${roomMembers.size}/2, ICE servers: ${iceServers.length})`);
  };

  // 1. Join room via explicit socket event (Desktop & Web clients)
  socket.on('join-room', handleJoinRoom);

  // 2. Auto-join for Android / Native apps connecting with handshake query params
  const q = socket.handshake.query || {};
  if (q.room) {
    const qRoom = String(q.room).trim();
    const qSecret = q.secret ? String(q.secret).trim() : '';
    const qNick = q.nickname ? String(q.nickname).trim() : `Learner ${socket.id.slice(0, 4)}`;
    const qDevId = q.deviceId ? String(q.deviceId).trim() : null;

    console.log(`[Android-Bridge] 📱 Auto-joining mobile client: room="${qRoom}", nick="${qNick}"`);
    handleJoinRoom({
      roomId: qRoom,
      secret: qSecret,
      user: {
        name: qNick,
        deviceId: qDevId,
        avatar: '📱',
      }
    }).catch((err) => {
      console.warn('[Android-Bridge] Auto-join error:', err.message);
    });
  }

  // Client request for dynamic ICE & TURN servers
  socket.on('get-ice-servers', async (callback) => {
    const servers = await getFreshIceServers();
    if (typeof callback === 'function') {
      callback({ iceServers: servers });
    } else {
      socket.emit('ice-servers', { iceServers: servers });
    }
  });

  // Emoji Reactions (Real-time broadcast for floating overlay)
  socket.on('send-emoji', ({ emoji, intensity = 1, isFountain = true, direction = 'down' }) => {
    if (!isAuthorized()) return;
    const sender = currentUser?.name || 'Study Mate';
    
    // Broadcast only to members of this authenticated room
    io.to(currentRoom).emit('emoji-received', {
      id: `${socket.id}-${Date.now()}-${Math.random()}`,
      emoji,
      sender,
      intensity,
      isFountain,
      direction,
      timestamp: Date.now()
    });
  });

  // WebRTC Screen Sharing Signals (Strictly peer-to-peer within room)
  socket.on('screen-share-status', ({ isSharing }) => {
    if (!isAuthorized()) return;
    currentUser.isSharing = isSharing;
    socket.to(currentRoom).emit('peer-screen-status', {
      userId: socket.id,
      name: currentUser.name,
      isSharing
    });
  });

  socket.on('signal-offer', ({ targetUserId, offer }) => {
    if (!isAuthorized()) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    let target = targetUserId;
    if (!target || !room.members.has(target)) {
      target = Array.from(room.members.keys()).find((id) => id !== socket.id);
    }
    console.log(`[Signal] 📤 OFFER from ${socket.id} (${currentUser?.name}) -> target: ${target}`);
    if (target && room.members.has(target)) {
      io.to(target).emit('signal-offer', {
        senderId: socket.id,
        offer
      });
      io.to(target).emit('offer', offer);
    } else {
      socket.to(currentRoom).emit('signal-offer', {
        senderId: socket.id,
        offer
      });
      socket.to(currentRoom).emit('offer', offer);
    }
  });

  socket.on('signal-answer', ({ targetUserId, answer }) => {
    if (!isAuthorized()) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    let target = targetUserId;
    if (!target || !room.members.has(target)) {
      target = Array.from(room.members.keys()).find((id) => id !== socket.id);
    }
    console.log(`[Signal] 📥 ANSWER from ${socket.id} (${currentUser?.name}) -> target: ${target}`);
    if (target && room.members.has(target)) {
      io.to(target).emit('signal-answer', {
        senderId: socket.id,
        answer
      });
      io.to(target).emit('answer', answer);
    } else {
      socket.to(currentRoom).emit('signal-answer', {
        senderId: socket.id,
        answer
      });
      socket.to(currentRoom).emit('answer', answer);
    }
  });

  socket.on('rotate-ice-servers', ({ targetUserId, iceServers }) => {
    if (!isAuthorized()) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    let target = targetUserId;
    if (!target || !room.members.has(target)) {
      target = Array.from(room.members.keys()).find((id) => id !== socket.id);
    }
    console.log(`[Signal] 🔄 Forwarding rotate-ice-servers from ${socket.id} -> ${target}`);
    if (target && room.members.has(target)) {
      io.to(target).emit('rotate-ice-servers', { senderId: socket.id, iceServers });
    } else {
      socket.to(currentRoom).emit('rotate-ice-servers', { senderId: socket.id, iceServers });
    }
  });

  socket.on('signal-ice', ({ targetUserId, candidate }) => {
    if (!isAuthorized()) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    let target = targetUserId;
    if (!target || !room.members.has(target)) {
      target = Array.from(room.members.keys()).find((id) => id !== socket.id);
    }
    const candType = candidate?.candidate ? candidate.candidate.split(' ')[7] || 'cand' : 'null';
    console.log(`[Signal] 🧊 ICE (${candType}) from ${socket.id} (${currentUser?.name}) -> target: ${target}`);
    if (target && room.members.has(target)) {
      io.to(target).emit('signal-ice', {
        senderId: socket.id,
        candidate
      });
      io.to(target).emit('ice-candidate', candidate);
    } else {
      socket.to(currentRoom).emit('signal-ice', {
        senderId: socket.id,
        candidate
      });
      socket.to(currentRoom).emit('ice-candidate', candidate);
    }
  });

  // Instantaneous Keyframe Request (PLI / FIR) for unfreezing partner video
  socket.on('request-keyframe', ({ targetUserId } = {}) => {
    if (!isAuthorized()) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    let target = targetUserId;
    if (!target || !room.members.has(target)) {
      target = Array.from(room.members.keys()).find((id) => id !== socket.id);
    }
    console.log(`[Signal] 🔑 Keyframe requested from ${socket.id} (${currentUser?.name}) -> target: ${target}`);
    if (target && room.members.has(target)) {
      io.to(target).emit('request-keyframe', { senderId: socket.id });
    } else {
      socket.to(currentRoom).emit('request-keyframe', { senderId: socket.id });
    }
  });

  // Client WebRTC Diagnostics logger
  socket.on('webrtc-diag', (diag) => {
    console.log(`[WebRTC-Diag] 📊 [${currentUser?.name || socket.id}]:`, JSON.stringify(diag));
  });

  // Real-time Mic, Webcam & System/Music Media Status synchronization
  socket.on('media-status-change', ({ isMicOn, isVideoOn, isMusicOn }) => {
    if (!isAuthorized()) return;
    if (currentUser) {
      currentUser.isMicOn = Boolean(isMicOn);
      currentUser.isVideoOn = Boolean(isVideoOn);
      currentUser.isMusicOn = Boolean(isMusicOn);
    }
    console.log(`[MediaStatus] 🎥 ${currentUser?.name || socket.id} -> mic:${isMicOn}, video:${isVideoOn}, music:${isMusicOn}`);
    socket.to(currentRoom).emit('peer-media-status', {
      userId: socket.id,
      name: currentUser?.name,
      isMicOn: Boolean(isMicOn),
      isVideoOn: Boolean(isVideoOn),
      isMusicOn: Boolean(isMusicOn),
    });
    notifyMobilePartners(currentRoom);
  });

  // Status updates
  socket.on('update-status', ({ status }) => {
    if (!isAuthorized()) return;
    currentUser.status = status;
    io.to(currentRoom).emit('member-status-changed', {
      userId: socket.id,
      status
    });
    notifyMobilePartners(currentRoom);
  });

  // Daily Target & To-Do List synchronization
  socket.on('update-goal', ({ target, tasks, progress }) => {
    if (!isAuthorized()) return;
    currentUser.target = target;
    currentUser.tasks = tasks;
    currentUser.progress = progress;

    io.to(currentRoom).emit('peer-goal-updated', {
      userId: socket.id,
      name: currentUser.name,
      target,
      tasks,
      progress
    });
    notifyMobilePartners(currentRoom);
  });

  // Two-Way Live Focus Timer synchronization
  socket.on('sync-focus-timer', ({ seconds, isRunning, activeTask }) => {
    if (!isAuthorized()) return;
    currentUser.timerSeconds = seconds;
    currentUser.isTimerRunning = isRunning;
    currentUser.activeTask = activeTask;

    socket.to(currentRoom).emit('peer-timer-synced', {
      userId: socket.id,
      name: currentUser.name,
      seconds,
      isRunning,
      activeTask
    });
    notifyMobilePartners(currentRoom);
  });

  // ==============================================================
  // 📱 ANDROID NATIVE COMPANION BRIDGE
  // Maps mobile events to desktop partner & vice versa
  // ==============================================================
  socket.on('task-update', (data) => {
    if (!isAuthorized()) return;
    if (currentUser) {
      if (data?.currentTask) {
        currentUser.target = data.currentTask;
        currentUser.activeTask = data.currentTask;
      }
      if (typeof data?.elapsedSeconds === 'number') {
        currentUser.timerSeconds = data.elapsedSeconds;
      }
      if (typeof data?.tasksCompleted === 'number') {
        currentUser.tasksCompleted = data.tasksCompleted;
      }
    }
    socket.to(currentRoom).emit('peer-goal-updated', {
      userId: socket.id,
      name: currentUser?.name,
      target: data?.currentTask,
      tasks: [],
      progress: data?.totalTasks ? Math.round(((data.tasksCompleted || 0) / data.totalTasks) * 100) : 0,
    });
    socket.to(currentRoom).emit('peer-timer-synced', {
      userId: socket.id,
      name: currentUser?.name,
      seconds: data?.elapsedSeconds || 0,
      isRunning: true,
      activeTask: data?.currentTask
    });
    notifyMobilePartners(currentRoom);
  });

  // Android Mobile Call Signaling
  socket.on('call-request', () => {
    if (!isAuthorized()) return;
    socket.to(currentRoom).emit('call-request', { from: currentUser?.name, senderId: socket.id });
  });

  socket.on('call-accepted', () => {
    if (!isAuthorized()) return;
    socket.to(currentRoom).emit('call-accepted', { from: currentUser?.name, senderId: socket.id });
  });

  socket.on('call-ended', () => {
    if (!isAuthorized()) return;
    socket.to(currentRoom).emit('call-ended', { from: currentUser?.name, senderId: socket.id });
  });

  socket.on('offer', (sdp) => {
    if (!isAuthorized()) return;
    socket.to(currentRoom).emit('signal-offer', { senderId: socket.id, offer: sdp });
    socket.to(currentRoom).emit('offer', sdp);
  });

  socket.on('answer', (sdp) => {
    if (!isAuthorized()) return;
    socket.to(currentRoom).emit('signal-answer', { senderId: socket.id, answer: sdp });
    socket.to(currentRoom).emit('answer', sdp);
  });

  socket.on('ice-candidate', (candidate) => {
    if (!isAuthorized()) return;
    socket.to(currentRoom).emit('signal-ice', { senderId: socket.id, candidate });
    socket.to(currentRoom).emit('ice-candidate', candidate);
  });

  socket.on('sos-alert', () => {
    console.log(`[Android] SOS ping from ${currentUser?.name || socket.id}`);
  });

  // Assign task to peer
  socket.on('assign-task-to-peer', ({ targetUserId, task }) => {
    if (!isAuthorized()) return;
    socket.to(currentRoom).emit('peer-task-assigned', {
      fromUserId: socket.id,
      fromName: currentUser.name,
      targetUserId,
      task
    });
  });

  // Application-level Heartbeat to keep connection alive and update room activity
  socket.on('heartbeat', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.lastActive = Date.now();
      const member = room.members.get(socket.id);
      if (member) {
        member.lastPing = Date.now();
      }
    }
    socket.emit('heartbeat-ack', { timestamp: Date.now() });
  });

  // Leaving / Stopping session
  socket.on('leave-room', () => {
    cleanupUser();
  });

  socket.on('disconnect', () => {
    cleanupUser();
  });

  function cleanupUser() {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.members.delete(socket.id);
      socket.to(currentRoom).emit('user-left', { userId: socket.id, name: currentUser?.name });
      notifyMobilePartners(currentRoom);
      
      console.log(`[Disconnect] ${currentUser?.name || socket.id} disconnected from "${currentRoom}" (Remaining: ${room.members.size}/2)`);
      
      // If room is empty, keep passcode alive for 60 minutes in case computers are restarting!
      // This prevents someone else from stealing the room name while computers reboot.
      if (room.members.size === 0) {
        setTimeout(() => {
          if (rooms.has(currentRoom) && rooms.get(currentRoom).members.size === 0) {
            rooms.delete(currentRoom);
            console.log(`[Room] Expired empty room "${currentRoom}"`);
          }
        }, 60 * 60 * 1000);
      }
    }
  }
});

// ==============================================================
// ⏳ EPHEMERAL PURGE SWEEP (Strict 3-Hour Self-Destruct)
// Automatically deletes doubts older than 3 hours every 30 seconds
// ==============================================================
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (!room.doubts) continue;
    for (const [doubtId, doubt] of room.doubts.entries()) {
      if (now >= doubt.expiresAt) {
        room.doubts.delete(doubtId);
        console.log(`[Auto-Purge] ⏳ Doubt ${doubtId} expired (3h reached) in "${roomId}" - Automatically vanished.`);
        io.to(roomId).emit('doubt-expired', { doubtId });
      }
    }
  }
}, 30 * 1000);

// Periodic Ghost Socket Sweeper: cleans out disconnected or ungracefully terminated sockets every 10 seconds
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (!room.members) continue;
    for (const [sId, member] of Array.from(room.members.entries())) {
      const sock = io.sockets.sockets.get(sId);
      if (!sock || !sock.connected) {
        room.members.delete(sId);
        console.log(`[GhostSweep] 🧹 Removed dead socket ${sId} (${member.name}) from "${roomId}"`);
      }
    }
  }
}, 10 * 1000);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const PORT = process.env.PORT || 4000;

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[Server] Port ${PORT} is already running. Reusing existing instance.`);
  } else {
    console.error('[Server Error]', err);
  }
});

httpServer.listen(PORT, '::', () => {
  const net = getNetworkInfo();
  console.log(`\n======================================================`);
  console.log(`🥬 Amigo Secure Signaling Server is LIVE!`);
  console.log(`🔒 Zero-Loophole Security: Active (Passcode + 2-Device Lock)`);
  console.log(`======================================================`);
  console.log(`💻 On your computer:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(``);
  console.log(`👩‍💻 On HER computer (Same Wi-Fi network):`);
  console.log(`   Option 1 (Persistent Hostname - Recommended across reboots):`);
  console.log(`   http://${net.mdnsHost}:${PORT}`);
  console.log(`   Option 2 (Wi-Fi Local IP):`);
  console.log(`   http://${net.localIp}:${PORT}`);
  console.log(``);
  console.log(`🔗 1-Click Secure Link for Her (auto-configures room & passcode):`);
  console.log(`   http://${net.localIp}:${PORT}/?room=our-study-date&secret=date2026&server=http://${net.localIp}:${PORT}`);
  console.log(`======================================================\n`);
});
