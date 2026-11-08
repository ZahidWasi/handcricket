// Hand Cricket Core Game Engine

class GameEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.mode = 'pvc'; // 'pvc' | 'pvp' | 'local'
    this.oversType = 'unlimited'; // 'unlimited' | '1_over' | '2_overs' | '5_overs'
    this.maxBalls = Infinity;

    // Players
    this.player1 = {
      id: 'p1',
      name: 'Player 1',
      team: TEAMS[0],
      isBatting: false
    };

    this.player2 = {
      id: 'p2',
      name: 'Computer',
      team: TEAMS[1],
      isBatting: false
    };

    // Toss
    this.tossWinner = null;
    this.tossDecision = null; // 'bat' | 'bowl'
    this.tossCaller = null;
    this.tossCall = null; // 1 = HEADS, 2 = TAILS
    this.tossCoinResult = null; // 1 = HEADS, 2 = TAILS

    // Match Progress
    this.currentInnings = 1; // 1 or 2
    this.state = 'INIT'; // 'INIT' | 'TOSS' | 'INNINGS_1' | 'INNINGS_BREAK' | 'INNINGS_2' | 'FINISHED'
    this.isSuperOver = false;
    
    // Innings Data
    this.innings1 = {
      batsman: null,
      bowler: null,
      score: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      ballHistory: []
    };

    this.innings2 = {
      batsman: null,
      bowler: null,
      score: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      ballHistory: [],
      target: 0
    };

    this.winner = null;
    this.winReason = '';
  }

  setMaxBallsFromOvers(oversType) {
    this.oversType = oversType;
    switch (oversType) {
      case '1_over':
        this.maxBalls = 6;
        break;
      case '2_overs':
        this.maxBalls = 12;
        break;
      case '5_overs':
        this.maxBalls = 30;
        break;
      default:
        this.maxBalls = Infinity;
        break;
    }
  }

  setTossResult(callerId, callValue, coinValue) {
    this.tossCaller = callerId;
    this.tossCall = callValue;
    this.tossCoinResult = coinValue;
    const won = callValue === coinValue;

    if (callerId === this.player1.id) {
      this.tossWinner = won ? this.player1 : this.player2;
    } else {
      this.tossWinner = won ? this.player2 : this.player1;
    }

    return {
      tossWinner: this.tossWinner,
      coinValue: coinValue,
      callValue: callValue
    };
  }

  setTossDecision(winnerId, decision) {
    this.tossDecision = decision; // 'bat' | 'bowl'
    const winner = winnerId === this.player1.id ? this.player1 : this.player2;
    const loser = winnerId === this.player1.id ? this.player2 : this.player1;

    if (decision === 'bat') {
      winner.isBatting = true;
      loser.isBatting = false;
      this.innings1.batsman = winner;
      this.innings1.bowler = loser;
    } else {
      winner.isBatting = false;
      loser.isBatting = true;
      this.innings1.batsman = loser;
      this.innings1.bowler = winner;
    }

    this.state = 'INNINGS_1';
    return {
      battingFirst: this.innings1.batsman,
      bowlingFirst: this.innings1.bowler
    };
  }

  getCurrentInnings() {
    return this.currentInnings === 1 ? this.innings1 : this.innings2;
  }

  playBall(batsmanMove, bowlerMove) {
    const innings = this.getCurrentInnings();
    batsmanMove = Number(batsmanMove);
    bowlerMove = Number(bowlerMove);

    innings.balls += 1;
    let event = 'run'; // 'wicket' | 'four' | 'six' | 'dot' | 'run'

    if (batsmanMove === bowlerMove) {
      // WICKET!
      innings.isOut = true;
      event = 'wicket';
      innings.ballHistory.push('W');
    } else {
      innings.score += batsmanMove;
      innings.ballHistory.push(batsmanMove);

      if (batsmanMove === 0) event = 'dot';
      else if (batsmanMove === 4) {
        event = 'four';
        innings.fours += 1;
      } else if (batsmanMove === 6) {
        event = 'six';
        innings.sixes += 1;
      }
    }

    // Check innings end condition
    let inningsOver = false;
    let matchOver = false;

    if (this.currentInnings === 1) {
      if (innings.isOut || innings.balls >= this.maxBalls) {
        inningsOver = true;
        this.innings2.target = this.innings1.score + 1;
        this.innings2.batsman = this.innings1.bowler;
        this.innings2.bowler = this.innings1.batsman;
        this.currentInnings = 2;
        this.state = 'INNINGS_BREAK';
      }
    } else {
      // Innings 2: Target chase
      if (innings.score >= this.innings2.target) {
        // Chasing team won!
        matchOver = true;
        this.winner = this.innings2.batsman;
        this.winReason = `${this.winner.name} won the match! 🏆`;
        this.state = 'FINISHED';
      } else if (innings.isOut || innings.balls >= this.maxBalls) {
        // Innings 2 ended without reaching target
        if (innings.score === this.innings1.score) {
          if (!this.isSuperOver) {
            // Main match tied! Triggers Super Over!
            return {
              batsmanMove,
              bowlerMove,
              event,
              score: innings.score,
              balls: innings.balls,
              isOut: innings.isOut,
              inningsOver: true,
              matchOver: false,
              isSuperOverTrigger: true,
              currentInnings: this.currentInnings
            };
          } else {
            // Super Over itself tied!
            matchOver = true;
            this.winner = null;
            this.winReason = "Super Over Tied! What an unbelievable match! 🤝";
            this.state = 'FINISHED';
          }
        } else {
          matchOver = true;
          this.winner = this.innings1.batsman;
          const runsDiff = this.innings1.score - this.innings2.score;
          this.winReason = `${this.winner.name} won by ${runsDiff} run${runsDiff === 1 ? '' : 's'}${this.isSuperOver ? ' in Super Over' : ''}! 🏆`;
          this.state = 'FINISHED';
        }
      }
    }

    return {
      batsmanMove,
      bowlerMove,
      event,
      score: innings.score,
      balls: innings.balls,
      isOut: innings.isOut,
      inningsOver,
      matchOver,
      currentInnings: this.currentInnings,
      winner: this.winner,
      winReason: this.winReason
    };
  }

  setupSuperOver() {
    this.isSuperOver = true;
    this.maxBalls = 6; // Super over is strictly 6 balls
    this.currentInnings = 1;
    this.state = 'INNINGS_1';

    // In official cricket, the team that chased in the main match bats first in the Super Over
    const teamBattingFirst = this.innings2.batsman;
    const teamBowlingFirst = this.innings2.bowler;

    this.innings1 = {
      batsman: teamBattingFirst,
      bowler: teamBowlingFirst,
      score: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      ballHistory: []
    };

    this.innings2 = {
      batsman: teamBowlingFirst,
      bowler: teamBattingFirst,
      score: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      ballHistory: [],
      target: 0
    };

    return {
      battingFirst: teamBattingFirst,
      bowlingFirst: teamBowlingFirst
    };
  }

  // Smart / Balanced Computer AI Move Generation
  generateComputerMove(isBatting) {
    const innings = this.getCurrentInnings();
    
    // Balanced weighted probability for exciting cricket gameplay
    if (isBatting) {
      if (this.currentInnings === 2) {
        const needed = this.innings2.target - innings.score;
        const ballsLeft = this.maxBalls - innings.balls;

        // If in deep trouble, try big hits
        if (ballsLeft <= 3 && needed > 8) {
          return Math.random() < 0.6 ? 6 : (Math.random() < 0.5 ? 4 : 5);
        }
        // If just 1 or 2 needed to win, play safe singles/doubles
        if (needed <= 2) {
          return Math.random() < 0.5 ? 1 : 2;
        }
      }
      // Typical batting spread: 0 to 6 with slight favor to 1, 2, 4, 6
      const weights = [0.08, 0.22, 0.20, 0.12, 0.18, 0.05, 0.15]; // index 0 to 6
      return this.getRandomWeighted(weights);
    } else {
      // Bowling: Try to anticipate batsman or standard spread
      const history = innings.ballHistory.filter(x => typeof x === 'number');
      if (history.length > 2 && Math.random() < 0.35) {
        // Occasionally guess the batsman's favorite number from recent history
        const lastMove = history[history.length - 1];
        if (lastMove !== undefined && lastMove >= 0 && lastMove <= 6) {
          return lastMove;
        }
      }
      const bowlingWeights = [0.12, 0.20, 0.18, 0.12, 0.18, 0.06, 0.14];
      return this.getRandomWeighted(bowlingWeights);
    }
  }

  getRandomWeighted(weights) {
    const total = weights.reduce((acc, w) => acc + w, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      if (rand < weights[i]) return i;
      rand -= weights[i];
    }
    return Math.floor(Math.random() * 7);
  }

  static formatOvers(balls) {
    const overs = Math.floor(balls / 6);
    const remainder = balls % 6;
    return `${overs}.${remainder}`;
  }

  static calculateStrikeRate(score, balls) {
    if (balls === 0) return '0.0';
    return ((score / balls) * 100).toFixed(1);
  }

  static calculateRunRate(score, balls) {
    if (balls === 0) return '0.00';
    const overs = balls / 6;
    return (score / overs).toFixed(2);
  }
}
