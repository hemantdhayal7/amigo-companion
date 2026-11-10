// WebRTC Peer-to-Peer Voice & Video Call Manager for Study Companion
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com:3478' },
    { urls: 'stun:stun.nextcloud.com:443' },
  ],
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceCandidatePoolSize: 2,
};

// Prioritize universal VP8 (works 100% reliably across all Windows/Mac/Linux/Android devices without hardware encoder failures)
// followed by H264 as secondary codec
function preferHardwareCodecsInSdp(sdp) {
  if (!sdp || typeof sdp !== 'string') return sdp;
  try {
    const lines = sdp.split('\r\n');
    const mVideoIdx = lines.findIndex((l) => l.startsWith('m=video '));
    if (mVideoIdx === -1) return sdp;

    const vp8Pts = [];
    const h264Pts = [];
    for (const line of lines) {
      const vp8Match = line.match(/^a=rtpmap:(\d+)\s+VP8\/90000/i);
      if (vp8Match) vp8Pts.push(vp8Match[1]);
      const h264Match = line.match(/^a=rtpmap:(\d+)\s+H264\/90000/i);
      if (h264Match) h264Pts.push(h264Match[1]);
    }

    const priorityPts = [...vp8Pts, ...h264Pts];
    if (priorityPts.length > 0) {
      const parts = lines[mVideoIdx].split(' ');
      const header = parts.slice(0, 3);
      const rest = parts.slice(3).filter((p) => !priorityPts.includes(p));
      lines[mVideoIdx] = [...header, ...priorityPts, ...rest].join(' ');
      return lines.join('\r\n');
    }
  } catch (err) {
    console.warn('[WebRTC] SDP codec sort warning:', err);
  }
  return sdp;
}

// Enable high-fidelity voice + music streaming with robust forward error correction
function optimizeOpusInSdp(sdp) {
  if (!sdp || typeof sdp !== 'string') return sdp;
  try {
    return sdp.replace(/a=fmtp:(\d+)\s+([^\r\n]+)/g, (match, pt, params) => {
      if (sdp.includes(`a=rtpmap:${pt} opus/48000/2`)) {
        let newParams = params;
        // In-band Forward Error Correction (FEC) - protects voice against Wi-Fi packet loss
        if (!newParams.includes('useinbandfec=')) {
          newParams += ';useinbandfec=1';
        }
        // Continuous transmission - prevents Linux PulseAudio / PipeWire audio sinks from sleeping
        if (!newParams.includes('usedtx=')) {
          newParams += ';usedtx=0';
        }
        // Allow stereo reception for music while preserving clean mono voice for laptop mics
        if (!newParams.includes('stereo=')) {
          newParams += ';stereo=1';
        }
        // High quality audio bitrate (up to 128kbps)
        if (!newParams.includes('maxaveragebitrate=')) {
          newParams += ';maxaveragebitrate=128000';
        }
        return `a=fmtp:${pt} ${newParams}`;
      }
      return match;
    });
  } catch (err) {
    console.warn('[WebRTC] Opus SDP optimization warning:', err);
    return sdp;
  }
}

function optimizeSdp(sdp) {
  if (!sdp || typeof sdp !== 'string') return sdp;
  return optimizeOpusInSdp(preferHardwareCodecsInSdp(sdp));
}

export class PeerCallManager {
  constructor({ socket, onRemoteStreamUpdate, onPeerMediaStatus, onError }) {
    this.socket = socket;
    this.onRemoteStreamUpdate = onRemoteStreamUpdate || (() => {});
    this.onPeerMediaStatus = onPeerMediaStatus || (() => {});
    this.onError = onError || (() => {});

    this.peerConnection = null;
    this.localStream = new MediaStream();
    this.remoteStream = new MediaStream();
    this.iceCandidateQueue = [];

    this.isMicOn = false;
    this.isVideoOn = false;
    this.isPeerMicOn = false;
    this.isPeerVideoOn = false;
    this.isMusicSharing = false;
    this.isPeerMusicOn = false;

    this.screenStream = null;
    this.musicStream = null;
    this.micTrack = null;
    this.systemAudioTrack = null;

    // Web Audio API mixer graph for simultaneous Mic + YouTube Music streaming
    this.audioContext = null;
    this.audioDestination = null;
    this.mixedTrack = null;
    this.micSourceNode = null;
    this.musicSourceNode = null;
    this.micGainNode = null;
    this.musicGainNode = null;
    this.micVolume = 1.0;
    this.musicVolume = 0.85;
    this.currentMicTrackId = null;
    this.currentMusicTrackId = null;
    this.onMusicStatusChange = null;

    this.videoSender = null;
    this.audioSender = null;

    this.targetPeerId = null;
    this.isInitiator = false;
    this.isMakingOffer = false;
    this.pendingNegotiation = false;
    this.lastIceRestart = 0;
    this.rtcConfig = { ...RTC_CONFIG };

    this.wakeLock = null;
    this.keepAliveOscillator = null;
    this.keepAliveGain = null;
    this.keyframeTimer = null;
    this.healthMonitorTimer = null;

    this.setupSocketListeners();
    this.fetchFallbackTurnCredentials();
    this.setupVisibilityListener();
  }

  async fetchFreshIceServers() {
    try {
      const res = await fetch('/api/webrtc/ice-servers', {
        headers: { 'Bypass-Tunnel-Reminder': 'true' },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.iceServers && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          return data.iceServers;
        }
      }
    } catch {}
    return null;
  }

  async fetchFallbackTurnCredentials() {
    try {
      if (this.socket) {
        this.socket.emit('get-ice-servers', (resp) => {
          if (resp?.iceServers) {
            this.updateIceServers(resp.iceServers);
          }
        });
      }
      const servers = await this.fetchFreshIceServers();
      if (servers) {
        this.updateIceServers(servers);
      }
    } catch {}
  }

