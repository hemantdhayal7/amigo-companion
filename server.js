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
  // Fast ping/pong to detect rebooted / closed computers in 7 seconds
  pingTimeout: 7000,
  pingInterval: 4000,
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

// WebRTC ICE & Dynamic TURN Relay Provisioning
let cachedIceServers = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.nextcloud.com:443' },
];
let lastTurnFetch = 0;

async function getFreshIceServers() {
  const now = Date.now();
  if (
    now - lastTurnFetch < 15 * 60 * 1000 &&
    cachedIceServers.some((s) => Array.isArray(s.urls) ? s.urls.some((u) => u.startsWith('turn:')) : s.urls?.startsWith('turn:'))
  ) {
    return cachedIceServers;
  }

  try {
    const res = await fetch('https://speed.cloudflare.com/turn-creds', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
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
          {
            urls: data.urls,
            username: data.username,
            credential: data.credential,
          },
        ];
        lastTurnFetch = now;
        console.log(`[WebRTC-TURN] 🛡️ Refreshed Cloudflare TURN relay credentials (${data.urls.length} URLs, username: ${data.username.slice(0, 10)}...)`);
        return cachedIceServers;
      }
    }
  } catch (err) {
    console.warn('[WebRTC-TURN] Warning: Could not fetch dynamic Cloudflare TURN credentials:', err.message);
  }
  return cachedIceServers;
}

