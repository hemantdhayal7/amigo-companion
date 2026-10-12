// WebRTC Peer-to-Peer Voice & Video Call Manager for Study Companion
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:80' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turns:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelay',
      credential: 'openrelay',
    },
  ],
  iceCandidatePoolSize: 10,
};

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

    this.isMakingOffer = false;

    this.setupSocketListeners();
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
        await this.handleRemoteAnswer(answer);
      } catch (err) {
        console.error('[WebRTC] Error handling remote answer:', err);
      }
    });

    this.socket.on('signal-ice', async ({ senderId, candidate }) => {
      try {
        await this.handleRemoteIceCandidate(candidate);
      } catch (err) {
        console.error('[WebRTC] Error handling remote ICE candidate:', err);
      }
    });

    this.socket.on('peer-media-status', ({ userId, isMicOn, isVideoOn }) => {
      this.isPeerMicOn = Boolean(isMicOn);
      this.isPeerVideoOn = Boolean(isVideoOn);
      if (this.isPeerVideoOn) {
        // Partner turned camera back on: immediately refresh remote stream to un-freeze video
        this.refreshRemoteStream();
      }
      this.onPeerMediaStatus({ isPeerMicOn: this.isPeerMicOn, isPeerVideoOn: this.isPeerVideoOn });
    });

    this.socket.on('user-left', () => {
      this.isPeerMicOn = false;
      this.isPeerVideoOn = false;
      this.onPeerMediaStatus({ isPeerMicOn: false, isPeerVideoOn: false });
      this.resetPeerConnection();
    });
  }

  refreshRemoteStream() {
    // Reconstruct fresh MediaStream instance with active live tracks to force video/audio element re-render
    const liveTracks = this.remoteStream.getTracks().filter((t) => t.readyState === 'live');
    const freshStream = new MediaStream(liveTracks.length > 0 ? liveTracks : this.remoteStream.getTracks());
    this.onRemoteStreamUpdate(freshStream);
  }

  findVideoSender() {
    if (!this.peerConnection) return null;
    const pc = this.peerConnection;
    const senders = pc.getSenders();

    if (this.videoSender && senders.includes(this.videoSender)) {
      return this.videoSender;
    }

    if (pc.getTransceivers) {
      const videoTransceiver = pc.getTransceivers().find(
        (t) =>
          (t.receiver?.track?.kind === 'video') ||
          (t.sender?.track?.kind === 'video') ||
          (t.sender === this.videoSender)
      );
      if (videoTransceiver && videoTransceiver.sender) {
        this.videoSender = videoTransceiver.sender;
        return this.videoSender;
      }
    }

    const withTrack = senders.find((s) => s.track && s.track.kind === 'video');
    if (withTrack) {
      this.videoSender = withTrack;
      return withTrack;
    }

    return null;
  }

  findAudioSender() {
    if (!this.peerConnection) return null;
    const pc = this.peerConnection;
    const senders = pc.getSenders();

    if (this.audioSender && senders.includes(this.audioSender)) {
      return this.audioSender;
    }

    if (pc.getTransceivers) {
      const audioTransceiver = pc.getTransceivers().find(
        (t) =>
          (t.receiver?.track?.kind === 'audio') ||
          (t.sender?.track?.kind === 'audio') ||
          (t.sender === this.audioSender)
      );
      if (audioTransceiver && audioTransceiver.sender) {
        this.audioSender = audioTransceiver.sender;
        return this.audioSender;
      }
    }

    const withTrack = senders.find((s) => s.track && s.track.kind === 'audio');
    if (withTrack) {
      this.audioSender = withTrack;
      return withTrack;
    }

    return null;
  }

  getOrCreatePeerConnection() {
    if (this.peerConnection && this.peerConnection.signalingState !== 'closed') {
      return this.peerConnection;
    }

    console.log('[WebRTC] Initializing new RTCPeerConnection with STUN & TURN relay');
    const pc = new RTCPeerConnection(RTC_CONFIG);

    // Pre-create transceivers for both audio and video so SDP negotiation
    // always includes both media lines with sendrecv capability.
    // This allows either peer to turn on mic/camera at any time without
    // asymmetric SDP renegotiation failures!
    let audioTransceiver = pc.getTransceivers().find(
      (t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio'
    );
    if (!audioTransceiver) {
      try {
        audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
      } catch (e) {
        console.warn('[WebRTC] Error adding audio transceiver:', e);
      }
    }

    let videoTransceiver = pc.getTransceivers().find(
      (t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video'
    );
    if (!videoTransceiver) {
      try {
        videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });
      } catch (e) {
        console.warn('[WebRTC] Error adding video transceiver:', e);
      }
    }

    // Attach any existing active local tracks
    const activeAudioTrack = this.localStream.getAudioTracks().find((t) => t.readyState === 'live');
    if (activeAudioTrack && audioTransceiver?.sender) {
      audioTransceiver.sender.replaceTrack(activeAudioTrack).catch(console.warn);
      this.audioSender = audioTransceiver.sender;
    }

    const activeVideoTrack = this.localStream.getVideoTracks().find((t) => t.readyState === 'live');
    if (activeVideoTrack && videoTransceiver?.sender) {
      videoTransceiver.sender.replaceTrack(activeVideoTrack).catch(console.warn);
      this.videoSender = videoTransceiver.sender;
    }

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

      incomingTrack.onended = () => {
        console.log('[WebRTC] Remote track ended:', incomingTrack.id);
        this.remoteStream.removeTrack(incomingTrack);
        this.refreshRemoteStream();
      };

      incomingTrack.onmute = () => {
        console.log('[WebRTC] Remote track muted:', incomingTrack.id);
      };

      incomingTrack.onunmute = () => {
        console.log('[WebRTC] Remote track unmuted, refreshing stream:', incomingTrack.id);
        this.refreshRemoteStream();
      };

      this.refreshRemoteStream();
    };

    // Send ICE candidates to partner
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('signal-ice', { candidate: event.candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.warn('[WebRTC] ICE connection failed, restarting ICE...');
        this.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] PeerConnection state:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.warn('[WebRTC] PeerConnection failed, restarting ICE...');
        this.restartIce();
      }
    };

    this.peerConnection = pc;
    return pc;
  }

  async restartIce() {
    if (!this.peerConnection || this.peerConnection.signalingState === 'closed') return;
    try {
      if (this.peerConnection.restartIce) {
        this.peerConnection.restartIce();
      }
      await this.negotiate({ iceRestart: true });
    } catch (err) {
      console.warn('[WebRTC] Error during ICE restart:', err);
    }
  }

  async initiateCall() {
    console.log('[WebRTC] Initiating P2P WebRTC call with partner...');
    this.getOrCreatePeerConnection();
    await this.negotiate();
  }

  async handleRemoteOffer(offer, senderId) {
    const pc = this.getOrCreatePeerConnection();
    const isPolite = this.socket?.id ? this.socket.id < senderId : true;

    // Check collision / polite peer handling
    const offerCollision = this.isMakingOffer || pc.signalingState !== 'stable';
    if (offerCollision) {
      if (!isPolite) {
        console.log('[WebRTC] Impolite peer ignoring offer collision');
        return;
      }
      console.log('[WebRTC] Polite peer rolling back local offer');
      try {
        await pc.setLocalDescription({ type: 'rollback' });
      } catch (e) {
        console.warn('[WebRTC] Rollback error:', e);
      }
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

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

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (this.socket) {
        this.socket.emit('signal-answer', {
          targetUserId: senderId,
          answer,
        });
      }
    } catch (err) {
      console.error('[WebRTC] Error handling remote offer:', err);
    }
  }

  async handleRemoteAnswer(answer) {
    if (!this.peerConnection) return;
    try {
      if (this.peerConnection.signalingState === 'have-local-offer') {
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
      }
    } catch (err) {
      console.error('[WebRTC] Error handling remote answer:', err);
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

  async negotiate(options = {}) {
    const pc = this.getOrCreatePeerConnection();
    if (pc.signalingState !== 'stable') {
      console.log('[WebRTC] Negotiate postponed: signalingState is', pc.signalingState);
      return;
    }
    try {
      this.isMakingOffer = true;
      const offer = await pc.createOffer(options);
      if (pc.signalingState !== 'stable') return;
      await pc.setLocalDescription(offer);

      if (this.socket) {
        this.socket.emit('signal-offer', { offer });
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
          message: 'Browser blocks camera & microphone on plain HTTP across Wi-Fi. Please open the secure HTTPS URL to enable video and voice call!'
        };
      }
      return {
        supported: false,
        error: 'NO_MEDIA_DEVICES',
        message: 'Camera and microphone APIs are not available in this browser environment.'
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
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

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
        let audioTransceiver = pc.getTransceivers().find(
          (t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio'
        );

        if (audioTransceiver) {
          console.log('[WebRTC] Resuming audio: replacing track on existing sender');
          await audioTransceiver.sender.replaceTrack(newAudioTrack);
          this.audioSender = audioTransceiver.sender;
          if (audioTransceiver.direction !== 'sendrecv') {
            audioTransceiver.direction = 'sendrecv';
          }
        } else {
          console.log('[WebRTC] Adding initial audio transceiver');
          audioTransceiver = pc.addTransceiver(newAudioTrack, {
            direction: 'sendrecv',
            streams: [this.localStream],
          });
          this.audioSender = audioTransceiver.sender;
        }

        await this.negotiate();
        this.broadcastMediaStatus();
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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        });

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
        let videoTransceiver = pc.getTransceivers().find(
          (t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video'
        );

        if (videoTransceiver) {
          console.log('[WebRTC] Resuming video: replacing track on existing sender');
          await videoTransceiver.sender.replaceTrack(newVideoTrack);
          this.videoSender = videoTransceiver.sender;
          if (videoTransceiver.direction !== 'sendrecv') {
            videoTransceiver.direction = 'sendrecv';
          }
        } else {
          console.log('[WebRTC] Adding initial video transceiver');
          videoTransceiver = pc.addTransceiver(newVideoTrack, {
            direction: 'sendrecv',
            streams: [this.localStream],
          });
          this.videoSender = videoTransceiver.sender;
        }

        await this.negotiate();
        this.broadcastMediaStatus();
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
      return { isVideoOn: false, stream: this.localStream };
    }
  }

  // Start Screen Sharing via WebRTC
  async startScreenShare(displayStream) {
    this.screenStream = displayStream;
    const screenTrack = displayStream.getVideoTracks()[0];
    if (!screenTrack) throw new Error('No video track available in screen stream');

    const pc = this.getOrCreatePeerConnection();
    let videoTransceiver = pc.getTransceivers().find(
      (t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video'
    );

    if (videoTransceiver) {
      console.log('[WebRTC] Replacing video sender track with screen share track');
      await videoTransceiver.sender.replaceTrack(screenTrack);
      this.videoSender = videoTransceiver.sender;
      if (videoTransceiver.direction !== 'sendrecv') {
        videoTransceiver.direction = 'sendrecv';
      }
    } else {
      console.log('[WebRTC] Adding screen share track to PeerConnection');
      videoTransceiver = pc.addTransceiver(screenTrack, {
        direction: 'sendrecv',
        streams: [this.localStream],
      });
      this.videoSender = videoTransceiver.sender;
    }

    await this.negotiate();

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
      await this.negotiate();
    }

    if (this.socket) {
      this.socket.emit('screen-share-status', { isSharing: false });
    }
  }

  broadcastMediaStatus() {
    if (this.socket) {
      this.socket.emit('media-status-change', {
        isMicOn: this.isMicOn,
        isVideoOn: this.isVideoOn
      });
    }
  }

  handleMediaError(err, deviceName) {
    console.error(`[WebRTC] Error accessing ${deviceName}:`, err);
    let msg = `Unable to access ${deviceName}.`;

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      msg = `🔒 Permission Denied: Please click 'Allow' in your browser or Mac System Settings > Privacy & Security to enable ${deviceName}.`;
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      msg = `⚠️ No ${deviceName} found on this computer.`;
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      msg = `⚠️ Your ${deviceName} is currently being used by another application (Zoom, FaceTime, Meet). Please close it and retry.`;
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
