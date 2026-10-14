// WebRTC Peer-to-Peer Voice & Video Call Manager for Study Companion
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.nextcloud.com:443' },
  ],
};

// Guarantee Linux WebKitGTK / Chromium decodes video by prioritizing royalty-free VP8 in SDP
function preferVP8InSdp(sdp) {
  if (!sdp || typeof sdp !== 'string') return sdp;
  try {
    const lines = sdp.split('\r\n');
    const mVideoIdx = lines.findIndex((l) => l.startsWith('m=video '));
    if (mVideoIdx === -1) return sdp;

    let vp8Pt = null;
    for (const line of lines) {
      const match = line.match(/^a=rtpmap:(\d+)\s+VP8\/90000/i);
      if (match) {
        vp8Pt = match[1];
        break;
      }
    }

    if (vp8Pt) {
      const parts = lines[mVideoIdx].split(' ');
      const header = parts.slice(0, 3);
      const rest = parts.slice(3).filter((p) => p !== vp8Pt);
      lines[mVideoIdx] = [...header, vp8Pt, ...rest].join(' ');
      return lines.join('\r\n');
    }
  } catch (err) {
    console.warn('[WebRTC] SDP VP8 sort warning:', err);
  }
  return sdp;
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
    this.screenStream = null;
    this.videoSender = null;
    this.audioSender = null;

    this.targetPeerId = null;
    this.isInitiator = false;
    this.isMakingOffer = false;
    this.pendingNegotiation = false;
    this.lastIceRestart = 0;
    this.rtcConfig = { ...RTC_CONFIG };

    this.setupSocketListeners();
    this.fetchFallbackTurnCredentials();
  }

  async fetchFallbackTurnCredentials() {
    try {
      const res = await fetch('https://speed.cloudflare.com/turn-creds', {
        headers: { Referer: 'https://speed.cloudflare.com/' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.urls && data.username && data.credential) {
          this.updateIceServers([
            { urls: 'stun:stun.cloudflare.com:3478' },
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
              urls: data.urls,
              username: data.username,
              credential: data.credential,
            },
          ]);
        }
      }
    } catch {}
  }

  updateIceServers(servers) {
    if (!Array.isArray(servers) || servers.length === 0) return;
    const hasTurn = servers.some((s) => Array.isArray(s.urls) ? s.urls.some(u => u.startsWith('turn:')) : s.urls?.startsWith('turn:'));
    console.log(`[WebRTC] 🔄 Updating ICE servers (Total: ${servers.length}, TURN Relay Enabled: ${hasTurn})`);
    this.rtcConfig = { iceServers: servers };
    if (this.peerConnection && this.peerConnection.setConfiguration) {
      try {
        this.peerConnection.setConfiguration(this.rtcConfig);
        console.log('[WebRTC] Applied updated ICE servers to active peer connection');
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

  preferVP8(transceiver) {
    if (!transceiver || !transceiver.setCodecPreferences) return;
    try {
      if (typeof RTCRtpReceiver !== 'undefined' && RTCRtpReceiver.getCapabilities) {
        const caps = RTCRtpReceiver.getCapabilities('video');
        if (caps && caps.codecs) {
          const vp8Codecs = caps.codecs.filter((c) => c.mimeType && c.mimeType.toLowerCase() === 'video/vp8');
          const otherCodecs = caps.codecs.filter((c) => c.mimeType && c.mimeType.toLowerCase() !== 'video/vp8');
          if (vp8Codecs.length > 0) {
            transceiver.setCodecPreferences([...vp8Codecs, ...otherCodecs]);
            console.log('[WebRTC] Set video transceiver codec preferences to prefer VP8');
          }
        }
      }
    } catch (e) {
      console.warn('[WebRTC] Error setting VP8 codec preferences:', e);
    }
  }

  async initiateCallTo(targetUserId) {
    if (targetUserId) {
      this.targetPeerId = targetUserId;
    }
    console.log('[WebRTC] Initiating call to target user:', this.targetPeerId);
    this.isInitiator = true;
    const pc = this.getOrCreatePeerConnection();
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

    this.socket.on('peer-media-status', ({ userId, isMicOn, isVideoOn }) => {
      if (userId) this.targetPeerId = userId;
      this.isPeerMicOn = Boolean(isMicOn);
      this.isPeerVideoOn = Boolean(isVideoOn);
      this.onPeerMediaStatus({ isPeerMicOn: this.isPeerMicOn, isPeerVideoOn: this.isPeerVideoOn });
      // Refresh remote stream immediately and again after keyframe arrival
      this.refreshRemoteStream();
      if (this.isPeerVideoOn || this.isPeerMicOn) {
        setTimeout(() => this.refreshRemoteStream(), 250);
        setTimeout(() => this.refreshRemoteStream(), 700);
      }
    });

    this.socket.on('ice-servers', ({ iceServers }) => {
      this.updateIceServers(iceServers);
    });

    this.socket.on('user-left', () => {
      this.isPeerMicOn = false;
      this.isPeerVideoOn = false;
      this.targetPeerId = null;
      this.onPeerMediaStatus({ isPeerMicOn: false, isPeerVideoOn: false });
      this.resetPeerConnection();
    });
  }

  refreshRemoteStream() {
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

  syncLocalTracksToTransceivers() {
    if (!this.peerConnection) return;

    const audioTransceiver = this.findAudioTransceiver();
    const activeAudioTrack = this.localStream.getAudioTracks().find((t) => t.readyState === 'live');
    if (audioTransceiver) {
      audioTransceiver.direction = 'sendrecv';
      this.audioSender = audioTransceiver.sender;
      if (activeAudioTrack && audioTransceiver.sender.track !== activeAudioTrack) {
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

    // Pre-create exactly 1 audio and 1 video transceiver with 'sendrecv' direction.
    // Do NOT also call pc.addTrack() here, which would create duplicate transceivers!
    if (pc.addTransceiver) {
      try {
        const hasAudio = pc.getTransceivers().some((t) => t.receiver?.track?.kind === 'audio');
        if (!hasAudio) {
          const at = pc.addTransceiver('audio', { direction: 'sendrecv' });
          this.audioSender = at.sender;
        }
      } catch (e) {
        console.warn('[WebRTC] Error adding audio transceiver:', e);
      }

      try {
        const hasVideo = pc.getTransceivers().some((t) => t.receiver?.track?.kind === 'video');
        if (!hasVideo) {
          const vt = pc.addTransceiver('video', { direction: 'sendrecv' });
          this.preferVP8(vt);
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
        this.onPeerMediaStatus({ isPeerMicOn: this.isPeerMicOn, isPeerVideoOn: true });
      } else if (incomingTrack.kind === 'audio') {
        this.isPeerMicOn = true;
        this.onPeerMediaStatus({ isPeerMicOn: true, isPeerVideoOn: this.isPeerVideoOn });
      }

      incomingTrack.onended = () => {
        console.log('[WebRTC] Remote track ended:', incomingTrack.id);
        this.remoteStream.removeTrack(incomingTrack);
        if (incomingTrack.kind === 'video') {
          const hasLiveVideo = this.remoteStream.getVideoTracks().some((t) => t.readyState === 'live');
          if (!hasLiveVideo) {
            this.isPeerVideoOn = false;
            this.onPeerMediaStatus({ isPeerMicOn: this.isPeerMicOn, isPeerVideoOn: false });
          }
        }
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
          this.onPeerMediaStatus({ isPeerMicOn: this.isPeerMicOn, isPeerVideoOn: true });
        } else if (incomingTrack.kind === 'audio') {
          this.isPeerMicOn = true;
          this.onPeerMediaStatus({ isPeerMicOn: true, isPeerVideoOn: this.isPeerVideoOn });
        }
        this.refreshRemoteStream();
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
        this.refreshRemoteStream();
        this.logActiveConnectionRoute();
      } else if (pc.iceConnectionState === 'failed') {
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
      console.log('[WebRTC] 🔄 Restarting ICE with full TURN relay credentials...');
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
        if (pc.signalingState === 'have-local-offer') {
          console.log('[WebRTC] Rolling back dangling local offer to accept incoming remote offer');
          try {
            await pc.setLocalDescription({ type: 'rollback' });
          } catch (e) {
            console.warn('[WebRTC] Rollback error:', e);
          }
        } else if (!isPolite && pc.remoteDescription) {
          console.log('[WebRTC] Impolite peer ignoring colliding remote offer');
          return;
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
        sdp: preferVP8InSdp(answer.sdp),
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

    const destId = targetUserId || this.targetPeerId;
    if (!destId) {
      console.log('[WebRTC] Skipping negotiate: No target peer specified');
      return;
    }

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
        sdp: preferVP8InSdp(offer.sdp),
      };
      await pc.setLocalDescription(mungedOffer);

      if (this.socket) {
        const payload = { offer: mungedOffer };
        const destId = targetUserId || this.targetPeerId;
        if (destId) {
          payload.targetUserId = destId;
        }
        this.socket.emit('signal-offer', payload);
      }
    } catch (err) {
      console.error('[WebRTC] Error creating offer:', err);
    } finally {
      this.isMakingOffer = false;
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

  // Toggle Microphone
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

        // Remove old audio track if any
        this.localStream.getAudioTracks().forEach((t) => {
          t.stop();
          this.localStream.removeTrack(t);
        });

        this.localStream.addTrack(newAudioTrack);
        this.isMicOn = true;

        const pc = this.getOrCreatePeerConnection();
        const audioTransceiver = this.findAudioTransceiver();

        if (audioTransceiver) {
          console.log('[WebRTC] Attaching audio track to transceiver sender');
          audioTransceiver.direction = 'sendrecv';
          await audioTransceiver.sender.replaceTrack(newAudioTrack);
          this.audioSender = audioTransceiver.sender;
        } else {
          console.log('[WebRTC] Creating audio transceiver with track');
          const at = pc.addTransceiver(newAudioTrack, {
            direction: 'sendrecv',
            streams: [this.localStream],
          });
          this.audioSender = at.sender;
        }

        this.broadcastMediaStatus();
        await this.negotiate(this.targetPeerId);
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

      const audioSender = this.findAudioSender();
      if (audioSender) {
        try {
          console.log('[WebRTC] Setting audio sender to null (mic off)');
          await audioSender.replaceTrack(null);
        } catch (e) {
          console.warn('[WebRTC] Error clearing audio track:', e);
        }
      }

      this.isMicOn = false;
      this.broadcastMediaStatus();
      await this.negotiate(this.targetPeerId);
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

        // 2. Primary attempt: Relaxed resolution constraint without strict facingMode
        // Note: Virtual cameras (OBS, CamStudio, ManyCam) often reject 'facingMode' constraints!
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
          });
        } catch (e1) {
          console.warn('[WebRTC] Primary getUserMedia with ideal dimensions failed:', e1);
          lastError = e1;
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } catch (e2) {
            console.warn('[WebRTC] Secondary getUserMedia({ video: true }) failed:', e2);
            lastError = e2;
          }
        }

        // 3. Fallback attempt: Iterate through each detected video device explicitly
        if (!stream && videoDevices.length > 0) {
          for (const dev of videoDevices) {
            if (!dev.deviceId) continue;
            try {
              console.log(`[WebRTC] Trying specific video device: "${dev.label || dev.deviceId}"`);
              stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: dev.deviceId } },
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
          this.preferVP8(videoTransceiver);
          await videoTransceiver.sender.replaceTrack(newVideoTrack);
          this.videoSender = videoTransceiver.sender;
        } else {
          console.log('[WebRTC] Creating video transceiver with track');
          const vt = pc.addTransceiver(newVideoTrack, {
            direction: 'sendrecv',
            streams: [this.localStream],
          });
          this.preferVP8(vt);
          this.videoSender = vt.sender;
        }

        if ('contentHint' in newVideoTrack) {
          newVideoTrack.contentHint = 'motion';
        }

        // Configure smooth maintain-framerate profile (1.2 Mbps ceiling to prevent Wi-Fi freeze/stutter)
        if (this.videoSender?.getParameters && this.videoSender?.setParameters) {
          try {
            const params = this.videoSender.getParameters();
            if (params && params.encodings && params.encodings.length > 0) {
              params.encodings[0].maxBitrate = 1200000;
              params.encodings[0].networkPriority = 'high';
              params.encodings[0].priority = 'high';
              params.degradationPreference = 'maintain-framerate';
              await this.videoSender.setParameters(params);
              console.log('[WebRTC] Enforced maintain-framerate & 1.2Mbps cap for smooth camera video');
            }
          } catch (paramErr) {
            console.warn('[WebRTC] Note on camera parameters:', paramErr);
          }
        }

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
      this.broadcastMediaStatus();
      await this.negotiate(this.targetPeerId);
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
        screenTrack.contentHint = 'motion';
      }
    } catch {}

    const pc = this.getOrCreatePeerConnection();
    const videoTransceiver = this.findVideoTransceiver();

    if (videoTransceiver) {
      console.log('[WebRTC] Replacing video sender track with screen share track');
      videoTransceiver.direction = 'sendrecv';
      this.preferVP8(videoTransceiver);
      await videoTransceiver.sender.replaceTrack(screenTrack);
      this.videoSender = videoTransceiver.sender;
    } else {
      console.log('[WebRTC] Adding screen share track to PeerConnection');
      const vt = pc.addTransceiver(screenTrack, {
        direction: 'sendrecv',
        streams: [this.localStream],
      });
      this.preferVP8(vt);
      this.videoSender = vt.sender;
    }

    // Configure ultra-low-latency high-priority video encodings
    if (this.videoSender?.getParameters && this.videoSender?.setParameters) {
      try {
        const params = this.videoSender.getParameters();
        if (params && params.encodings && params.encodings.length > 0) {
          params.encodings[0].maxBitrate = 3500000;
          params.encodings[0].networkPriority = 'high';
          params.encodings[0].priority = 'high';
          params.degradationPreference = 'maintain-framerate';
          await this.videoSender.setParameters(params);
          console.log('[WebRTC] Applied low-latency 3.5Mbps maintain-framerate profile to screen share');
        }
      } catch (paramErr) {
        console.warn('[WebRTC] Note on screen share setParameters:', paramErr);
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
  }

  broadcastMediaStatus() {
    if (this.socket) {
      this.socket.emit('media-status-change', {
        isMicOn: this.isMicOn,
        isVideoOn: this.isVideoOn,
      });
    }
  }

  handleMediaError(err, deviceName) {
    console.error(`[WebRTC] Error accessing ${deviceName}:`, err);
    let msg = `Unable to access ${deviceName}.`;

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      msg = `🔒 Permission Denied: Please allow Camera access in Windows Settings > Privacy & Security > Camera (turn ON "Let desktop apps access your camera") or click 'Allow' in your browser.`;
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      msg = `⚠️ No camera detected by your OS. If using CamStudio: CamStudio's driver is 32-bit legacy and cannot be seen by 64-bit apps. We recommend OBS Studio ('Start Virtual Camera'). Also ensure Google Meet/Zoom isn't locking it!`;
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      msg = `⚠️ Your camera or virtual camera is currently busy or locked by another app (Google Meet, Zoom, Discord). Please close other video apps and retry.`;
    } else if (err.name === 'OverconstrainedError') {
      msg = `⚠️ Your camera does not support the requested resolution or settings. Try with standard resolution.`;
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
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
    this.localStream.getTracks().forEach((t) => t.stop());
    this.resetPeerConnection();
  }
}
