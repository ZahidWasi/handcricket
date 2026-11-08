// PeerJS Networking Manager for Realtime Peer-to-Peer PvP

class PeerService {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.roomCode = null;
    this.handlers = {};

    this.myMove = null;
    this.hasLocked = false;
    this.opponentHasLocked = false;
    this.opponentMove = null;
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  emit(event, data) {
    if (this.handlers[event]) {
      this.handlers[event](data);
    }
  }

  generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `HC-${code}`;
  }

  getPeerIdFromCode(code) {
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `handcricket-v1-${clean}`;
  }

  // Create Room (Host)
  createRoom(customCode = null) {
    this.isHost = true;
    this.roomCode = customCode || this.generateRoomCode();
    const peerId = this.getPeerIdFromCode(this.roomCode);

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          this.emit('roomCreated', { roomCode: this.roomCode, peerId: id });
          resolve(this.roomCode);
        });

        this.peer.on('connection', (conn) => {
          this.conn = conn;
          this.setupConnection();
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Host Error:', err);
          if (err.type === 'unavailable-id') {
            // Retry with another code
            this.roomCode = this.generateRoomCode();
            this.createRoom(this.roomCode).then(resolve).catch(reject);
          } else {
            this.emit('error', err);
            reject(err);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // Join Room (Guest)
  joinRoom(roomCode) {
    this.isHost = false;
    this.roomCode = roomCode.trim().toUpperCase();
    const targetPeerId = this.getPeerIdFromCode(this.roomCode);

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(null, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', () => {
          this.conn = this.peer.connect(targetPeerId, {
            reliable: true
          });

          this.conn.on('open', () => {
            this.setupConnection();
            this.emit('connectedToHost', { roomCode: this.roomCode });
            resolve(this.roomCode);
          });

          this.conn.on('error', (err) => {
            this.emit('error', err);
            reject(err);
          });
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Guest Error:', err);
          this.emit('error', err);
          reject(err);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  setupConnection() {
    this.conn.on('data', (data) => {
      this.handleIncomingData(data);
    });

    this.conn.on('close', () => {
      this.emit('peerDisconnected');
    });

    this.conn.on('error', (err) => {
      this.emit('error', err);
    });
  }

  send(type, payload = {}) {
    if (this.conn && this.conn.open) {
      this.conn.send({ type, ...payload });
    }
  }

  handleIncomingData(data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'JOIN_LOBBY':
        this.emit('guestJoined', data);
        break;

      case 'LOBBY_CONFIG':
        this.emit('lobbyConfig', data);
        break;

      case 'START_MATCH':
        this.emit('matchStarted', data);
        break;

      case 'TOSS_CALL':
        this.emit('tossCalled', data);
        break;

      case 'TOSS_RESULT':
        this.emit('tossResult', data);
        break;

      case 'TOSS_DECISION':
        this.emit('tossDecision', data);
        break;

      case 'MOVE_LOCK':
        this.opponentHasLocked = true;
        this.emit('opponentLocked');
        this.checkSimultaneousReveal();
        break;

      case 'MOVE_REVEAL':
        this.opponentMove = data.value;
        this.checkSimultaneousReveal();
        break;

      case 'CHAT_MSG':
        this.emit('chatMessage', data);
        break;

      case 'REACTION':
        this.emit('reactionReceived', data);
        break;

      case 'REMATCH_OFFER':
        this.emit('rematchOffered', data);
        break;

      case 'REMATCH_ACCEPT':
        this.emit('rematchAccepted', data);
        break;

      default:
        this.emit(data.type, data);
        break;
    }
  }

  // Fair Play Simultaneous Locking & Revealing
  submitMove(value) {
    this.myMove = value;
    this.hasLocked = true;
    this.send('MOVE_LOCK');
    this.checkSimultaneousReveal();
  }

  checkSimultaneousReveal() {
    if (this.hasLocked && this.opponentHasLocked) {
      // Both have locked in! Now reveal both safely
      if (this.myMove !== null) {
        this.send('MOVE_REVEAL', { value: this.myMove });
      }

      if (this.myMove !== null && this.opponentMove !== null) {
        const moves = {
          myMove: this.myMove,
          opponentMove: this.opponentMove
        };
        // Reset for next ball
        this.myMove = null;
        this.opponentMove = null;
        this.hasLocked = false;
        this.opponentHasLocked = false;

        this.emit('movesRevealed', moves);
      }
    }
  }

  disconnect() {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.isHost = false;
    this.roomCode = null;
  }
}

const peerService = new PeerService();
