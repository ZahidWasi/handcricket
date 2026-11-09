// Main Application Controller

class App {
  constructor() {
    this.game = new GameEngine();
    this.selectedTeam = TEAMS[0];
    this.botTeam = TEAMS[1];
    this.myNickname = localStorage.getItem('hc_nickname') || 'Striker';
    this.selectedOvers = 'unlimited';
    this.selectedMode = 'pvc'; // 'pvc' | 'pvp' | 'local'

    this.localPlayerTurn = 1; // For Pass & Play mode
    this.localP1Move = null;
    this.localP2Move = null;

    this.unreadChatCount = 0;
    this.chatOpen = false;

    this.initDOM();
    this.bindEvents();
    this.checkUrlForRoomCode();
  }

  initDOM() {
    // Populate Teams Grid
    const teamsGrid = document.getElementById('teams-grid');
    teamsGrid.innerHTML = '';
    TEAMS.forEach((team, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `team-card relative p-2 rounded-xl border transition-all flex flex-col items-center justify-center ${
        team.id === this.selectedTeam.id 
          ? 'border-amber-400 bg-amber-500/20 shadow-md ring-2 ring-amber-400/50' 
          : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
      }`;
      card.dataset.teamId = team.id;
      card.innerHTML = `
        <img src="${team.logo}" alt="${team.name}" class="w-10 h-10 object-contain pointer-events-none drop-shadow">
        <span class="text-[11px] font-bold text-slate-300 mt-1 pointer-events-none">${team.shortName}</span>
      `;
      card.addEventListener('click', () => this.selectTeam(team));
      teamsGrid.appendChild(card);
    });

    // Nickname input initial value
    const nicknameInput = document.getElementById('input-nickname');
    nicknameInput.value = this.myNickname;
    nicknameInput.addEventListener('input', (e) => {
      this.myNickname = e.target.value.trim() || 'Player';
      localStorage.setItem('hc_nickname', this.myNickname);
    });

    // Update sound icon
    this.updateSoundIcon();
  }