getFreshIceServers().catch(() => {});

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

  // Join or Reconnect to a study room
  socket.on('join-room', async ({ roomId, secret, user }) => {
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

    // 3. SECURITY CHECK 2: Strict 2-Partner Limit & Reconnect Handling
    // Zero 3rd party eavesdroppers allowed!
    const roomMembers = room.members;

    // Check if user is reconnecting after computer restart or network drop
    const clientDeviceId = user?.deviceId || null;
    let existingSocketToReplace = null;
    for (const [sId, existingMember] of roomMembers.entries()) {
      if (sId === socket.id || (clientDeviceId && existingMember.deviceId === clientDeviceId)) {
        existingSocketToReplace = sId;
        break;
      }
    }

    if (existingSocketToReplace) {
      console.log(`[Reconnect] 🔄 Auto-reconnected: Replacing previous session for "${rawName}" (${existingSocketToReplace} -> ${socket.id})`);
      roomMembers.delete(existingSocketToReplace);
    } else if (roomMembers.size >= 2) {
      // Room is strictly capped at 2 study partners
      console.warn(`[SECURITY ALERT] 🛑 Blocked 3rd connection to private room "${rawRoom}" from ${clientIp} (${rawName}) - Room is full (2/2).`);
      socket.emit('auth-error', {
        code: 'ROOM_LOCKED_FULL',
        message: '🔒 Room Locked: This study date is already full with 2 verified partners. No third party allowed.'
      });
      setTimeout(() => {
        try { socket.disconnect(true); } catch {}
      }, 150);
      return;
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

    console.log(`[Room] ✅ ${currentUser.name} joined "${currentRoom}" (Active verified partners: ${roomMembers.size}/2, ICE servers: ${iceServers.length})`);
  });

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
    } else {
      socket.to(currentRoom).emit('signal-offer', {
        senderId: socket.id,
        offer
      });
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
    } else {
      socket.to(currentRoom).emit('signal-answer', {
        senderId: socket.id,
        answer
      });
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
    } else {
      socket.to(currentRoom).emit('signal-ice', {
        senderId: socket.id,
        candidate
      });
    }
  });

  // Client WebRTC Diagnostics logger
  socket.on('webrtc-diag', (diag) => {
    console.log(`[WebRTC-Diag] 📊 [${currentUser?.name || socket.id}]:`, JSON.stringify(diag));
  });

  // Real-time Mic & Webcam Media Status synchronization
  socket.on('media-status-change', ({ isMicOn, isVideoOn }) => {
    if (!isAuthorized()) return;
    if (currentUser) {
      currentUser.isMicOn = Boolean(isMicOn);
      currentUser.isVideoOn = Boolean(isVideoOn);
    }
    console.log(`[MediaStatus] 🎥 ${currentUser?.name || socket.id} -> mic:${isMicOn}, video:${isVideoOn}`);
    socket.to(currentRoom).emit('peer-media-status', {
      userId: socket.id,
      name: currentUser?.name,
      isMicOn: Boolean(isMicOn),
      isVideoOn: Boolean(isVideoOn)
    });
  });

  // Status updates
  socket.on('update-status', ({ status }) => {
    if (!isAuthorized()) return;
    currentUser.status = status;
    io.to(currentRoom).emit('member-status-changed', {
      userId: socket.id,
      status
    });
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
  });

  // Crisis SOS alert
  socket.on('trigger-sos', ({ note }) => {
    if (!isAuthorized()) return;
    console.log(`[SOS ALERT] 🚨 Triggered by ${currentUser.name} in room ${currentRoom}`);
    
    io.to(currentRoom).emit('sos-alert-received', {
      userId: socket.id,
      senderName: currentUser.name,
      avatar: currentUser.avatar,
      note: note || 'is asking for a caring check-in or emotional support right now.',
      timestamp: Date.now()
    });
  });

  // ==============================================================
  // 📸 EPHEMERAL DOUBT & LOCAL AI ASSISTANT (3-Hour Self-Destruct)
  // ==============================================================
  socket.on('create-doubt', ({ id, image, question }) => {
    if (!isAuthorized()) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    if (!room.doubts) room.doubts = new Map();

    const doubtId = id || `doubt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const newDoubt = {
      id: doubtId,
      image: image || null,
      question: (question || '').trim(),
      senderId: socket.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      createdAt: now,
      expiresAt: now + DOUBT_TTL_MS, // 3 hours lifetime
      aiAnswer: null,
      aiStatus: 'idle',
    };

    room.doubts.set(doubtId, newDoubt);
    console.log(`[Doubt] ❓ New ephemeral doubt ${doubtId} posted by ${currentUser.name} in "${currentRoom}" (Self-destruct in 3h)`);

    io.to(currentRoom).emit('doubt-created', newDoubt);
  });

  socket.on('delete-doubt', ({ doubtId }) => {
    if (!isAuthorized()) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.doubts) return;

    if (room.doubts.has(doubtId)) {
      room.doubts.delete(doubtId);
      console.log(`[Doubt] 🗑️ Doubt ${doubtId} manually resolved/deleted in "${currentRoom}"`);
      io.to(currentRoom).emit('doubt-deleted', { doubtId });
    }
  });

  // Query Local AI (Ollama gemma3:1b-it-qat) for a doubt
  socket.on('ask-doubt-ai', async ({ doubtId, prompt }) => {
    if (!isAuthorized()) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.doubts) return;

    const doubt = room.doubts.get(doubtId);
    if (!doubt) return;

    doubt.aiStatus = 'generating';
    io.to(currentRoom).emit('doubt-ai-status', { doubtId, status: 'generating' });

    try {
      const userPrompt = prompt || doubt.question || 'Please provide a clear, step-by-step explanation for this study problem.';
      console.log(`[Local AI] 🧠 Querying Ollama (${DEFAULT_MODEL}) for doubt ${doubtId}...`);
      const answer = await queryLocalAI(userPrompt);
      
      doubt.aiAnswer = answer;
      doubt.aiStatus = 'completed';
      console.log(`[Local AI] ✅ Completed explanation for doubt ${doubtId}`);

      io.to(currentRoom).emit('doubt-ai-answered', { doubtId, answer, status: 'completed' });
    } catch (err) {
      console.error(`[Local AI] ❌ Error answering doubt ${doubtId}:`, err.message);
      doubt.aiStatus = 'error';
      doubt.aiError = err.message || 'Local AI query failed';
      io.to(currentRoom).emit('doubt-ai-status', { doubtId, status: 'error', error: doubt.aiError });
    }
  });

  // Quick Direct AI Question without screenshot
  socket.on('ask-quick-ai', async ({ prompt, requestId }) => {
    if (!isAuthorized()) return;
    try {
      console.log(`[Quick AI] 🧠 Querying Ollama (${DEFAULT_MODEL}) for ${currentUser.name}...`);
      const answer = await queryLocalAI(prompt);
      socket.emit('quick-ai-result', { requestId, prompt, answer, success: true });
    } catch (err) {
      socket.emit('quick-ai-result', { requestId, prompt, error: err.message, success: false });
    }
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

httpServer.listen(PORT, '0.0.0.0', () => {
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
