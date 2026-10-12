// WebRTC Peer-to-Peer Voice & Video Call Manager for Study Companion
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
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

    this.isInitiator = false;
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
      this.onPeerMediaStatus({ isPeerMicOn: this.isPeerMicOn, isPeerVideoOn: this.isPeerVideoOn });
    });

    this.socket.on('user-left', () => {
      this.isPeerMicOn = false;
      this.isPeerVideoOn = false;
      this.onPeerMediaStatus({ isPeerMicOn: false, isPeerVideoOn: false });
      this.resetPeerConnection();
    });
  }

  getOrCreatePeerConnection() {
    if (this.peerConnection && this.peerConnection.signalingState !== 'closed') {
      return this.peerConnection;
    }

    console.log('[WebRTC] Initializing new RTCPeerConnection');
    const pc = new RTCPeerConnection(RTC_CONFIG);

    // Add local tracks to peer connection
    this.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream);
    });

    // Handle remote tracks (audio, webcam, and screen share)
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track?.kind, event.track?.id);
      if (event.track) {
        if (!this.remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      }
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!this.remoteStream.getTracks().some((t) => t.id === track.id)) {
            this.remoteStream.addTrack(track);
          }
        });
      }
      this.onRemoteStreamUpdate(this.remoteStream);
    };

    // Send ICE candidates to partner
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('signal-ice', { candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.warn('[WebRTC] Connection disconnected, ready to re-establish');
      }
    };

    this.peerConnection = pc;
    return pc;
  }

  async handleRemoteOffer(offer, senderId) {
    const pc = this.getOrCreatePeerConnection();

    // Check collision / polite peer handling
    const offerCollision = this.isMakingOffer || pc.signalingState !== 'stable';
    if (offerCollision) {
      console.log('[WebRTC] Offer collision detected, resolving...');
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Drain queued ICE candidates
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[WebRTC] Failed to add queued ICE:', e);
      }
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (this.socket) {
      this.socket.emit('signal-answer', {
        targetUserId: senderId,
        answer
      });
    }
  }

  async handleRemoteAnswer(answer) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

    // Drain queued ICE candidates
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[WebRTC] Failed to add queued ICE:', e);
      }
    }
  }

  async handleRemoteIceCandidate(candidate) {
    if (!candidate) return;
    if (this.peerConnection && this.peerConnection.remoteDescription) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[WebRTC] Error adding ICE candidate:', err);
      }
    } else {
      this.iceCandidateQueue.push(candidate);
    }
  }

  async negotiate() {
    const pc = this.getOrCreatePeerConnection();
    try {
      this.isMakingOffer = true;
      const offer = await pc.createOffer();
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
        // Replace or add track to PeerConnection
        const senders = pc.getSenders();
        const audioSender = senders.find((s) => s.track && s.track.kind === 'audio');
        if (audioSender) {
          await audioSender.replaceTrack(newAudioTrack);
        } else {
          pc.addTrack(newAudioTrack, this.localStream);
          await this.negotiate();
        }

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

      if (this.peerConnection) {
        const audioSender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'audio');
        if (audioSender) {
          try {
            await audioSender.replaceTrack(null);
          } catch {}
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
        // Replace or add track to PeerConnection
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        } else {
          pc.addTrack(newVideoTrack, this.localStream);
          await this.negotiate();
        }

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

      if (this.peerConnection) {
        const videoSender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          try {
            await videoSender.replaceTrack(null);
          } catch {}
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
    const senders = pc.getSenders();
    const videoSender = senders.find((s) => s.track && s.track.kind === 'video');

    if (videoSender) {
      console.log('[WebRTC] Replacing video sender track with screen share track');
      await videoSender.replaceTrack(screenTrack);
    } else {
      console.log('[WebRTC] Adding screen share track to PeerConnection');
      pc.addTrack(screenTrack, this.localStream);
      await this.negotiate();
    }

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

    if (this.peerConnection) {
      const senders = this.peerConnection.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
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
      }
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