  bindEvents() {
    // Sound Toggle
    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
      const muted = audioManager.toggleMute();
      this.updateSoundIcon();
    });

    // Rules Modal
    document.getElementById('btn-rules-modal').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.remove('hidden');
    });
    document.getElementById('btn-close-rules').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.add('hidden');
    });
    document.getElementById('btn-ack-rules').addEventListener('click', () => {
      document.getElementById('modal-rules').classList.add('hidden');
    });

    // Mode Tabs
    document.getElementById('tab-mode-pvc').addEventListener('click', () => this.switchMode('pvc'));
    document.getElementById('tab-mode-pvp').addEventListener('click', () => this.switchMode('pvp'));
    document.getElementById('tab-mode-local').addEventListener('click', () => this.switchMode('local'));

    // Format (Overs) Selection Buttons
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.format-btn').forEach(b => {
          b.classList.remove('border-amber-500', 'bg-amber-500/20', 'text-amber-300');
          b.classList.add('border-slate-700', 'bg-slate-950/50', 'text-slate-300');
        });
        const target = e.currentTarget;
        target.classList.remove('border-slate-700', 'bg-slate-950/50', 'text-slate-300');
        target.classList.add('border-amber-500', 'bg-amber-500/20', 'text-amber-300');
        this.selectedOvers = target.dataset.overs;
        audioManager.play('click');
      });
    });

    // Action Start Button (PvC / Local)
    document.getElementById('btn-start-game').addEventListener('click', () => {
      audioManager.play('click');
      this.startGame();
    });

    // PvP Room Buttons
    document.getElementById('btn-create-room').addEventListener('click', () => this.createPvPRoom());
    document.getElementById('btn-join-room').addEventListener('click', () => {
      const code = document.getElementById('input-join-code').value.trim();
      if (!code) {
        alert('Please enter a valid Room Code');
        return;
      }
      this.joinPvPRoom(code);
    });

    // Lobby Buttons
    document.getElementById('btn-copy-code').addEventListener('click', () => {
      if (peerService.roomCode) {
        navigator.clipboard.writeText(peerService.roomCode);
        alert(`Room Code copied: ${peerService.roomCode}`);
      }
    });
    document.getElementById('btn-copy-link').addEventListener('click', () => {
      if (peerService.roomCode) {
        const link = `${window.location.origin}${window.location.pathname}?room=${peerService.roomCode}`;
        navigator.clipboard.writeText(link);
        alert('Invite link copied to clipboard! Share it with your friend.');
      }
    });
    document.getElementById('btn-cancel-lobby').addEventListener('click', () => {
      peerService.disconnect();
      this.showScreen('menu');
    });
    document.getElementById('btn-start-toss-pvp').addEventListener('click', () => {
      peerService.send('START_MATCH', { overs: this.selectedOvers });
      this.setupPvPMatchStart();
    });

    // Toss Call Buttons
    document.getElementById('btn-toss-heads').addEventListener('click', () => this.handleTossCall(1));
    document.getElementById('btn-toss-tails').addEventListener('click', () => this.handleTossCall(2));

    // Toss Decision Buttons (Bat / Bowl)
    document.getElementById('btn-toss-bat').addEventListener('click', () => this.handleTossDecision('bat'));
    document.getElementById('btn-toss-bowl').addEventListener('click', () => this.handleTossDecision('bowl'));

    // In-Game Number Moves (0 to 6)
    document.querySelectorAll('.btn-hand-move').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const move = parseInt(e.currentTarget.dataset.move, 10);
        this.handlePlayerMove(move);
      });
    });

    // Quick Sledge Buttons
    document.querySelectorAll('.btn-quick-sledge').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = e.currentTarget.dataset.sledge;
        this.sendChatMessage(text, true);
      });
    });

    // Chat Drawer Toggle & Submit
    document.getElementById('btn-toggle-chat').addEventListener('click', () => this.toggleChat(true));
    document.getElementById('btn-close-chat').addEventListener('click', () => this.toggleChat(false));
    document.getElementById('form-chat').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('input-chat-msg');
      const text = input.value.trim();
      if (text) {
        this.sendChatMessage(text, false);
        input.value = '';
      }
    });

    // Innings Break Start Button
    document.getElementById('btn-start-innings-2').addEventListener('click', () => {
      audioManager.play('click');
      if (this.selectedMode === 'pvp') {
        if (peerService.isHost) {
          peerService.send('START_INNINGS_2');
          this.startSecondInnings();
        } else {
          peerService.send('REQ_START_INNINGS_2');
          const btn = document.getElementById('btn-start-innings-2');
          btn.innerText = 'Waiting for Host...';
          btn.disabled = true;
        }
      } else {
        this.startSecondInnings();
      }
    });

    // Super Over Start Button
    document.getElementById('btn-start-super-over').addEventListener('click', () => {
      audioManager.play('click');
      if (this.selectedMode === 'pvp') {
        peerService.send('START_SUPER_OVER');
      }
      this.executeSuperOverStart();
    });

    // Result Buttons
    document.getElementById('btn-rematch').addEventListener('click', () => {
      audioManager.play('click');
      if (this.selectedMode === 'pvp') {
        peerService.send('REMATCH_OFFER');
        alert('Rematch request sent to opponent!');
      } else {
        this.startGame();
      }
    });
    document.getElementById('btn-back-menu').addEventListener('click', () => {
      if (this.selectedMode === 'pvp') {
        peerService.disconnect();
      }
      this.goToMenu();
    });

    // PeerJS Event Listeners
    this.bindPeerEvents();
  }

  updateSoundIcon() {
    const btn = document.getElementById('btn-sound-toggle');
    if (audioManager.isMuted()) {
      btn.innerHTML = '<i class="fa-solid fa-volume-xmark text-slate-400"></i>';
    } else {
      btn.innerHTML = '<i class="fa-solid fa-volume-high text-amber-400"></i>';
    }
  }

  selectTeam(team) {
    this.selectedTeam = team;
    document.getElementById('selected-team-badge').innerText = team.shortName;
    document.querySelectorAll('.team-card').forEach(card => {
      if (card.dataset.teamId === team.id) {
        card.classList.add('border-amber-400', 'bg-amber-500/20', 'shadow-md', 'ring-2', 'ring-amber-400/50');
        card.classList.remove('border-slate-800', 'bg-slate-950/60');
      } else {
        card.classList.remove('border-amber-400', 'bg-amber-500/20', 'shadow-md', 'ring-2', 'ring-amber-400/50');
        card.classList.add('border-slate-800', 'bg-slate-950/60');
      }
    });
    audioManager.play('click');
  }

  switchMode(mode) {
    this.selectedMode = mode;
    audioManager.play('click');

    const tabs = {
      pvc: document.getElementById('tab-mode-pvc'),
      pvp: document.getElementById('tab-mode-pvp'),
      local: document.getElementById('tab-mode-local')
    };

    Object.entries(tabs).forEach(([m, tab]) => {
      if (m === mode) {
        tab.className = 'mode-tab active py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center space-x-1.5 transition-all bg-amber-500 text-slate-950 shadow-md';
      } else {
        tab.className = 'mode-tab py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center space-x-1.5 transition-all text-slate-300 hover:text-white';
      }
    });

    const pvpBox = document.getElementById('box-pvp-controls');
    const startBox = document.getElementById('box-action-start');

    if (mode === 'pvp') {
      pvpBox.classList.remove('hidden');
      startBox.classList.add('hidden');
    } else {
      pvpBox.classList.add('hidden');
      startBox.classList.remove('hidden');
      document.getElementById('start-btn-label').innerText = mode === 'local' ? 'START PASS & PLAY' : 'TOSS & PLAY MATCH';
    }
  }

  showScreen(name) {
    const screens = ['menu', 'lobby', 'toss', 'match', 'break', 'result'];
    screens.forEach(s => {
      const el = document.getElementById(`screen-${s}`);
      if (el) {
        if (s === name) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });
  }

  goToMenu() {
    this.showScreen('menu');
  }

  checkUrlForRoomCode() {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      this.switchMode('pvp');
      document.getElementById('input-join-code').value = room.toUpperCase();
    }
  }

  // ================= GAME START & TOSS =================

  startGame() {
    this.game.reset();
    this.game.mode = this.selectedMode;
    this.game.setMaxBallsFromOvers(this.selectedOvers);

    const soBadge = document.getElementById('badge-super-over-active');
    if (soBadge) soBadge.classList.add('hidden');

    this.game.player1.name = this.myNickname || 'Player 1';
    this.game.player1.team = this.selectedTeam;

    if (this.selectedMode === 'pvc') {
      // Pick random opponent team different from user's
      const rivalTeams = TEAMS.filter(t => t.id !== this.selectedTeam.id);
      this.botTeam = rivalTeams[Math.floor(Math.random() * rivalTeams.length)];
      this.game.player2.name = 'AI ' + this.botTeam.shortName;
      this.game.player2.team = this.botTeam;
    } else if (this.selectedMode === 'local') {
      const rivalTeams = TEAMS.filter(t => t.id !== this.selectedTeam.id);
      this.game.player2.name = 'Player 2';
      this.game.player2.team = rivalTeams[0];
    }

    this.startTossScreen();
  }

  startTossScreen() {
    this.showScreen('toss');
    const coin = document.getElementById('toss-coin');
    coin.className = 'coin';

    document.getElementById('toss-call-controls').classList.remove('hidden');
    document.getElementById('toss-decision-controls').classList.add('hidden');

    if (this.selectedMode === 'pvp') {
      if (peerService.isHost) {
        document.getElementById('toss-caller-prompt').innerText = "Waiting for Guest to call Heads or Tails...";
        document.getElementById('btn-toss-heads').disabled = true;
        document.getElementById('btn-toss-tails').disabled = true;
      } else {
        document.getElementById('toss-caller-prompt').innerText = "You are calling the Toss! Heads or Tails?";
        document.getElementById('btn-toss-heads').disabled = false;
        document.getElementById('btn-toss-tails').disabled = false;
      }
    } else {
      document.getElementById('toss-caller-prompt').innerText = `${this.game.player1.name}, what is your call?`;
      document.getElementById('btn-toss-heads').disabled = false;
      document.getElementById('btn-toss-tails').disabled = false;
    }
  }

  handleTossCall(callValue) {
    audioManager.play('click');
    audioManager.play('coinFlip');

    const callName = callValue === 1 ? 'HEADS' : 'TAILS';

    if (this.selectedMode === 'pvp') {
      peerService.send('TOSS_CALL', { call: callValue });
      document.getElementById('toss-caller-prompt').innerText = `You called ${callName}! Flipping coin...`;
      document.getElementById('btn-toss-heads').disabled = true;
      document.getElementById('btn-toss-tails').disabled = true;
      return;
    }

    // PvC or Local Toss Resolution
    const coinValue = Math.random() < 0.5 ? 1 : 2;
    this.animateCoinFlip(coinValue, () => {
      const result = this.game.setTossResult(this.game.player1.id, callValue, coinValue);
      this.showTossDecision(result.tossWinner);
    });
  }

  animateCoinFlip(coinValue, onComplete) {
    const coin = document.getElementById('toss-coin');
    coin.className = 'coin ' + (coinValue === 1 ? 'flipping-to-heads' : 'flipping-to-tails');

    setTimeout(() => {
      if (onComplete) onComplete();
    }, 3100);
  }

  showTossDecision(winner) {
    document.getElementById('toss-call-controls').classList.add('hidden');
    const decisionBox = document.getElementById('toss-decision-controls');
    decisionBox.classList.remove('hidden');

    const resultText = document.getElementById('toss-result-text');
    const choiceButtons = document.getElementById('toss-choice-buttons');

    if (this.selectedMode === 'pvc' && winner.id === this.game.player2.id) {
      // Bot won toss!
      const botChoice = Math.random() < 0.5 ? 'bat' : 'bowl';
      resultText.innerText = `${winner.name} won the toss and decided to ${botChoice.toUpperCase()} first!`;
      choiceButtons.classList.add('hidden');
      setTimeout(() => {
        this.game.setTossDecision(winner.id, botChoice);
        this.beginMatchArena();
      }, 2000);
    } else if (this.selectedMode === 'pvp') {
      const isMyWin = (winner.id === this.game.player1.id && peerService.isHost) || 
                        (winner.id === this.game.player2.id && !peerService.isHost);
      if (isMyWin) {
        resultText.innerText = `You won the toss! Choose whether to Bat or Bowl:`;
        choiceButtons.classList.remove('hidden');
      } else {
        resultText.innerText = `${winner.name} won the toss! Waiting for their choice...`;
        choiceButtons.classList.add('hidden');
      }
    } else {
      // Player won toss (or Local mode)
      resultText.innerText = `${winner.name} won the toss! Choose whether to Bat or Bowl:`;
      choiceButtons.classList.remove('hidden');
    }
  }

  handleTossDecision(decision) {
    audioManager.play('click');
    if (this.selectedMode === 'pvp') {
      peerService.send('TOSS_DECISION', { decision });
    }
    const winner = this.game.tossWinner || this.game.player1;
    this.game.setTossDecision(winner.id, decision);
    this.beginMatchArena();
  }

  // ================= MATCH ARENA =================

  beginMatchArena() {
    this.showScreen('match');
    this.updateMatchScoreboard();
    this.resetDuelCardFaces();
    this.updateRoleLabels();
  }

  updateRoleLabels() {
    const innings = this.game.getCurrentInnings();
    const isP1Batting = innings.batsman.id === this.game.player1.id;

    const myRoleLabel = document.getElementById('label-player-role');
    const oppRoleLabel = document.getElementById('label-opponent-role');

    if (this.selectedMode === 'pvp') {
      const amIBatting = peerService.isHost ? isP1Batting : !isP1Batting;
      myRoleLabel.innerText = `${this.myNickname} (${amIBatting ? 'Batting 🏏' : 'Bowling ⚾'})`;
      oppRoleLabel.innerText = `${peerService.isHost ? this.game.player2.name : this.game.player1.name} (${!amIBatting ? 'Batting 🏏' : 'Bowling ⚾'})`;
    } else {
      myRoleLabel.innerText = `${this.game.player1.name} (${isP1Batting ? 'Batting 🏏' : 'Bowling ⚾'})`;
      oppRoleLabel.innerText = `${this.game.player2.name} (${!isP1Batting ? 'Batting 🏏' : 'Bowling ⚾'})`;
    }
  }

  updateMatchScoreboard() {
    const innings = this.game.getCurrentInnings();
    const battingTeam = innings.batsman.team;
    const bowlingTeam = innings.bowler.team;

    document.getElementById('match-batting-logo').src = battingTeam.logo;
    document.getElementById('match-batting-name').innerText = battingTeam.shortName;
    document.getElementById('match-bowling-logo').src = bowlingTeam.logo;
    document.getElementById('match-bowling-name').innerText = bowlingTeam.shortName;

    const scoreDisplay = `${innings.score}/${innings.isOut ? 1 : 0}`;
    document.getElementById('match-current-score').innerText = scoreDisplay;

    const oversStr = GameEngine.formatOvers(innings.balls);
    const maxOversStr = this.game.maxBalls !== Infinity ? ` / ${this.game.maxBalls / 6}.0` : '';
    document.getElementById('match-overs-info').innerText = `(${oversStr}${maxOversStr} ov)`;

    // CRR
    document.getElementById('match-crr-val').innerText = GameEngine.calculateRunRate(innings.score, innings.balls);

    // Target info in 2nd innings
    const targetBanner = document.getElementById('match-target-banner');
    const rrrContainer = document.getElementById('match-rrr-container');

    if (this.game.currentInnings === 2) {
      targetBanner.classList.remove('hidden');
      rrrContainer.classList.remove('hidden');

      const target = this.game.innings2.target;
      const needed = Math.max(0, target - innings.score);
      document.getElementById('target-summary-text').innerText = `Target: ${target} runs`;

      if (this.game.maxBalls !== Infinity) {
        const ballsLeft = Math.max(0, this.game.maxBalls - innings.balls);
        document.getElementById('target-equation-text').innerText = `Need ${needed} runs in ${ballsLeft} balls`;
        const rrr = ballsLeft > 0 ? ((needed / ballsLeft) * 6).toFixed(2) : '-';
        document.getElementById('match-rrr-val').innerText = rrr;
      } else {
        document.getElementById('target-equation-text').innerText = `Need ${needed} runs to win`;
      }
    } else {
      targetBanner.classList.add('hidden');
      rrrContainer.classList.add('hidden');
    }

    // Render ball-by-ball timeline pills
    const timeline = document.getElementById('timeline-pills');
    const timelineMobile = document.getElementById('timeline-pills-mobile');
    if (timeline) timeline.innerHTML = '';
    if (timelineMobile) timelineMobile.innerHTML = '';

    const lastBalls = innings.ballHistory.slice(-8); // Show last 8 balls
    lastBalls.forEach(ball => {
      let colorClass = 'bg-slate-800 text-slate-300';
      if (ball === 'W') colorClass = 'bg-red-600 text-white font-bold animate-pulse';
      else if (ball === 6) colorClass = 'bg-amber-400 text-slate-950 font-bold';
      else if (ball === 4) colorClass = 'bg-emerald-500 text-white font-bold';
      else if (ball === 0) colorClass = 'bg-slate-900 text-slate-500';

      const createPill = () => {
        const pill = document.createElement('span');
        pill.className = `w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-mono border border-slate-700/60 ${colorClass}`;
        pill.innerText = ball;
        return pill;
      };

      if (timeline) timeline.appendChild(createPill());
      if (timelineMobile) timelineMobile.appendChild(createPill());
    });
  }

  resetDuelCardFaces() {
    document.getElementById('img-player-hand').src = 'assets/hand-0.png';
    document.getElementById('text-player-val').innerText = '?';
    document.getElementById('badge-player-locked').classList.add('hidden');

    document.getElementById('img-opponent-hand').src = 'assets/hand-0.png';
    document.getElementById('text-opponent-val').innerText = '?';
    document.getElementById('badge-opponent-locked').classList.add('hidden');

    document.getElementById('duel-status-badge').innerText = 'Pick your gesture (0 to 6)';
    document.getElementById('duel-status-badge').className = 'px-4 py-1.5 rounded-full bg-slate-950/80 border border-slate-700 text-xs font-semibold text-slate-300 shadow-md';

    // Enable number pad
    document.querySelectorAll('.btn-hand-move').forEach(b => b.disabled = false);
  }

  handlePlayerMove(move) {
    audioManager.play('click');

    if (this.selectedMode === 'pvc') {
      // Disable buttons temporarily
      document.querySelectorAll('.btn-hand-move').forEach(b => b.disabled = true);
      document.getElementById('badge-player-locked').classList.remove('hidden');
      document.getElementById('duel-status-badge').innerText = 'Locked in!';

      // Bot generates move
      const isPlayerBatting = this.game.getCurrentInnings().batsman.id === this.game.player1.id;
      const botMove = this.game.generateComputerMove(!isPlayerBatting);

      setTimeout(() => {
        const batsmanMove = isPlayerBatting ? move : botMove;
        const bowlerMove = isPlayerBatting ? botMove : move;
        const result = this.game.playBall(batsmanMove, bowlerMove);
        this.revealSimultaneousMoves(move, botMove, result);
      }, 400);

    } else if (this.selectedMode === 'pvp') {
      document.querySelectorAll('.btn-hand-move').forEach(b => b.disabled = true);
      document.getElementById('badge-player-locked').classList.remove('hidden');
      document.getElementById('duel-status-badge').innerText = 'Waiting for opponent...';
      peerService.submitMove(move);

    } else if (this.selectedMode === 'local') {
      if (this.localPlayerTurn === 1) {
        this.localP1Move = move;
        this.localPlayerTurn = 2;
        document.getElementById('duel-status-badge').innerText = 'Player 2: Pick your secret gesture!';
        document.getElementById('badge-player-locked').classList.remove('hidden');
      } else {
        this.localP2Move = move;
        this.localPlayerTurn = 1;
        document.querySelectorAll('.btn-hand-move').forEach(b => b.disabled = true);
        const isP1Batting = this.game.getCurrentInnings().batsman.id === this.game.player1.id;
        const batsmanMove = isP1Batting ? this.localP1Move : this.localP2Move;
        const bowlerMove = isP1Batting ? this.localP2Move : this.localP1Move;
        const result = this.game.playBall(batsmanMove, bowlerMove);
        this.revealSimultaneousMoves(this.localP1Move, this.localP2Move, result);
      }
    }
  }

  revealSimultaneousMoves(myDisplayMove, oppDisplayMove, result) {
    // Show hands
    document.getElementById('img-player-hand').src = `assets/hand-${myDisplayMove}.png`;
    document.getElementById('text-player-val').innerText = myDisplayMove;

    document.getElementById('img-opponent-hand').src = `assets/hand-${oppDisplayMove}.png`;
    document.getElementById('text-opponent-val').innerText = oppDisplayMove;

    this.triggerDuelCelebration(result);
  }

  triggerDuelCelebration(result) {
    const overlay = document.getElementById('duel-event-overlay');
    const overlayImg = document.getElementById('duel-event-image');
    const statusBadge = document.getElementById('duel-status-badge');

    if (result.event === 'wicket') {
      audioManager.play('wicket');
      document.body.classList.add('shake-effect');
      setTimeout(() => document.body.classList.remove('shake-effect'), 600);

      overlayImg.src = 'assets/out-wicket.png';
      overlay.classList.remove('hidden');
      statusBadge.innerText = 'WICKET! OUT! 💥';
      statusBadge.className = 'px-4 py-1.5 rounded-full bg-red-600 border border-red-400 text-xs font-bold text-white shadow-lg animate-pulse';

    } else if (result.event === 'six') {
      audioManager.play('batHit');
      this.fireConfetti();
      overlayImg.src = 'assets/six.png';
      overlay.classList.remove('hidden');
      statusBadge.innerText = 'MAXIMUM! 6 RUNS! 🚀';
      statusBadge.className = 'px-4 py-1.5 rounded-full bg-amber-500 border border-amber-300 text-xs font-bold text-slate-950 shadow-lg';

    } else if (result.event === 'four') {
      audioManager.play('batHit');
      overlayImg.src = 'assets/four.png';
      overlay.classList.remove('hidden');
      statusBadge.innerText = 'FOUR! BOUNDARY! 🏏';
      statusBadge.className = 'px-4 py-1.5 rounded-full bg-emerald-500 border border-emerald-300 text-xs font-bold text-white shadow-lg';

    } else if (result.event === 'dot') {
      statusBadge.innerText = 'DOT BALL! (0 runs)';
      statusBadge.className = 'px-4 py-1.5 rounded-full bg-slate-800 text-xs font-semibold text-slate-400 shadow';

    } else {
      audioManager.play('batHit');
      statusBadge.innerText = `${result.batsmanMove} RUN${result.batsmanMove > 1 ? 'S' : ''}! 🏃`;
      statusBadge.className = 'px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 shadow';
    }

    this.updateMatchScoreboard();

    // Hide event graphic after 1.4s and progress match
    setTimeout(() => {
      overlay.classList.add('hidden');

      if (result.isSuperOverTrigger) {
        this.triggerSuperOverFlow();
      } else if (result.matchOver) {
        this.showMatchResult(result);
      } else if (result.inningsOver) {
        this.showInningsBreak();
      } else {
        this.resetDuelCardFaces();
      }
    }, 1500);
  }

  triggerSuperOverFlow() {
    audioManager.play('cheer');
    this.fireConfetti();
    document.getElementById('modal-super-over').classList.remove('hidden');
  }

  executeSuperOverStart() {
    document.getElementById('modal-super-over').classList.add('hidden');
    this.game.setupSuperOver();

    // Show Super Over badge in scoreboard
    const soBadge = document.getElementById('badge-super-over-active');
    if (soBadge) soBadge.classList.remove('hidden');

    this.showScreen('match');
    this.updateRoleLabels();
    this.updateMatchScoreboard();
    this.resetDuelCardFaces();
  }

  showInningsBreak() {
    this.showScreen('break');
    const inn1 = this.game.innings1;
    document.getElementById('break-summary-title').innerText = `${inn1.batsman.name} Scored:`;
    document.getElementById('break-score-val').innerText = `${inn1.score}/1`;
    document.getElementById('break-overs-val').innerText = `in ${GameEngine.formatOvers(inn1.balls)} Overs`;
    document.getElementById('break-target-val').innerText = `${this.game.innings2.target} runs required`;
  }

  startSecondInnings() {
    const btn = document.getElementById('btn-start-innings-2');
    if (btn) {
      btn.innerText = 'START 2ND INNINGS CHASE 🏏';
      btn.disabled = false;
    }
    peerService.resetMoves();
    this.showScreen('match');
    this.updateRoleLabels();
    this.updateMatchScoreboard();
    this.resetDuelCardFaces();
  }

  showMatchResult(result) {
    this.showScreen('result');
    audioManager.play('cheer');
    this.fireConfetti();

    const winner = result.winner;
    if (winner) {
      document.getElementById('result-winner-logo').src = winner.team.logo;
      document.getElementById('result-winner-logo').classList.remove('hidden');
      document.getElementById('result-headline').innerText = `${winner.name} Won!`;
      document.getElementById('result-details').innerText = result.winReason;
    } else {
      document.getElementById('result-winner-logo').classList.add('hidden');
      document.getElementById('result-headline').innerText = "Match Tied!";
      document.getElementById('result-details').innerText = "What a sensational match!";
    }

    // Comparison Card
    const inn1 = this.game.innings1;
    const inn2 = this.game.innings2;

    document.getElementById('card-t1-logo').src = inn1.batsman.team.logo;
    document.getElementById('card-t1-name').innerText = inn1.batsman.name;
    document.getElementById('card-t1-score').innerText = `${inn1.score}/1`;
    document.getElementById('card-t1-balls').innerText = `(${inn1.balls} balls)`;

    document.getElementById('card-t2-logo').src = inn2.batsman.team.logo;
    document.getElementById('card-t2-name').innerText = inn2.batsman.name;
    document.getElementById('card-t2-score').innerText = `${inn2.score}/${inn2.isOut ? 1 : 0}`;
    document.getElementById('card-t2-balls').innerText = `(${inn2.balls} balls)`;
  }

  fireConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }

  // ================= PVP LOBBY & PEERJS INTEGRATION =================

  async createPvPRoom() {
    audioManager.play('click');
    try {
      this.showScreen('lobby');
      document.getElementById('lobby-room-code').innerText = 'Generating...';
      document.getElementById('lobby-host-logo').src = this.selectedTeam.logo;
      document.getElementById('lobby-host-name').innerText = `${this.myNickname} (Host)`;
      document.getElementById('lobby-guest-waiting').classList.remove('hidden');
      document.getElementById('lobby-guest-connected').classList.add('hidden');
      document.getElementById('btn-start-toss-pvp').disabled = true;

      const code = await peerService.createRoom();
      document.getElementById('lobby-room-code').innerText = code;
    } catch (err) {
      alert('Failed to create room. Please try again.');
      this.showScreen('menu');
    }
  }

  async joinPvPRoom(code) {
    audioManager.play('click');
    try {
      this.showScreen('lobby');
      document.getElementById('lobby-room-code').innerText = code.toUpperCase();
      document.getElementById('lobby-guest-waiting').classList.remove('hidden');
      document.getElementById('lobby-guest-connected').classList.add('hidden');

      await peerService.joinRoom(code);
      peerService.send('JOIN_LOBBY', {
        nickname: this.myNickname,
        teamId: this.selectedTeam.id
      });
    } catch (err) {
      alert('Could not connect to room. Check the code and try again.');
      this.showScreen('menu');
    }
  }

  bindPeerEvents() {
    // When guest joins host
    peerService.on('guestJoined', (data) => {
      audioManager.play('cheer');
      const guestTeam = getTeamById(data.teamId);
      document.getElementById('lobby-guest-waiting').classList.add('hidden');
      document.getElementById('lobby-guest-connected').classList.remove('hidden');
      document.getElementById('lobby-guest-logo').src = guestTeam.logo;
      document.getElementById('lobby-guest-name').innerText = data.nickname || 'Guest';

      this.game.reset();
      this.game.mode = 'pvp';
      this.game.setMaxBallsFromOvers(this.selectedOvers);
      this.game.player1.name = this.myNickname;
      this.game.player1.team = this.selectedTeam;
      this.game.player2.name = data.nickname || 'Guest';
      this.game.player2.team = guestTeam;

      // Enable start toss for host
      document.getElementById('btn-start-toss-pvp').disabled = false;

      // Send host info back to guest
      peerService.send('LOBBY_CONFIG', {
        hostNickname: this.myNickname,
        hostTeamId: this.selectedTeam.id,
        overs: this.selectedOvers
      });
    });

    // When guest receives host info
    peerService.on('lobbyConfig', (data) => {
      const hostTeam = getTeamById(data.hostTeamId);
      document.getElementById('lobby-host-logo').src = hostTeam.logo;
      document.getElementById('lobby-host-name').innerText = `${data.hostNickname} (Host)`;

      document.getElementById('lobby-guest-waiting').classList.add('hidden');
      document.getElementById('lobby-guest-connected').classList.remove('hidden');
      document.getElementById('lobby-guest-logo').src = this.selectedTeam.logo;
      document.getElementById('lobby-guest-name').innerText = `${this.myNickname} (You)`;

      this.game.reset();
      this.game.mode = 'pvp';
      this.selectedOvers = data.overs;
      this.game.setMaxBallsFromOvers(data.overs);
      this.game.player1.name = data.hostNickname;
      this.game.player1.team = hostTeam;
      this.game.player2.name = this.myNickname;
      this.game.player2.team = this.selectedTeam;
    });

    // Match Start broadcast
    peerService.on('matchStarted', (data) => {
      this.setupPvPMatchStart();
    });

    // Toss events
    peerService.on('tossCalled', (data) => {
      // Host receives guest's call
      const coinValue = Math.random() < 0.5 ? 1 : 2;
      this.animateCoinFlip(coinValue, () => {
        const result = this.game.setTossResult(this.game.player2.id, data.call, coinValue);
        peerService.send('TOSS_RESULT', {
          coinValue,
          callValue: data.call,
          winnerId: result.tossWinner.id
        });
        this.showTossDecision(result.tossWinner);
      });
    });

    peerService.on('tossResult', (data) => {
      // Guest receives coin flip result
      this.animateCoinFlip(data.coinValue, () => {
        const winner = data.winnerId === this.game.player1.id ? this.game.player1 : this.game.player2;
        this.game.tossWinner = winner;
        this.showTossDecision(winner);
      });
    });

    peerService.on('tossDecision', (data) => {
      const winner = this.game.tossWinner || this.game.player1;
      this.game.setTossDecision(winner.id, data.decision);
      this.beginMatchArena();
    });

    // Move synchronization
    peerService.on('opponentLocked', () => {
      document.getElementById('badge-opponent-locked').classList.remove('hidden');
      if (!peerService.hasLocked) {
        document.getElementById('duel-status-badge').innerText = 'Opponent is ready! Pick your gesture!';
      }
    });

    peerService.on('hostMovesReady', ({ hostMove, guestMove }) => {
      const isP1Batting = this.game.getCurrentInnings().batsman.id === this.game.player1.id;
      const batsmanMove = isP1Batting ? hostMove : guestMove;
      const bowlerMove = isP1Batting ? guestMove : hostMove;

      const result = this.game.playBall(batsmanMove, bowlerMove);

      // Broadcast authoritative outcome and game state to Guest
      peerService.send('BALL_RESOLVED', {
        hostMove,
        guestMove,
        result,
        innings1: this.game.innings1,
        innings2: this.game.innings2,
        currentInnings: this.game.currentInnings,
        isSuperOver: this.game.isSuperOver
      });

      this.revealSimultaneousMoves(hostMove, guestMove, result);
    });

    peerService.on('ballResolved', (data) => {
      // Synchronize exact game state from Host
      this.game.innings1 = data.innings1;
      this.game.innings2 = data.innings2;
      this.game.currentInnings = data.currentInnings;
      this.game.isSuperOver = data.isSuperOver;

      // On Guest's device: myMove is guestMove, opponentMove is hostMove
      this.revealSimultaneousMoves(data.guestMove, data.hostMove, data.result);
    });

    peerService.on('startInnings2', () => {
      this.startSecondInnings();
    });

    peerService.on('startSuperOver', () => {
      this.executeSuperOverStart();
    });

    peerService.on('peerDisconnected', () => {
      alert('Opponent disconnected from the match.');
      this.goToMenu();
    });
  }

  setupPvPMatchStart() {
    this.startTossScreen();
  }

  // ================= CHAT & REACTIONS =================

  toggleChat(open) {
    this.chatOpen = open;
    const drawer = document.getElementById('chat-drawer');
    if (open) {
      drawer.classList.remove('translate-x-full');
      this.unreadChatCount = 0;
      document.getElementById('chat-unread-badge').classList.add('hidden');
    } else {
      drawer.classList.add('translate-x-full');
    }
  }

  sendChatMessage(text, isSledge = false) {
    if (!text) return;
    this.appendChatMessage(this.myNickname, text, true);

    if (this.selectedMode === 'pvp') {
      if (isSledge) {
        peerService.send('REACTION', { sender: this.myNickname, text });
      } else {
        peerService.send('CHAT_MSG', { sender: this.myNickname, text });
      }
    }

    if (isSledge) {
      this.showFloatingReaction(text);
    }
  }

  appendChatMessage(sender, text, isMe) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `p-2 rounded-xl text-xs max-w-[85%] ${
      isMe ? 'ml-auto bg-amber-500 text-slate-950 font-medium' : 'mr-auto bg-slate-800 text-slate-200 border border-slate-700'
    }`;
    msg.innerHTML = `<span class="block text-[10px] font-bold opacity-75">${sender}</span><span>${text}</span>`;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  showFloatingReaction(text) {
    const container = document.getElementById('floating-reaction-container');
    const bubble = document.createElement('div');
    bubble.className = 'floating-reaction px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-bold text-sm shadow-2xl border border-yellow-300 pointer-events-none';
    bubble.innerText = text;
    container.appendChild(bubble);
    setTimeout(() => bubble.remove(), 2200);
  }
}

// Instantiate App on DOM ready
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new App();
});