  setupVisibilityListener() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && (this.isVideoOn || this.isPeerVideoOn)) {
          this.enableBackgroundImmunity();
          this.requestKeyFrame();
          this.refreshRemoteStream(true);
        }
      });
    }
  }

  // Acquire Screen Wake Lock and keep Web Audio pipeline alive so browsers (Chrome/Edge on Windows & Linux)
  // NEVER throttle or suspend background WebRTC processing after 5 minutes!
  async enableBackgroundImmunity() {
    // 1. Screen WakeLock API
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !this.wakeLock) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
        console.log('[WebRTC] 🛡️ Screen WakeLock acquired (prevents 5-minute OS & browser sleep)');
      }
    } catch {}

    // 2. Continuous Inaudible Audio Keep-Alive (Exempts tab from Chrome's 5-minute Intensive Wake Up Throttling)
    try {
      const ctx = this.getAudioContext();
      if (ctx && !this.keepAliveOscillator) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(20, ctx.currentTime);
        gain.gain.setValueAtTime(0.00001, ctx.currentTime); // Inaudible to humans
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        this.keepAliveOscillator = osc;
        this.keepAliveGain = gain;
        console.log('[WebRTC] 🛡️ Audio Keep-Alive active (prevents Chrome 5-min background freeze)');
      }
    } catch {}
  }

  disableBackgroundImmunity() {
    if (this.wakeLock) {
      try { this.wakeLock.release(); } catch {}
      this.wakeLock = null;
    }
    if (this.keepAliveOscillator) {
      try { this.keepAliveOscillator.stop(); } catch {}
      this.keepAliveOscillator = null;
    }
  }

  // Periodic IDR keyframe sender: guarantees that even if a packet drops over Wi-Fi, video auto-unfreezes
  startPeriodicKeyframeSender() {
    if (this.keyframeTimer) return;
    this.keyframeTimer = setInterval(async () => {
      if ((this.isVideoOn || this.screenStream) && this.peerConnection && this.peerConnection.connectionState === 'connected') {
        const sender = this.findVideoSender();
        if (sender && typeof sender.generateKeyFrame === 'function') {
          try {
            await sender.generateKeyFrame();
          } catch {}
        }
      }
    }, 15000);
  }

  stopPeriodicKeyframeSender() {
    if (this.keyframeTimer) {
      clearInterval(this.keyframeTimer);
      this.keyframeTimer = null;
    }
  }

  // Active Stream Health Monitor: detects if inbound RTP video bytes stalled
  // and gently prompts an IDR keyframe to unfreeze rendering without restarting ICE or disrupting media!
  startStreamHealthMonitor() {
    if (this.healthMonitorTimer) return;
    let lastBytes = -1;
    let staleCount = 0;

    this.healthMonitorTimer = setInterval(async () => {
      if (!this.peerConnection || !this.isPeerVideoOn) {
        staleCount = 0;
        lastBytes = -1;
        return;
      }
      if (this.peerConnection.connectionState !== 'connected' && this.peerConnection.iceConnectionState !== 'connected') {
        return;
      }

      try {
        const stats = await this.peerConnection.getStats();
        let currentBytes = 0;
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            currentBytes += (report.bytesReceived || 0);
          }
        });

        if (currentBytes > 0) {
          if (currentBytes === lastBytes) {
            staleCount++;
            if (staleCount === 3) {
              console.warn('[WebRTC Health] Inbound video bytes quiet for 9s. Prompting fresh keyframe from peer...');
              this.requestKeyFrame();
              staleCount = 0;
            }
          } else {
            staleCount = 0;
          }
          lastBytes = currentBytes;
        }
      } catch {}
    }, 3000);
  }

  stopStreamHealthMonitor() {
    if (this.healthMonitorTimer) {
      clearInterval(this.healthMonitorTimer);
      this.healthMonitorTimer = null;
    }
  }

  updateIceServers(servers) {
    if (!Array.isArray(servers) || servers.length === 0) return;
    const hasTurn = servers.some((s) => Array.isArray(s.urls) ? s.urls.some(u => u.startsWith('turn:')) : s.urls?.startsWith('turn:'));
    console.log(`[WebRTC] 🔄 Updating ICE servers (Total: ${servers.length}, TURN Relay Enabled: ${hasTurn})`);
    this.rtcConfig = { ...RTC_CONFIG, iceServers: servers };
    if (this.peerConnection && this.peerConnection.setConfiguration) {
      // CRITICAL: Do NOT call setConfiguration if the peer connection is actively connected!
      // In Chromium / WebRTC, invoking setConfiguration with new TURN credentials on a healthy connection
      // initiates candidate re-allocation and re-checking, causing an artificial 5-6 second freeze/hiccup!
      const isActivelyConnected =
        this.peerConnection.connectionState === 'connected' ||
        this.peerConnection.iceConnectionState === 'connected' ||
        this.peerConnection.iceConnectionState === 'completed';
      if (isActivelyConnected) {
        console.log('[WebRTC] Active stream is healthy and connected. Storing fresh ICE servers for next reconnection without interrupting live stream.');
        return;
      }
      try {
        this.peerConnection.setConfiguration(this.rtcConfig);
        console.log('[WebRTC] Applied updated ICE servers to peer connection');
      } catch (err) {
        console.warn('[WebRTC] setConfiguration warning:', err);
      }
    }
  }

  setTargetPeerId(peerId) {
    if (peerId) {
      this.targetPeerId = peerId;
    }
  }

  emitDiag(event, details = {}) {
    if (this.socket) {
      try {
        this.socket.emit('webrtc-diag', {
          event,
          ...details,
          targetPeerId: this.targetPeerId,
          timestamp: Date.now(),
        });
      } catch {}
    }
  }

  requestKeyFrame() {
    const now = Date.now();
    if (this.lastKeyframeRequest && now - this.lastKeyframeRequest < 3000) {
      return; // Debounce rapid keyframe requests within 3 seconds
    }
    this.lastKeyframeRequest = now;
    if (this.socket) {
      console.log('[WebRTC] 🔑 Emitting request-keyframe to peer:', this.targetPeerId);
      this.socket.emit('request-keyframe', { targetUserId: this.targetPeerId });
    }
  }

  preferCodecs(transceiver) {
    if (!transceiver || !transceiver.setCodecPreferences) return;
    try {
      if (typeof RTCRtpReceiver !== 'undefined' && RTCRtpReceiver.getCapabilities) {
        const caps = RTCRtpReceiver.getCapabilities('video');
        if (caps && caps.codecs) {
          // Prioritize universal VP8 (guaranteed libvpx software encoder on Windows, hardware-accelerated decode on Mac)
          // followed by H.264 as secondary codec
          const vp8Codecs = caps.codecs.filter((c) => c.mimeType && c.mimeType.toLowerCase() === 'video/vp8');
          const h264Codecs = caps.codecs.filter((c) => c.mimeType && c.mimeType.toLowerCase() === 'video/h264');
          const otherCodecs = caps.codecs.filter(
            (c) => c.mimeType && c.mimeType.toLowerCase() !== 'video/vp8' && c.mimeType.toLowerCase() !== 'video/h264'
          );
          const preferred = [...vp8Codecs, ...h264Codecs, ...otherCodecs];
          if (preferred.length > 0) {
            transceiver.setCodecPreferences(preferred);
            console.log('[WebRTC] Set video codec preferences: VP8 (Universal) -> H.264 -> Others');
          }
        }
      }
    } catch (e) {
      console.warn('[WebRTC] Error setting codec preferences:', e);
    }
  }

  preferVP8(transceiver) {
    this.preferCodecs(transceiver);
  }

  async initiateCallTo(targetUserId) {
    if (targetUserId) {
      this.targetPeerId = targetUserId;
    }
    console.log('[WebRTC] Initiating call to target user:', this.targetPeerId);
    this.isInitiator = true;
    const pc = this.getOrCreatePeerConnection();
    if (pc.signalingState === 'have-local-offer') {
      try {
        console.log('[WebRTC] Rolling back stale local offer before initiating call');
        await pc.setLocalDescription({ type: 'rollback' });
      } catch (e) {
        console.warn('[WebRTC] Rollback error in initiateCallTo:', e);
      }
    }
    if (pc.getTransceivers) {
      pc.getTransceivers().forEach((t) => {
        t.direction = 'sendrecv';
      });
    }
    await this.negotiate(this.targetPeerId);
  }

  async initiateCall() {
    return this.initiateCallTo(this.targetPeerId);
  }

  setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('signal-offer', async ({ senderId, offer }) => {
      try {
        await this.handleRemoteOffer(offer, senderId);
      } catch (err) {
        console.error('[WebRTC] Error handling remote offer:', err);
      }
    });

    this.socket.on('signal-answer', async ({ senderId, answer }) => {
      try {
        if (senderId) this.targetPeerId = senderId;
        await this.handleRemoteAnswer(answer);
      } catch (err) {
        console.error('[WebRTC] Error handling remote answer:', err);
      }
    });

    this.socket.on('signal-ice', async ({ senderId, candidate }) => {
      try {
        if (senderId) this.targetPeerId = senderId;
        await this.handleRemoteIceCandidate(candidate);
      } catch (err) {
        console.error('[WebRTC] Error handling remote ICE candidate:', err);
      }
    });

    this.socket.on('request-keyframe', async () => {
      console.log('[WebRTC] 🔑 Remote peer requested keyframe. Generating instantaneous IDR keyframe...');
      const sender = this.findVideoSender();
      if (sender) {
        if (typeof sender.generateKeyFrame === 'function') {
          try {
            await sender.generateKeyFrame();
            console.log('[WebRTC] 🔑 RTCRtpSender.generateKeyFrame() dispatched successfully');
          } catch (e) {
            console.warn('[WebRTC] generateKeyFrame error:', e);
          }
        }
        const activeTrack =
          this.screenStream?.getVideoTracks().find((t) => t.readyState === 'live') ||
          this.localStream.getVideoTracks().find((t) => t.readyState === 'live');
        if (activeTrack) {
          try {
            await sender.replaceTrack(activeTrack);
          } catch {}
        }
      }
    });

    this.socket.on('peer-media-status', ({ userId, isMicOn, isVideoOn, isMusicOn }) => {
      if (userId) this.targetPeerId = userId;
      this.isPeerMicOn = Boolean(isMicOn);
      this.isPeerVideoOn = Boolean(isVideoOn);
      this.isPeerMusicOn = Boolean(isMusicOn);
      this.onPeerMediaStatus({
        isPeerMicOn: this.isPeerMicOn,
        isPeerVideoOn: this.isPeerVideoOn,
        isPeerMusicOn: this.isPeerMusicOn,
      });
      // Refresh remote stream immediately and again after keyframe arrival
      this.refreshRemoteStream(true);
      if (this.isPeerVideoOn || this.isPeerMicOn || this.isPeerMusicOn) {
        setTimeout(() => this.refreshRemoteStream(true), 250);
        setTimeout(() => this.refreshRemoteStream(true), 700);
        setTimeout(() => this.refreshRemoteStream(true), 1500);
      }

      // If partner says video is ON, actively request keyframe to decode immediately
      if (this.isPeerVideoOn) {
        this.requestKeyFrame();
        setTimeout(() => {
          if (this.isPeerVideoOn) {
            this.requestKeyFrame();
          }
        }, 1000);

        const hasLiveVideoTrack = this.remoteStream.getVideoTracks().some((t) => t.readyState === 'live' && !t.muted);
        const pc = this.peerConnection;
        if (!hasLiveVideoTrack || !pc || pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.log('[WebRTC] Partner video is ON. Proactively triggering negotiation / sync...');
          setTimeout(() => {
            if (this.isPeerVideoOn && !this.remoteStream.getVideoTracks().some((t) => t.readyState === 'live' && !t.muted)) {
              this.negotiate(userId || this.targetPeerId).catch(console.warn);
            }
          }, 800);
        }
      }
    });

    this.socket.on('ice-servers', ({ iceServers }) => {
      this.updateIceServers(iceServers);
    });

    this.socket.on('user-left', () => {
      this.isPeerMicOn = false;
      this.isPeerVideoOn = false;
      this.isPeerMusicOn = false;
      this.targetPeerId = null;
      this.onPeerMediaStatus({ isPeerMicOn: false, isPeerVideoOn: false, isPeerMusicOn: false });
      this.resetPeerConnection();
    });
  }

  refreshRemoteStream(forceNew = false) {
    // Sync directly with RTCPeerConnection receivers so no active track is ever missed
    if (this.peerConnection && this.peerConnection.getReceivers) {
      this.peerConnection.getReceivers().forEach((receiver) => {
        const track = receiver.track;
        if (track && track.readyState === 'live') {
          // Remove any stale track of the same kind with a different ID
          this.remoteStream.getTracks().forEach((existing) => {
            if (existing.kind === track.kind && existing.id !== track.id) {
              this.remoteStream.removeTrack(existing);
            }
          });
          if (!this.remoteStream.getTracks().some((t) => t.id === track.id)) {
            this.remoteStream.addTrack(track);
          }
        }
      });
    }

    const liveTracks = this.remoteStream.getTracks().filter((t) => t.readyState === 'live');
    const freshStream = new MediaStream(liveTracks.length > 0 ? liveTracks : this.remoteStream.getTracks());
    if (forceNew) {
      freshStream._forceTimestamp = Date.now();
    }
    this.onRemoteStreamUpdate(freshStream);
  }

  findVideoTransceiver() {
    if (!this.peerConnection || !this.peerConnection.getTransceivers) return null;
    return (
      this.peerConnection.getTransceivers().find(
        (t) =>
          t.receiver?.track?.kind === 'video' ||
          t.sender?.track?.kind === 'video' ||
          (this.videoSender && t.sender === this.videoSender)
      ) || null
    );
  }

  findAudioTransceiver() {
    if (!this.peerConnection || !this.peerConnection.getTransceivers) return null;
    return (
      this.peerConnection.getTransceivers().find(
        (t) =>
          t.receiver?.track?.kind === 'audio' ||
          t.sender?.track?.kind === 'audio' ||
          (this.audioSender && t.sender === this.audioSender)
      ) || null
    );
  }

  findVideoSender() {
    const vt = this.findVideoTransceiver();
    if (vt && vt.sender) {
      this.videoSender = vt.sender;
      return vt.sender;
    }
    if (!this.peerConnection) return null;
    const withTrack = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
    if (withTrack) {
      this.videoSender = withTrack;
      return withTrack;
    }
    return this.videoSender;
  }

  findAudioSender() {
    const at = this.findAudioTransceiver();
    if (at && at.sender) {
      this.audioSender = at.sender;
      return at.sender;
    }
    if (!this.peerConnection) return null;
    const withTrack = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'audio');
    if (withTrack) {
      this.audioSender = withTrack;
      return withTrack;
    }
    return this.audioSender;
  }

  getActiveAudioTrack() {
    const hasLiveMic = Boolean(this.isMicOn && this.micTrack && this.micTrack.readyState === 'live');
    const hasLiveMusic = Boolean(this.isMusicSharing && this.systemAudioTrack && this.systemAudioTrack.readyState === 'live');

    if (hasLiveMic && hasLiveMusic) {
      return this.mixedTrack || this.micTrack;
    }
    if (hasLiveMic) {
      return this.micTrack;
    }
    if (hasLiveMusic) {
      return this.systemAudioTrack;
    }
    return null;
  }

  syncLocalTracksToTransceivers() {
    if (!this.peerConnection) return;

    const audioTransceiver = this.findAudioTransceiver();
    const activeAudioTrack = this.getActiveAudioTrack();
    if (audioTransceiver) {
      audioTransceiver.direction = 'sendrecv';
      this.audioSender = audioTransceiver.sender;
      if (audioTransceiver.sender.track !== activeAudioTrack) {
        audioTransceiver.sender.replaceTrack(activeAudioTrack).catch((e) => {
          console.warn('[WebRTC] syncLocalTracks audio replaceTrack warning:', e);
        });
      }
    }

    const videoTransceiver = this.findVideoTransceiver();
    const activeScreenTrack = this.screenStream?.getVideoTracks().find((t) => t.readyState === 'live');
    const activeCamTrack = this.localStream.getVideoTracks().find((t) => t.readyState === 'live');
    const desiredVideoTrack = activeScreenTrack || activeCamTrack || null;

    if (videoTransceiver) {
      videoTransceiver.direction = 'sendrecv';
      this.videoSender = videoTransceiver.sender;
      if (desiredVideoTrack && videoTransceiver.sender.track !== desiredVideoTrack) {
        videoTransceiver.sender.replaceTrack(desiredVideoTrack).catch((e) => {
          console.warn('[WebRTC] syncLocalTracks video replaceTrack warning:', e);
        });
      }
    }
  }

  getOrCreatePeerConnection() {
    if (this.peerConnection && this.peerConnection.signalingState !== 'closed') {
      return this.peerConnection;
    }

    console.log('[WebRTC] Initializing new RTCPeerConnection with STUN & TURN relay');
    const pc = new RTCPeerConnection(this.rtcConfig || RTC_CONFIG);
    this.peerConnection = pc;

    // Pre-create exactly 1 audio and 1 video transceiver with 'sendrecv' direction and localStream association.
    // Do NOT also call pc.addTrack() here, which would create duplicate transceivers!
    if (pc.addTransceiver) {
      try {
        const hasAudio = pc.getTransceivers().some((t) => t.receiver?.track?.kind === 'audio');
        if (!hasAudio) {
          const activeTrack = this.getActiveAudioTrack();
          const at = activeTrack
            ? pc.addTransceiver(activeTrack, { direction: 'sendrecv', streams: [this.localStream] })
            : pc.addTransceiver('audio', { direction: 'sendrecv', streams: [this.localStream] });
          this.audioSender = at.sender;
        }
      } catch (e) {
        console.warn('[WebRTC] Error adding audio transceiver:', e);
      }

      try {
        const hasVideo = pc.getTransceivers().some((t) => t.receiver?.track?.kind === 'video');
        if (!hasVideo) {
          const vt = pc.addTransceiver('video', { direction: 'sendrecv', streams: [this.localStream] });
          this.preferCodecs(vt);
          this.videoSender = vt.sender;
        }
      } catch (e) {
        console.warn('[WebRTC] Error adding video transceiver:', e);
      }
    }

    // Attach any already-active local tracks to the transceiver senders
    this.syncLocalTracksToTransceivers();

    // Handle remote tracks (audio, webcam, and screen share)
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track?.kind, event.track?.id);
      const incomingTrack = event.track;
      if (!incomingTrack) return;

      // Ultra-low-latency real-time video playout (0s minimum buffer hint - eliminates 100ms artificial video lag)
      if (event.receiver && 'playoutDelayHint' in event.receiver) {
        try {
          event.receiver.playoutDelayHint = 0;
        } catch {}
      }

      // Clean out any stale or ended tracks of the same kind to prevent video freeze
      this.remoteStream.getTracks().forEach((existingTrack) => {
        if (
          existingTrack.kind === incomingTrack.kind &&
          (existingTrack.readyState === 'ended' || existingTrack.id !== incomingTrack.id)
        ) {
          console.log('[WebRTC] Removing stale/replaced remote track:', existingTrack.id);
          this.remoteStream.removeTrack(existingTrack);
        }
      });

      if (!this.remoteStream.getTracks().some((t) => t.id === incomingTrack.id)) {
        this.remoteStream.addTrack(incomingTrack);
      }

      if (incomingTrack.kind === 'video') {
        this.isPeerVideoOn = true;
      }
      this.onPeerMediaStatus({
        isPeerMicOn: this.isPeerMicOn,
        isPeerVideoOn: this.isPeerVideoOn,
        isPeerMusicOn: this.isPeerMusicOn,
      });

      incomingTrack.onended = () => {
        console.log('[WebRTC] Remote track ended:', incomingTrack.id);
        this.remoteStream.removeTrack(incomingTrack);
        if (incomingTrack.kind === 'video') {
          const hasLiveVideo = this.remoteStream.getVideoTracks().some((t) => t.readyState === 'live');
          if (!hasLiveVideo) {
            this.isPeerVideoOn = false;
          }
        } else if (incomingTrack.kind === 'audio') {
          const hasLiveAudio = this.remoteStream.getAudioTracks().some((t) => t.readyState === 'live');
          if (!hasLiveAudio) {
            this.isPeerMicOn = false;
          }
        }
        this.onPeerMediaStatus({
          isPeerMicOn: this.isPeerMicOn,
          isPeerVideoOn: this.isPeerVideoOn,
          isPeerMusicOn: this.isPeerMusicOn,
        });
        this.refreshRemoteStream();
      };

      incomingTrack.onmute = () => {
        console.log('[WebRTC] Remote track muted (packets temporarily delayed):', incomingTrack.kind, incomingTrack.id);
        this.refreshRemoteStream();
      };

      incomingTrack.onunmute = () => {
        console.log('[WebRTC] Remote track unmuted (live media packets arriving):', incomingTrack.kind, incomingTrack.id);
        if (incomingTrack.kind === 'video') {
          this.isPeerVideoOn = true;
        } else if (incomingTrack.kind === 'audio') {
          this.isPeerMicOn = true;
        }
        this.onPeerMediaStatus({
          isPeerMicOn: this.isPeerMicOn,
          isPeerVideoOn: this.isPeerVideoOn,
          isPeerMusicOn: this.isPeerMusicOn,
        });
        this.refreshRemoteStream(true);
      };

      this.refreshRemoteStream();
    };

    // Send ICE candidates to partner
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('signal-ice', {
          candidate: event.candidate,
          targetUserId: this.targetPeerId,
        });
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] Signaling state:', pc.signalingState);
      if (pc.signalingState === 'stable' && this.pendingNegotiation) {
        this.pendingNegotiation = false;
        this.negotiate(this.targetPeerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection state:', pc.iceConnectionState);
      this.emitDiag('iceconnectionstatechange', { state: pc.iceConnectionState });
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        if (this.disconnectTimer) {
          clearTimeout(this.disconnectTimer);
          this.disconnectTimer = null;
        }
        this.refreshRemoteStream();
        this.logActiveConnectionRoute();
      } else if (pc.iceConnectionState === 'disconnected') {
        console.warn('[WebRTC] ICE connection temporarily disconnected, monitoring for recovery...');
        if (!this.disconnectTimer) {
          // Allow up to 12s for natural Wi-Fi recovery before triggering ICE restart.
          // (2.5s was way too aggressive and caused constant 5-6 second stream freezes during minor Wi-Fi jitter)
          this.disconnectTimer = setTimeout(() => {
            if (this.peerConnection?.iceConnectionState === 'disconnected') {
              console.warn('[WebRTC] ICE still disconnected after 12s, triggering ICE restart to unfreeze stream...');
              this.restartIce();
            }
          }, 12000);
        }
      } else if (pc.iceConnectionState === 'failed') {
        if (this.disconnectTimer) {
          clearTimeout(this.disconnectTimer);
          this.disconnectTimer = null;
        }
        console.warn('[WebRTC] ICE connection failed, restarting ICE...');
        this.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] PeerConnection state:', pc.connectionState);
      this.emitDiag('connectionstatechange', { state: pc.connectionState });
      if (pc.connectionState === 'connected') {
        this.refreshRemoteStream();
        this.broadcastMediaStatus();
        this.logActiveConnectionRoute();
      } else if (pc.connectionState === 'failed') {
        console.warn('[WebRTC] PeerConnection failed, restarting ICE...');
        this.restartIce();
      }
    };

    return pc;
  }

  async logActiveConnectionRoute() {
    if (!this.peerConnection?.getStats) return;
    try {
      const stats = await this.peerConnection.getStats();
      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const localCand = stats.get(report.localCandidateId);
          const remoteCand = stats.get(report.remoteCandidateId);
          const rtt = report.currentRoundTripTime ? `${Math.round(report.currentRoundTripTime * 1000)}ms` : 'unknown';
          const isRelayed = localCand?.candidateType === 'relay' || remoteCand?.candidateType === 'relay';
          console.log(
            `[WebRTC ⚡] Connected Route: ${isRelayed ? '🌐 Relayed (TURN Server)' : '⚡ Direct P2P (Zero Relay)'} | ` +
            `Pair: [${localCand?.candidateType || '?'} <-> ${remoteCand?.candidateType || '?'}] | ` +
            `Latency / RTT: ${rtt}`
          );
        }
      });
    } catch {}
  }

  async restartIce() {
    if (!this.peerConnection || this.peerConnection.signalingState === 'closed') return;
    const now = Date.now();
    if (this.lastIceRestart && now - this.lastIceRestart < 4000) {
      console.log(`[WebRTC] Debouncing rapid ICE restart (${now - this.lastIceRestart}ms elapsed)`);
      return;
    }
    this.lastIceRestart = now;
    try {
      console.log('[WebRTC] 🔄 Restarting ICE with fresh TURN relay credentials...');
      const freshServers = await this.fetchFreshIceServers();
      if (freshServers && freshServers.length > 0) {
        this.updateIceServers(freshServers);
      }
      if (this.peerConnection.restartIce) {
        this.peerConnection.restartIce();
      }
      await this.negotiate(this.targetPeerId, { iceRestart: true });
    } catch (err) {
      console.warn('[WebRTC] Error during ICE restart:', err);
    }
  }

  async handleRemoteOffer(offer, senderId) {
    if (!offer || offer.type !== 'offer') {
      console.warn('[WebRTC] Ignoring invalid remote offer:', offer);
      return;
    }
    if (senderId) {
      this.targetPeerId = senderId;
    }
    const pc = this.getOrCreatePeerConnection();
    const isPolite = this.socket?.id && senderId ? this.socket.id < senderId : true;

    try {
      const offerCollision = this.isMakingOffer || pc.signalingState !== 'stable';
      if (offerCollision) {
        console.log('[WebRTC] Offer collision detected (state:', pc.signalingState, 'isPolite:', isPolite, ')');
        if (!isPolite) {
          console.log('[WebRTC] Impolite peer ignoring colliding remote offer to allow local offer to complete');
          return;
        }
        if (pc.signalingState === 'have-local-offer') {
          console.log('[WebRTC] Polite peer rolling back dangling local offer to accept incoming remote offer');
          try {
            await pc.setLocalDescription({ type: 'rollback' });
          } catch (e) {
            console.warn('[WebRTC] Rollback error:', e);
          }
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Ensure our transceivers remain 'sendrecv' and our active local tracks are attached before creating answer
      this.syncLocalTracksToTransceivers();

      // Drain queued ICE candidates
      while (this.iceCandidateQueue.length > 0) {
        const candidate = this.iceCandidateQueue.shift();
        try {
          if (candidate && candidate.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (e) {
          console.warn('[WebRTC] Failed to add queued ICE:', e);
        }
      }

      if (pc.signalingState !== 'have-remote-offer') {
        console.warn('[WebRTC] Signaling state is not have-remote-offer, skipping answer. Current state:', pc.signalingState);
        return;
      }

      const answer = await pc.createAnswer();
      const mungedAnswer = {
        type: answer.type,
        sdp: optimizeSdp(answer.sdp),
      };
      await pc.setLocalDescription(mungedAnswer);

      if (this.socket) {
        this.socket.emit('signal-answer', {
          targetUserId: senderId || this.targetPeerId,
          answer: mungedAnswer,
        });
      }

      this.broadcastMediaStatus();
      this.refreshRemoteStream();
    } catch (err) {
      console.error('[WebRTC] Error in handleRemoteOffer:', err);
    }
  }

  async handleRemoteAnswer(answer) {
    if (!this.peerConnection || !answer) return;
    if (this.peerConnection.signalingState === 'have-local-offer') {
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

        // Drain queued ICE candidates
        while (this.iceCandidateQueue.length > 0) {
          const candidate = this.iceCandidateQueue.shift();
          try {
            if (candidate && candidate.candidate) {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch (e) {
            console.warn('[WebRTC] Failed to add queued ICE:', e);
          }
        }

        this.refreshRemoteStream();

        if (this.pendingNegotiation && this.peerConnection.signalingState === 'stable') {
          this.pendingNegotiation = false;
          await this.negotiate(this.targetPeerId);
        }
      } catch (err) {
        console.error('[WebRTC] Error in handleRemoteAnswer:', err);
      }
    } else {
      console.warn('[WebRTC] Skipping remote answer in signalingState:', this.peerConnection.signalingState);
    }
  }

  async handleRemoteIceCandidate(candidate) {
    if (!candidate || !candidate.candidate) return;
    if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[WebRTC] Error adding ICE candidate:', err);
      }
    } else {
      this.iceCandidateQueue.push(candidate);
    }
  }

  async negotiate(targetUserId, options = {}) {
    const pc = this.getOrCreatePeerConnection();
    if (targetUserId) {
      this.targetPeerId = targetUserId;
    }

    const destId = targetUserId || this.targetPeerId || null;

    if (this.isMakingOffer || pc.signalingState !== 'stable') {
      console.log('[WebRTC] Queuing pending negotiation (isMakingOffer:', this.isMakingOffer, 'state:', pc.signalingState, ')');
      this.pendingNegotiation = true;
      return;
    }

    try {
      this.isMakingOffer = true;
      this.syncLocalTracksToTransceivers();

      const offer = await pc.createOffer(options);
      if (pc.signalingState !== 'stable') {
        this.pendingNegotiation = true;
        return;
      }
      const mungedOffer = {
        type: offer.type,
        sdp: optimizeSdp(offer.sdp),
      };
      await pc.setLocalDescription(mungedOffer);

      if (this.socket) {
        const payload = { offer: mungedOffer };
        if (destId) {
          payload.targetUserId = destId;
        }
        this.socket.emit('signal-offer', payload);
      }
    } catch (err) {
      console.error('[WebRTC] Error creating offer:', err);
    } finally {
      this.isMakingOffer = false;
      if (this.pendingNegotiation && this.peerConnection?.signalingState === 'stable') {
        this.pendingNegotiation = false;
        setTimeout(() => this.negotiate(this.targetPeerId), 50);
      }
    }
  }

  // Check if getUserMedia is supported in current context
  checkMediaSupport() {
    if (typeof window === 'undefined') return { supported: false, error: 'No window' };

    if (!window.navigator?.mediaDevices?.getUserMedia) {
      const isSecure = window.isSecureContext;
      if (!isSecure && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return {
          supported: false,
          error: 'INSECURE_CONTEXT',
          message: 'Browser blocks camera & microphone on plain HTTP across Wi-Fi. Please open the secure HTTPS URL to enable video and voice call!',
        };
      }
      return {
        supported: false,
        error: 'NO_MEDIA_DEVICES',
        message: 'Camera and microphone APIs are not available in this browser environment.',
      };
    }

    return { supported: true };
  }

  // Web Audio Context for simultaneously mixing Microphone + YouTube Music/System Audio
  getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          this.audioContext = new AudioCtx({ latencyHint: 'interactive', sampleRate: 48000 });
        } catch (e) {
          console.warn('[WebRTC] AudioContext creation fallback:', e);
        }
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  // Live Web Audio pipeline mixing voice + music dynamically
  async updateAudioPipeline() {
    const pc = this.getOrCreatePeerConnection();

    const hasLiveMic = Boolean(this.isMicOn && this.micTrack && this.micTrack.readyState === 'live');
    const hasLiveMusic = Boolean(this.isMusicSharing && this.systemAudioTrack && this.systemAudioTrack.readyState === 'live');

    let activeTrackToSend = null;

    if (hasLiveMic && hasLiveMusic) {
      // Both Voice and Music active: route both through Web Audio mixer
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          try { await ctx.resume(); } catch {}
        }
        if (!this.audioDestination) {
          this.audioDestination = ctx.createMediaStreamDestination();
          this.mixedTrack = this.audioDestination.stream.getAudioTracks()[0];
        }

        // Microphone source in audio graph
        if (!this.micSourceNode || this.currentMicTrackId !== this.micTrack.id) {
          if (this.micSourceNode) {
            try { this.micSourceNode.disconnect(); } catch {}
          }
          this.currentMicTrackId = this.micTrack.id;
          this.micSourceNode = ctx.createMediaStreamSource(new MediaStream([this.micTrack]));
          this.micGainNode = ctx.createGain();
          this.micGainNode.gain.setValueAtTime(this.micVolume ?? 1.0, ctx.currentTime);
          this.micSourceNode.connect(this.micGainNode);
          this.micGainNode.connect(this.audioDestination);
        } else if (this.micGainNode) {
          this.micGainNode.gain.setValueAtTime(this.micVolume ?? 1.0, ctx.currentTime);
        }

        // Music / System Audio source in audio graph
        if (!this.musicSourceNode || this.currentMusicTrackId !== this.systemAudioTrack.id) {
          if (this.musicSourceNode) {
            try { this.musicSourceNode.disconnect(); } catch {}
          }
          this.currentMusicTrackId = this.systemAudioTrack.id;
          this.musicSourceNode = ctx.createMediaStreamSource(new MediaStream([this.systemAudioTrack]));
          this.musicGainNode = ctx.createGain();
          this.musicGainNode.gain.setValueAtTime(this.musicVolume ?? 0.85, ctx.currentTime);
          this.musicSourceNode.connect(this.musicGainNode);
          this.musicGainNode.connect(this.audioDestination);
        } else if (this.musicGainNode) {
          this.musicGainNode.gain.setValueAtTime(this.musicVolume ?? 0.85, ctx.currentTime);
        }

        if (this.mixedTrack) {
          this.mixedTrack.enabled = true;
          activeTrackToSend = this.mixedTrack;
        }
      }
    } else if (hasLiveMic) {
      // ONLY Microphone active: bypass Web Audio API completely!
      // Send raw micTrack directly so browser gives full hardware AEC, noise suppression, AGC, and zero distortion!
      activeTrackToSend = this.micTrack;
      if (this.musicSourceNode) {
        try { this.musicSourceNode.disconnect(); } catch {}
        this.musicSourceNode = null;
      }
      this.currentMusicTrackId = null;
    } else if (hasLiveMusic) {
      // ONLY Music active: send pristine systemAudioTrack directly
      activeTrackToSend = this.systemAudioTrack;
      if (this.micSourceNode) {
        try { this.micSourceNode.disconnect(); } catch {}
        this.micSourceNode = null;
      }
      this.currentMicTrackId = null;
    } else {
      activeTrackToSend = null;
      if (this.micSourceNode) {
        try { this.micSourceNode.disconnect(); } catch {}
        this.micSourceNode = null;
      }
      if (this.musicSourceNode) {
        try { this.musicSourceNode.disconnect(); } catch {}
        this.musicSourceNode = null;
      }
      this.currentMicTrackId = null;
      this.currentMusicTrackId = null;
    }

    const audioTransceiver = this.findAudioTransceiver();
    if (audioTransceiver) {
      audioTransceiver.direction = 'sendrecv';
      if (audioTransceiver.sender.track !== activeTrackToSend) {
        console.log('[WebRTC] Updating audio sender track:', activeTrackToSend ? (hasLiveMusic && hasLiveMic ? '🎵 Mixed (Mic + Music)' : (hasLiveMusic ? '🎶 Music Only' : '🎙️ Mic Only')) : '🔇 Muted');
        await audioTransceiver.sender.replaceTrack(activeTrackToSend);
      }
      this.audioSender = audioTransceiver.sender;
    } else if (activeTrackToSend) {
      console.log('[WebRTC] Creating audio transceiver with active track');
      const at = pc.addTransceiver(activeTrackToSend, {
        direction: 'sendrecv',
        streams: [this.localStream],
      });
      this.audioSender = at.sender;
    }

    // Configure Opus stereo encodings for crystal clear YouTube Music playback
    if (this.audioSender?.getParameters && this.audioSender?.setParameters) {
      try {
        const params = this.audioSender.getParameters();
        if (params && params.encodings && params.encodings.length > 0) {
          params.encodings[0].maxBitrate = hasLiveMusic ? 128000 : 64000;
          params.encodings[0].networkPriority = 'high';
          params.encodings[0].priority = 'high';
          await this.audioSender.setParameters(params);
        }
      } catch (e) {}
    }
  }

  // Dedicated YouTube Music & System Audio sharing
  async startAudioShare(existingStream = null) {
    try {
      let stream = existingStream;
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: 'never',
              width: { ideal: 640, max: 640 },
              height: { ideal: 360, max: 360 },
              frameRate: { ideal: 5, max: 5 },
            },
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 2,
              sampleRate: 48000,
            },
          });
        } catch (err) {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
        }
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        stream.getTracks().forEach((t) => t.stop());
        const err = new Error('NO_AUDIO_TRACK');
        err.name = 'NoAudioTrackError';
        throw err;
      }

      this.musicStream = stream;
      this.systemAudioTrack = audioTrack;
      this.isMusicSharing = true;

      audioTrack.onended = () => {
        console.log('[WebRTC] Music audio track ended');
        this.stopAudioShare();
      };

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (this.isMusicSharing && this.musicStream === stream) {
            this.stopAudioShare();
          }
        };
      }

      await this.updateAudioPipeline();
      this.broadcastMediaStatus();
      if (this.targetPeerId) {
        await this.negotiate(this.targetPeerId);
      }

      if (this.onMusicStatusChange) {
        this.onMusicStatusChange({ isSharing: true, hasTrack: true });
      }
      return true;
    } catch (err) {
      console.warn('[WebRTC] startAudioShare error:', err);
      throw err;
    }
  }

  stopAudioShare() {
    if (this.musicStream) {
      this.musicStream.getTracks().forEach((t) => t.stop());
      this.musicStream = null;
    }
    this.systemAudioTrack = null;
    this.isMusicSharing = false;
    if (this.musicSourceNode) {
      try { this.musicSourceNode.disconnect(); } catch {}
      this.musicSourceNode = null;
    }
    this.currentMusicTrackId = null;

    this.updateAudioPipeline();
    this.broadcastMediaStatus();

    if (this.onMusicStatusChange) {
      this.onMusicStatusChange({ isSharing: false, hasTrack: false });
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(2, volume));
    if (this.musicGainNode && this.audioContext) {
      this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
    }
  }

  setMicVolume(volume) {
    this.micVolume = Math.max(0, Math.min(2, volume));
    if (this.micGainNode && this.audioContext) {
      this.micGainNode.gain.setValueAtTime(this.micVolume, this.audioContext.currentTime);
    }
  }

  // Toggle Microphone Audio
  async toggleMic() {
    const support = this.checkMediaSupport();
    if (!support.supported) {
      this.onError(support.message);
      throw new Error(support.message);
    }

    if (!this.isMicOn) {
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        const newAudioTrack = stream.getAudioTracks()[0];
        if (!newAudioTrack) throw new Error('No audio track returned');
        newAudioTrack.enabled = true;

        // Remove old audio track if any
        this.localStream.getAudioTracks().forEach((t) => {
          t.stop();
          this.localStream.removeTrack(t);
        });

        this.localStream.addTrack(newAudioTrack);
        this.micTrack = newAudioTrack;
        this.isMicOn = true;

        newAudioTrack.onended = () => {
          if (this.isMicOn && this.micTrack === newAudioTrack) {
            this.toggleMic().catch(() => {});
          }
        };

        await this.updateAudioPipeline();
        this.broadcastMediaStatus();
        if (this.targetPeerId) {
          await this.negotiate(this.targetPeerId);
        }
        return { isMicOn: true, stream: this.localStream };
      } catch (err) {
        this.handleMediaError(err, 'microphone');
        throw err;
      }
    } else {
      // Turn off microphone
      this.localStream.getAudioTracks().forEach((t) => {
        t.stop();
        this.localStream.removeTrack(t);
      });
      if (this.micTrack) {
        this.micTrack.stop();
        this.micTrack = null;
      }
      if (this.micSourceNode) {
        try { this.micSourceNode.disconnect(); } catch {}
        this.micSourceNode = null;
      }
      this.currentMicTrackId = null;

      this.isMicOn = false;
      await this.updateAudioPipeline();
      this.broadcastMediaStatus();
      return { isMicOn: false, stream: this.localStream };
    }
  }

  // Toggle Camera Video
  async toggleVideo() {
    const support = this.checkMediaSupport();
    if (!support.supported) {
      this.onError(support.message);
      throw new Error(support.message);
    }

    if (!this.isVideoOn) {
      try {
        let stream = null;
        let lastError = null;

        // 1. Enumerate available video inputs to discover hardware & virtual webcams (OBS, CamStudio, etc.)
        let videoDevices = [];
        try {
          if (navigator.mediaDevices?.enumerateDevices) {
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
            console.log(
              `[WebRTC] Detected ${videoDevices.length} video input device(s):`,
              videoDevices.map((d) => ({ id: d.deviceId, label: d.label || '(Unnamed Camera)' }))
            );
          }
        } catch (e) {
          console.warn('[WebRTC] enumerateDevices notice:', e);
        }

        // 2. Primary attempt: standard dimensions with graceful fallback across all camera hardware
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 25, max: 30 },
            },
          });
        } catch (e1) {
          console.warn('[WebRTC] Primary getUserMedia failed:', e1);
          lastError = e1;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 25 },
              },
            });
          } catch (e2) {
            console.warn('[WebRTC] Secondary getUserMedia failed:', e2);
            lastError = e2;
            try {
              stream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (e3) {
              lastError = e3;
            }
          }
        }

        // 3. Fallback attempt: Iterate through each detected video device explicitly
        if (!stream && videoDevices.length > 0) {
          for (const dev of videoDevices) {
            if (!dev.deviceId) continue;
            try {
              console.log(`[WebRTC] Trying specific video device: "${dev.label || dev.deviceId}"`);
              stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  deviceId: { exact: dev.deviceId },
                  frameRate: { ideal: 25 },
                },
              });
              if (stream) {
                console.log(`[WebRTC] Successfully opened video device: "${dev.label || dev.deviceId}"`);
                break;
              }
            } catch (devErr) {
              console.warn(`[WebRTC] Failed to open device "${dev.label || dev.deviceId}":`, devErr);
              lastError = devErr;
            }
          }
        }

        if (!stream) {
          throw (
            lastError ||
            new Error('No camera stream could be acquired from any available device')
          );
        }

        const newVideoTrack = stream.getVideoTracks()[0];
        if (!newVideoTrack) throw new Error('No video track returned');

        // Remove old video track if any
        this.localStream.getVideoTracks().forEach((t) => {
          t.stop();
          this.localStream.removeTrack(t);
        });

        this.localStream.addTrack(newVideoTrack);
        this.isVideoOn = true;

        const pc = this.getOrCreatePeerConnection();
        const videoTransceiver = this.findVideoTransceiver();

        if (videoTransceiver) {
          console.log('[WebRTC] Attaching video track to transceiver sender');
          videoTransceiver.direction = 'sendrecv';
          this.preferCodecs(videoTransceiver);
          await videoTransceiver.sender.replaceTrack(newVideoTrack);
          this.videoSender = videoTransceiver.sender;
        } else {
          console.log('[WebRTC] Creating video transceiver with track');
          const vt = pc.addTransceiver(newVideoTrack, {
            direction: 'sendrecv',
            streams: [this.localStream],
          });
          this.preferCodecs(vt);
          this.videoSender = vt.sender;
        }

        if ('contentHint' in newVideoTrack) {
          newVideoTrack.contentHint = 'motion';
        }

        // Configure ultra-smooth low-latency balanced profile (500 kbps sweet spot eliminates Wi-Fi bufferbloat and frame drops)
        if (this.videoSender?.getParameters && this.videoSender?.setParameters) {
          try {
            const params = this.videoSender.getParameters();
            if (params && params.encodings && params.encodings.length > 0) {
              params.encodings[0].maxBitrate = 450000; // 450 kbps optimal sweet spot for 640x480 (zero bufferbloat & zero lag)
              params.encodings[0].maxFramerate = 25;
              params.encodings[0].networkPriority = 'high';
              params.encodings[0].priority = 'high';
              params.degradationPreference = 'balanced';
              await this.videoSender.setParameters(params);
              console.log('[WebRTC] Enforced balanced degradation, 25fps cap & 450kbps bitrate for zero-lag video');
            }
          } catch (paramErr) {
            console.warn('[WebRTC] Note on camera parameters:', paramErr);
          }
        }

        // Dispatch instantaneous keyframe so peer's decoder begins playing immediately
        if (typeof this.videoSender?.generateKeyFrame === 'function') {
          try {
            await this.videoSender.generateKeyFrame();
            console.log('[WebRTC] 🔑 Dispatched instantaneous keyframe upon starting camera');
          } catch {}
        }

        // Enable 5-minute background throttle immunity, periodic keyframe generator & health check
        this.enableBackgroundImmunity();
        this.startPeriodicKeyframeSender();
        this.startStreamHealthMonitor();

        this.broadcastMediaStatus();
        await this.negotiate(this.targetPeerId);
        return { isVideoOn: true, stream: this.localStream };
      } catch (err) {
        this.handleMediaError(err, 'camera');
        throw err;
      }
    } else {
      // Turn off video
      this.localStream.getVideoTracks().forEach((t) => {
        t.stop();
        this.localStream.removeTrack(t);
      });

      const videoSender = this.findVideoSender();
      if (videoSender) {
        try {
          console.log('[WebRTC] Setting video sender to null (cam off)');
          await videoSender.replaceTrack(null);
        } catch (e) {
          console.warn('[WebRTC] Error clearing video track:', e);
        }
      }

      this.isVideoOn = false;
      if (!this.screenStream) {
        this.stopPeriodicKeyframeSender();
      }
      if (!this.screenStream && !this.isMicOn && !this.isMusicSharing) {
        this.disableBackgroundImmunity();
      }
      this.broadcastMediaStatus();
      return { isVideoOn: false, stream: this.localStream };
    }
  }

  // Start Screen Sharing via WebRTC
  async startScreenShare(displayStream) {
    this.screenStream = displayStream;
    const screenTrack = displayStream.getVideoTracks()[0];
    if (!screenTrack) throw new Error('No video track available in screen stream');

    try {
      if ('contentHint' in screenTrack) {
        screenTrack.contentHint = 'detail';
      }
    } catch {}

    const pc = this.getOrCreatePeerConnection();
    const videoTransceiver = this.findVideoTransceiver();

    if (videoTransceiver) {
      console.log('[WebRTC] Replacing video sender track with screen share track');
      videoTransceiver.direction = 'sendrecv';
      this.preferCodecs(videoTransceiver);
      await videoTransceiver.sender.replaceTrack(screenTrack);
      this.videoSender = videoTransceiver.sender;
    } else {
      console.log('[WebRTC] Adding screen share track to PeerConnection');
      const vt = pc.addTransceiver(screenTrack, {
        direction: 'sendrecv',
        streams: [this.localStream],
      });
      this.preferCodecs(vt);
      this.videoSender = vt.sender;
    }

    // Configure ultra-low-latency high-priority video encodings
    if (this.videoSender?.getParameters && this.videoSender?.setParameters) {
      try {
        const params = this.videoSender.getParameters();
        if (params && params.encodings && params.encodings.length > 0) {
          params.encodings[0].maxBitrate = 1500000; // 1.5 Mbps optimal for crystal-clear 1080p desktop with zero Wi-Fi bufferbloat
          params.encodings[0].maxFramerate = 24; // 24 fps is cinema-smooth for desktop
          params.encodings[0].networkPriority = 'high';
          params.encodings[0].priority = 'high';
          params.degradationPreference = 'maintain-resolution';
          await this.videoSender.setParameters(params);
          console.log('[WebRTC] Applied low-latency 1.5Mbps maintain-resolution profile to screen share');
        }
      } catch (paramErr) {
        console.warn('[WebRTC] Note on screen share setParameters:', paramErr);
      }
    }

    this.enableBackgroundImmunity();
    this.startPeriodicKeyframeSender();
    this.startStreamHealthMonitor();

    // If the display stream contains an audio track (e.g. user selected Chrome Tab with "Share tab audio")
    const displayAudioTrack = displayStream.getAudioTracks()[0];
    if (displayAudioTrack) {
      console.log('[WebRTC] System/Tab audio track detected in screen stream! Routing through audio pipeline...');
      this.systemAudioTrack = displayAudioTrack;
      this.isMusicSharing = true;

      displayAudioTrack.onended = () => {
        console.log('[WebRTC] Screen share audio track ended');
        if (this.systemAudioTrack === displayAudioTrack) {
          this.systemAudioTrack = null;
          this.isMusicSharing = false;
          this.updateAudioPipeline();
          this.broadcastMediaStatus();
          if (this.onMusicStatusChange) {
            this.onMusicStatusChange({ isSharing: false, hasTrack: false });
          }
        }
      };

      await this.updateAudioPipeline();
      this.broadcastMediaStatus();
      if (this.onMusicStatusChange) {
        this.onMusicStatusChange({ isSharing: true, hasTrack: true });
      }
    }

    await this.negotiate(this.targetPeerId);

    // Handle when user stops sharing via OS or browser floating toolbar
    screenTrack.onended = () => {
      this.stopScreenShare();
    };

    if (this.socket) {
      this.socket.emit('screen-share-status', { isSharing: true });
    }
  }

  // Stop Screen Sharing via WebRTC
  async stopScreenShare() {
    if (this.systemAudioTrack && this.screenStream?.getAudioTracks()?.includes(this.systemAudioTrack)) {
      this.systemAudioTrack = null;
      this.isMusicSharing = false;
      await this.updateAudioPipeline();
      this.broadcastMediaStatus();
      if (this.onMusicStatusChange) {
        this.onMusicStatusChange({ isSharing: false, hasTrack: false });
      }
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }

    const videoSender = this.findVideoSender();
    if (videoSender) {
      // If webcam was active before screen share, restore camera track
      const camTrack = this.localStream.getVideoTracks().find((t) => t.readyState === 'live');
      if (this.isVideoOn && camTrack) {
        console.log('[WebRTC] Restoring camera track after screen share');
        await videoSender.replaceTrack(camTrack);
      } else {
        try {
          await videoSender.replaceTrack(null);
        } catch {}
      }
      await this.negotiate(this.targetPeerId);
    }

    if (this.socket) {
      this.socket.emit('screen-share-status', { isSharing: false });
    }

    if (!this.isVideoOn) {
      this.stopPeriodicKeyframeSender();
      if (!this.isMicOn && !this.isMusicSharing) {
        this.disableBackgroundImmunity();
      }
    }
  }

  broadcastMediaStatus() {
    if (this.socket) {
      this.socket.emit('media-status-change', {
        isMicOn: this.isMicOn,
        isVideoOn: this.isVideoOn,
        isMusicOn: this.isMusicSharing,
      });
    }
  }

  handleMediaError(err, deviceName) {
    console.error(`[WebRTC] Error accessing ${deviceName}:`, err);
    let msg = `Unable to access ${deviceName}.`;

    const isMic = deviceName === 'microphone';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      msg = isMic
        ? `🔒 Microphone Access Denied: Please allow Microphone access in your Windows/Linux Settings > Privacy > Microphone (turn ON "Let apps / browser access your microphone") or click the padlock / tune icon in your browser address bar to Allow.`
        : `🔒 Camera Access Denied: Please allow Camera access in Windows/Linux Settings > Privacy > Camera or click the padlock icon in your browser address bar to Allow.`;
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      msg = isMic
        ? `⚠️ No microphone detected. Please connect a microphone or headset and retry.`
        : `⚠️ No camera detected by your OS. If using CamStudio: CamStudio's driver is 32-bit legacy and cannot be seen by 64-bit apps. We recommend OBS Studio ('Start Virtual Camera'). Also ensure Google Meet/Zoom isn't locking it!`;
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      msg = isMic
        ? `⚠️ Your microphone is currently busy or locked by another app (Google Meet, Zoom, Discord, Teams). Please close other audio apps and retry.`
        : `⚠️ Your camera or virtual camera is currently busy or locked by another app (Google Meet, Zoom, Discord). Please close other video apps and retry.`;
    } else if (err.name === 'OverconstrainedError') {
      msg = `⚠️ Your ${deviceName} does not support the requested resolution or settings.`;
    }

    this.onError(msg);
  }

  resetPeerConnection() {
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch {}
      this.peerConnection = null;
    }
    this.videoSender = null;
    this.audioSender = null;
    this.pendingNegotiation = false;
    this.remoteStream = new MediaStream();
    this.onRemoteStreamUpdate(this.remoteStream);
  }

  destroy() {
    this.stopPeriodicKeyframeSender();
    this.stopStreamHealthMonitor();
    this.disableBackgroundImmunity();
    if (this.musicStream) {
      this.musicStream.getTracks().forEach((t) => t.stop());
      this.musicStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }
    this.localStream.getTracks().forEach((t) => t.stop());
    this.resetPeerConnection();
  }
}
