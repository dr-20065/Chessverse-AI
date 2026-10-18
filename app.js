/**
 * CHESSVERSE — 3D Cyber Chess Experience
 * Complete WebGL 3D Chess Engine, Rules, 50-50 Balanced AI, Audio Synth & UI
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. AUDIO SYNTHESIZER (Web Audio API)
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playMove() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }

    playCapture() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Deep thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.18);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);

      // Metallic click
      const click = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      click.type = 'square';
      click.frequency.setValueAtTime(800, now);
      click.frequency.exponentialRampToValueAtTime(200, now + 0.05);
      cGain.gain.setValueAtTime(0.15, now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      click.connect(cGain);
      cGain.connect(this.ctx.destination);
      click.start(now);
      click.stop(now + 0.06);
    }

    playCheck() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [587.33, 880].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.25, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.28);
      });
    }

    playVictory() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.3, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    }

    playDefeat() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(0.25, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.45);
      });
    }

    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  }

  const sound = new SoundEngine();

  /* ==========================================================================
     2. CHESS RULES & 50-50 BALANCED EVALUATION
     ========================================================================== */
  const PIECE_VALS = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

  // Piece-Square Tables (White perspective, rank 0 is 8th rank, rank 7 is 1st rank)
  const PST = {
    p: [
      [ 0,  0,  0,  0,  0,  0,  0,  0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [ 5,  5, 10, 25, 25, 10,  5,  5],
      [ 0,  0,  0, 20, 20,  0,  0,  0],
      [ 5, -5,-10,  0,  0,-10, -5,  5],
      [ 5, 10, 10,-20,-20, 10, 10,  5],
      [ 0,  0,  0,  0,  0,  0,  0,  0]
    ],
    n: [
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,  0,  0,  0,  0,-20,-40],
      [-30,  0, 10, 15, 15, 10,  0,-30],
      [-30,  5, 15, 20, 20, 15,  5,-30],
      [-30,  0, 15, 20, 20, 15,  0,-30],
      [-30,  5, 10, 15, 15, 10,  5,-30],
      [-40,-20,  0,  5,  5,  0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [
      [-20,-10,-10,-10,-10,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5, 10, 10,  5,  0,-10],
      [-10,  5,  5, 10, 10,  5,  5,-10],
      [-10,  0, 10, 10, 10, 10,  0,-10],
      [-10, 10, 10, 10, 10, 10, 10,-10],
      [-10,  5,  0,  0,  0,  0,  5,-10],
      [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [
      [ 0,  0,  0,  0,  0,  0,  0,  0],
      [ 5, 10, 10, 10, 10, 10, 10,  5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [ 0,  0,  0,  5,  5,  0,  0,  0]
    ],
    q: [
      [-20,-10,-10, -5, -5,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5,  5,  5,  5,  0,-10],
      [ -5,  0,  5,  5,  5,  5,  0, -5],
      [  0,  0,  5,  5,  5,  5,  0, -5],
      [-10,  5,  5,  5,  5,  5,  0,-10],
      [-10,  0,  5,  0,  0,  0,  0,-10],
      [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    k: [
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-20,-30,-30,-40,-40,-30,-30,-20],
      [-10,-20,-20,-20,-20,-20,-20,-10],
      [ 20, 20,  0,  0,  0,  0, 20, 20],
      [ 20, 30, 10,  0,  0, 10, 30, 20]
    ]
  };

  class ChessEngine {
    constructor() {
      this.reset();
    }

    reset() {
      this.board = Array(8).fill(null).map(() => Array(8).fill(null));
      this.turn = 'w';
      this.castling = {
        w: { k: true, q: true },
        b: { k: true, q: true }
      };
      this.enPassant = null; // { r, c }
      this.halfMoves = 0;
      this.history = [];
      this.setupInitialPosition();
    }

    setupInitialPosition() {
      const backRank = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
      let idCounter = 1;

      // Black major pieces (rank 0)
      for (let c = 0; c < 8; c++) {
        this.board[0][c] = { type: backRank[c], color: 'b', id: `b_${backRank[c]}_${idCounter++}` };
      }
      // Black pawns (rank 1)
      for (let c = 0; c < 8; c++) {
        this.board[1][c] = { type: 'p', color: 'b', id: `b_p_${idCounter++}` };
      }

      // White pawns (rank 6)
      for (let c = 0; c < 8; c++) {
        this.board[6][c] = { type: 'p', color: 'w', id: `w_p_${idCounter++}` };
      }
      // White major pieces (rank 7)
      for (let c = 0; c < 8; c++) {
        this.board[7][c] = { type: backRank[c], color: 'w', id: `w_${backRank[c]}_${idCounter++}` };
      }
    }

    cloneBoard(b) {
      return b.map(row => row.map(cell => cell ? { ...cell } : null));
    }

    inBounds(r, c) {
      return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    getPiece(r, c) {
      return this.inBounds(r, c) ? this.board[r][c] : null;
    }

    isSquareAttacked(board, r, c, byColor) {
      // Pawn attacks
      const pDir = byColor === 'w' ? 1 : -1;
      const pawnRow = r + pDir;
      for (const dc of [-1, 1]) {
        const pc = c + dc;
        if (this.inBounds(pawnRow, pc)) {
          const p = board[pawnRow][pc];
          if (p && p.color === byColor && p.type === 'p') return true;
        }
      }

      // Knight attacks
      const knightMoves = [
        [-2,-1],[-2,1],[-1,-2],[-1,2],
        [ 1,-2],[ 1,2],[ 2,-1],[ 2,1]
      ];
      for (const [dr, dc] of knightMoves) {
        const nr = r + dr, nc = c + dc;
        if (this.inBounds(nr, nc)) {
          const p = board[nr][nc];
          if (p && p.color === byColor && p.type === 'n') return true;
        }
      }

      // Bishop / Queen diagonals
      const diagDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
      for (const [dr, dc] of diagDirs) {
        let nr = r + dr, nc = c + dc;
        while (this.inBounds(nr, nc)) {
          const p = board[nr][nc];
          if (p) {
            if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true;
            break;
          }
          nr += dr; nc += dc;
        }
      }

      // Rook / Queen straights
      const straightDirs = [[-1,0],[1,0],[0,-1],[0,1]];
      for (const [dr, dc] of straightDirs) {
        let nr = r + dr, nc = c + dc;
        while (this.inBounds(nr, nc)) {
          const p = board[nr][nc];
          if (p) {
            if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true;
            break;
          }
          nr += dr; nc += dc;
        }
      }

      // King adjacent attacks
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (this.inBounds(nr, nc)) {
            const p = board[nr][nc];
            if (p && p.color === byColor && p.type === 'k') return true;
          }
        }
      }

      return false;
    }

    findKing(board, color) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.color === color && p.type === 'k') {
            return { r, c };
          }
        }
      }
      return null;
    }

    isCheck(board, color) {
      const kingPos = this.findKing(board, color);
      if (!kingPos) return false;
      const enemy = color === 'w' ? 'b' : 'w';
      return this.isSquareAttacked(board, kingPos.r, kingPos.c, enemy);
    }

    // Pseudo-legal moves generation
    getPseudoMoves(board, r, c, enPassant, castling) {
      const p = board[r][c];
      if (!p) return [];
      const moves = [];
      const color = p.color;
      const enemy = color === 'w' ? 'b' : 'w';

      if (p.type === 'p') {
        const dir = color === 'w' ? -1 : 1;
        const startRank = color === 'w' ? 6 : 1;
        const promoRank = color === 'w' ? 0 : 7;

        // Forward 1
        const f1 = r + dir;
        if (this.inBounds(f1, c) && !board[f1][c]) {
          if (f1 === promoRank) {
            ['q', 'r', 'b', 'n'].forEach(promo => {
              moves.push({ from: { r, c }, to: { r: f1, c }, promo });
            });
          } else {
            moves.push({ from: { r, c }, to: { r: f1, c } });

            // Forward 2
            const f2 = r + dir * 2;
            if (r === startRank && !board[f2][c]) {
              moves.push({ from: { r, c }, to: { r: f2, c }, isDoublePawn: true });
            }
          }
        }

        // Captures
        for (const dc of [-1, 1]) {
          const tc = c + dc;
          if (this.inBounds(f1, tc)) {
            const target = board[f1][tc];
            if (target && target.color === enemy) {
              if (f1 === promoRank) {
                ['q', 'r', 'b', 'n'].forEach(promo => {
                  moves.push({ from: { r, c }, to: { r: f1, c: tc }, promo, capture: target });
                });
              } else {
                moves.push({ from: { r, c }, to: { r: f1, c: tc }, capture: target });
              }
            } else if (enPassant && enPassant.r === f1 && enPassant.c === tc) {
              // En Passant
              const epPawn = board[r][tc];
              if (epPawn && epPawn.color === enemy && epPawn.type === 'p') {
                moves.push({ from: { r, c }, to: { r: f1, c: tc }, enPassant: true, capture: epPawn });
              }
            }
          }
        }
      } else if (p.type === 'n') {
        const jumps = [
          [-2,-1],[-2,1],[-1,-2],[-1,2],
          [ 1,-2],[ 1,2],[ 2,-1],[ 2,1]
        ];
        for (const [dr, dc] of jumps) {
          const nr = r + dr, nc = c + dc;
          if (this.inBounds(nr, nc)) {
            const dest = board[nr][nc];
            if (!dest) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            } else if (dest.color === enemy) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: dest });
            }
          }
        }
      } else if (p.type === 'b' || p.type === 'r' || p.type === 'q') {
        const dirs = [];
        if (p.type === 'b' || p.type === 'q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
        if (p.type === 'r' || p.type === 'q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);

        for (const [dr, dc] of dirs) {
          let nr = r + dr, nc = c + dc;
          while (this.inBounds(nr, nc)) {
            const dest = board[nr][nc];
            if (!dest) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            } else {
              if (dest.color === enemy) {
                moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: dest });
              }
              break;
            }
            nr += dr; nc += dc;
          }
        }
      } else if (p.type === 'k') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (this.inBounds(nr, nc)) {
              const dest = board[nr][nc];
              if (!dest) {
                moves.push({ from: { r, c }, to: { r: nr, c: nc } });
              } else if (dest.color === enemy) {
                moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: dest });
              }
            }
          }
        }

        // Castling
        const rank = color === 'w' ? 7 : 0;
        if (r === rank && c === 4 && castling && castling[color]) {
          // Kingside
          if (castling[color].k && !board[rank][5] && !board[rank][6]) {
            const rook = board[rank][7];
            if (rook && rook.type === 'r' && rook.color === color) {
              if (!this.isSquareAttacked(board, rank, 4, enemy) &&
                  !this.isSquareAttacked(board, rank, 5, enemy) &&
                  !this.isSquareAttacked(board, rank, 6, enemy)) {
                moves.push({ from: { r, c }, to: { r: rank, c: 6 }, castling: 'k' });
              }
            }
          }
          // Queenside
          if (castling[color].q && !board[rank][1] && !board[rank][2] && !board[rank][3]) {
            const rook = board[rank][0];
            if (rook && rook.type === 'r' && rook.color === color) {
              if (!this.isSquareAttacked(board, rank, 4, enemy) &&
                  !this.isSquareAttacked(board, rank, 3, enemy) &&
                  !this.isSquareAttacked(board, rank, 2, enemy)) {
                moves.push({ from: { r, c }, to: { r: rank, c: 2 }, castling: 'q' });
              }
            }
          }
        }
      }

      return moves;
    }

    simulateMove(board, move) {
      const nextBoard = this.cloneBoard(board);
      const piece = nextBoard[move.from.r][move.from.c];
      nextBoard[move.from.r][move.from.c] = null;

      if (move.promo) {
        nextBoard[move.to.r][move.to.c] = {
          type: move.promo,
          color: piece.color,
          id: piece.id
        };
      } else {
        nextBoard[move.to.r][move.to.c] = piece;
      }

      if (move.enPassant) {
        nextBoard[move.from.r][move.to.c] = null;
      } else if (move.castling === 'k') {
        const rook = nextBoard[move.to.r][7];
        nextBoard[move.to.r][7] = null;
        nextBoard[move.to.r][5] = rook;
      } else if (move.castling === 'q') {
        const rook = nextBoard[move.to.r][0];
        nextBoard[move.to.r][0] = null;
        nextBoard[move.to.r][3] = rook;
      }

      return nextBoard;
    }

    getLegalMovesForSquare(r, c) {
      const p = this.board[r][c];
      if (!p || p.color !== this.turn) return [];
      const pseudo = this.getPseudoMoves(this.board, r, c, this.enPassant, this.castling);
      return pseudo.filter(m => {
        const nextBoard = this.simulateMove(this.board, m);
        return !this.isCheck(nextBoard, p.color);
      });
    }

    getAllLegalMoves(color = this.turn) {
      const allMoves = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (p && p.color === color) {
            const pseudo = this.getPseudoMoves(this.board, r, c, this.enPassant, this.castling);
            for (const m of pseudo) {
              const nextBoard = this.simulateMove(this.board, m);
              if (!this.isCheck(nextBoard, color)) {
                allMoves.push(m);
              }
            }
          }
        }
      }
      return allMoves;
    }

    toCoordStr(r, c) {
      return `${String.fromCharCode(97 + c)}${8 - r}`;
    }

    getSAN(move) {
      const p = this.board[move.from.r][move.from.c];
      if (move.castling === 'k') return 'O-O';
      if (move.castling === 'q') return 'O-O-O';

      let san = '';
      if (p.type === 'p') {
        if (move.capture) {
          san += String.fromCharCode(97 + move.from.c) + 'x';
        }
        san += this.toCoordStr(move.to.r, move.to.c);
        if (move.promo) {
          san += '=' + move.promo.toUpperCase();
        }
      } else {
        san += p.type.toUpperCase();
        if (move.capture) san += 'x';
        san += this.toCoordStr(move.to.r, move.to.c);
      }

      const nextBoard = this.simulateMove(this.board, move);
      const enemy = p.color === 'w' ? 'b' : 'w';
      if (this.isCheck(nextBoard, enemy)) {
        san += '+';
      }
      return san;
    }

    executeMove(move) {
      const piece = this.board[move.from.r][move.from.c];
      const san = this.getSAN(move);
      const captured = move.capture || null;

      this.board[move.from.r][move.from.c] = null;
      if (move.promo) {
        this.board[move.to.r][move.to.c] = {
          type: move.promo,
          color: piece.color,
          id: piece.id
        };
      } else {
        this.board[move.to.r][move.to.c] = piece;
      }

      if (move.enPassant) {
        this.board[move.from.r][move.to.c] = null;
      } else if (move.castling === 'k') {
        const rook = this.board[move.to.r][7];
        this.board[move.to.r][7] = null;
        this.board[move.to.r][5] = rook;
      } else if (move.castling === 'q') {
        const rook = this.board[move.to.r][0];
        this.board[move.to.r][0] = null;
        this.board[move.to.r][3] = rook;
      }

      // Update castling rights
      if (piece.type === 'k') {
        this.castling[piece.color].k = false;
        this.castling[piece.color].q = false;
      } else if (piece.type === 'r') {
        if (move.from.r === 7 && move.from.c === 7) this.castling.w.k = false;
        if (move.from.r === 7 && move.from.c === 0) this.castling.w.q = false;
        if (move.from.r === 0 && move.from.c === 7) this.castling.b.k = false;
        if (move.from.r === 0 && move.from.c === 0) this.castling.b.q = false;
      }
      if (captured && captured.type === 'r') {
        if (move.to.r === 7 && move.to.c === 7) this.castling.w.k = false;
        if (move.to.r === 7 && move.to.c === 0) this.castling.w.q = false;
        if (move.to.r === 0 && move.to.c === 7) this.castling.b.k = false;
        if (move.to.r === 0 && move.to.c === 0) this.castling.b.q = false;
      }

      // En Passant
      if (move.isDoublePawn) {
        this.enPassant = {
          r: (move.from.r + move.to.r) / 2,
          c: move.from.c
        };
      } else {
        this.enPassant = null;
      }

      // 50-move rule counter
      if (piece.type === 'p' || captured) {
        this.halfMoves = 0;
      } else {
        this.halfMoves++;
      }

      this.turn = this.turn === 'w' ? 'b' : 'w';

      const record = {
        from: move.from,
        to: move.to,
        piece: piece,
        captured: captured,
        san: san,
        castlingState: JSON.parse(JSON.stringify(this.castling)),
        enPassant: this.enPassant ? { ...this.enPassant } : null,
        halfMoves: this.halfMoves
      };
      this.history.push(record);

      return record;
    }

    evaluateBoard(board) {
      let score = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (!p) continue;
          const val = PIECE_VALS[p.type];
          const pstRow = p.color === 'w' ? r : 7 - r;
          const pstVal = PST[p.type][pstRow][c];
          const totalVal = val + pstVal;

          if (p.color === 'w') {
            score += totalVal;
          } else {
            score -= totalVal;
          }
        }
      }
      return score;
    }

    // MiniMax with Alpha-Beta
    minimax(board, depth, alpha, beta, isMaximizing, enPassant, castling) {
      if (depth === 0) {
        return { score: this.evaluateBoard(board) };
      }

      const color = isMaximizing ? 'w' : 'b';
      const moves = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.color === color) {
            const pseudo = this.getPseudoMoves(board, r, c, enPassant, castling);
            for (const m of pseudo) {
              const nb = this.simulateMove(board, m);
              if (!this.isCheck(nb, color)) {
                let priority = 0;
                if (m.capture) {
                  priority = PIECE_VALS[m.capture.type] * 10 - PIECE_VALS[p.type];
                }
                moves.push({ move: m, priority });
              }
            }
          }
        }
      }

      if (moves.length === 0) {
        if (this.isCheck(board, color)) {
          return { score: isMaximizing ? -99999 + (4 - depth) : 99999 - (4 - depth) };
        }
        return { score: 0 };
      }

      moves.sort((a, b) => b.priority - a.priority);

      let bestMove = moves[0].move;

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const item of moves) {
          const m = item.move;
          const nb = this.simulateMove(board, m);
          const nextEP = m.isDoublePawn ? { r: (m.from.r + m.to.r) / 2, c: m.from.c } : null;
          const res = this.minimax(nb, depth - 1, alpha, beta, false, nextEP, castling);

          if (res.score > maxEval) {
            maxEval = res.score;
            bestMove = m;
          }
          alpha = Math.max(alpha, res.score);
          if (beta <= alpha) break;
        }
        return { score: maxEval, move: bestMove };
      } else {
        let minEval = Infinity;
        for (const item of moves) {
          const m = item.move;
          const nb = this.simulateMove(board, m);
          const nextEP = m.isDoublePawn ? { r: (m.from.r + m.to.r) / 2, c: m.from.c } : null;
          const res = this.minimax(nb, depth - 1, alpha, beta, true, nextEP, castling);

          if (res.score < minEval) {
            minEval = res.score;
            bestMove = m;
          }
          beta = Math.min(beta, res.score);
          if (beta <= alpha) break;
        }
        return { score: minEval, move: bestMove };
      }
    }

    /**
     * 50-50 Balanced Equalizer AI
     * Evaluates candidate moves, dynamically calibrates selection probabilities
     * so that the human and AI have an even 50-50 win rate!
     */
    getAIMove(difficulty, aiColor, profile) {
      const legal = this.getAllLegalMoves(aiColor);
      if (legal.length === 0) return null;

      const isMaximizing = aiColor === 'w';

      // Evaluate each legal move at depth 1-2
      const scoredMoves = [];
      for (const m of legal) {
        const nextBoard = this.simulateMove(this.board, m);
        const nextEP = m.isDoublePawn ? { r: (m.from.r + m.to.r) / 2, c: m.from.c } : null;
        const res = this.minimax(nextBoard, 1, -Infinity, Infinity, !isMaximizing, nextEP, this.castling);
        scoredMoves.push({ move: m, score: res.score });
      }

      // Sort moves: best to worst for AI
      if (isMaximizing) {
        scoredMoves.sort((a, b) => b.score - a.score);
      } else {
        scoredMoves.sort((a, b) => a.score - b.score);
      }

      // If explicit difficulty level selected (1, 2, 3, 4)
      if (difficulty === 1) {
        // Casual: 35% best, 65% random
        return Math.random() < 0.35 ? scoredMoves[0].move : legal[Math.floor(Math.random() * legal.length)];
      } else if (difficulty === 2) {
        // Club: pick from top 3
        const topN = Math.min(3, scoredMoves.length);
        return scoredMoves[Math.floor(Math.random() * topN)].move;
      } else if (difficulty >= 3) {
        // Strong / Master: always top evaluated move
        return scoredMoves[0].move;
      }

      // DEFAULT: 50-50 BALANCED MATCH (Adaptive Equalizer)
      // Current board advantage for AI
      const rawEval = this.evaluateBoard(this.board);
      const aiAdvantage = isMaximizing ? rawEval : -rawEval;

      // Career win balance
      const games = profile ? profile.games : 0;
      const wins = profile ? profile.wins : 0;
      const losses = profile ? profile.losses : 0;
      const playerWinRate = games > 0 ? wins / games : 0.5;

      const topMove = scoredMoves[0].move;
      const secondMove = scoredMoves.length > 1 ? scoredMoves[1].move : topMove;
      const thirdMove = scoredMoves.length > 2 ? scoredMoves[2].move : secondMove;

      const rand = Math.random();

      // Case 1: AI is significantly ahead (+200 advantage)
      // Rubber-band: ease up to let the player counter-attack!
      if (aiAdvantage > 180) {
        if (rand < 0.40) return topMove;
        if (rand < 0.80) return secondMove;
        return thirdMove;
      }

      // Case 2: Player is ahead (AI trailing by -180)
      // AI sharpens defense to fight back!
      if (aiAdvantage < -180) {
        if (rand < 0.85) return topMove;
        return secondMove;
      }

      // Case 3: Balanced match (-180 to +180)
      // Check player historical win rate to keep it near 50%
      if (playerWinRate > 0.55) {
        // Player is dominating career: make AI slightly tougher (75% best move)
        return rand < 0.75 ? topMove : secondMove;
      } else if (playerWinRate < 0.45) {
        // Player had some losses: make AI slightly more forgiving (50% best, 40% 2nd, 10% 3rd)
        if (rand < 0.50) return topMove;
        if (rand < 0.90) return secondMove;
        return thirdMove;
      } else {
        // True 50-50 equilibrium: 60% top, 35% second, 5% third
        if (rand < 0.60) return topMove;
        if (rand < 0.95) return secondMove;
        return thirdMove;
      }
    }
  }

  /* ==========================================================================
     3. 3D CHESSBOARD WITH CRISP GRIDS, COORDINATES & PROCEDURAL PIECES
     ========================================================================== */
  class Chess3DViewer {
    constructor(canvas) {
      this.canvas = canvas;
      this.scene = null;
      this.camera = null;
      this.renderer = null;

      this.boardGroup = new THREE.Group();
      this.piecesGroup = new THREE.Group();
      this.markersGroup = new THREE.Group();

      this.squareMeshes = []; // 8x8 array
      this.pieceMeshes = new Map(); // pieceId -> Mesh/Group

      // Camera orbit state
      this.radius = 16.2;
      this.theta = 0; // horizontal angle
      this.phi = Math.PI / 3.6; // ~50° elevation so the full grid is clear
      this.target = new THREE.Vector3(0, 0, 0);

      this.isDraggingOrbit = false;
      this.orbitPrev = { x: 0, y: 0 };

      // Raycasting
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      this.initMaterials();
      this.initScene();
    }

    initMaterials() {
      // 1. Light Squares (Ivory Pearl)
      this.matLightSquare = new THREE.MeshStandardMaterial({
        color: 0xf3f4f6,
        roughness: 0.32,
        metalness: 0.08
      });

      // 2. Dark Squares (Titanium Slate)
      this.matDarkSquare = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.45,
        metalness: 0.22
      });

      // 3. Board Edge Frame
      this.matBoardEdge = new THREE.MeshStandardMaterial({
        color: 0x0a0f24,
        roughness: 0.5,
        metalness: 0.4
      });

      // 4. Outer Gold Perimeter Trim
      this.matBoardGoldTrim = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.25,
        metalness: 0.85
      });

      // Piece materials
      this.matWhitePiece = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.18,
        metalness: 0.12
      });
      this.matBlackPiece = new THREE.MeshStandardMaterial({
        color: 0x141a33,
        roughness: 0.28,
        metalness: 0.65
      });

      // Markers
      this.matSelectGlow = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide
      });
      this.matMoveHint = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
      });
      this.matCaptureHint = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      this.matCheckRing = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      });
      this.matLastMoveRing = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
    }

    initScene() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x050711);

      this.camera = new THREE.PerspectiveCamera(
        42,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      this.updateCameraPosition();

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Lights
      const ambientLight = new THREE.AmbientLight(0x334155, 1.5);
      this.scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.85);
      mainLight.position.set(10, 22, 12);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 2048;
      mainLight.shadow.mapSize.height = 2048;
      mainLight.shadow.bias = -0.0005;
      this.scene.add(mainLight);

      const rimLight = new THREE.DirectionalLight(0x6366f1, 1.25);
      rimLight.position.set(-12, 14, -12);
      this.scene.add(rimLight);

      const centerFill = new THREE.PointLight(0x38bdf8, 0.7, 30);
      centerFill.position.set(0, 10, 0);
      this.scene.add(centerFill);

      this.scene.add(this.boardGroup);
      this.scene.add(this.piecesGroup);
      this.scene.add(this.markersGroup);

      this.buildBoard();
      this.setupControls();

      window.addEventListener('resize', () => this.onResize());
      this.animate();
    }

    updateCameraPosition() {
      this.camera.position.x = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
      this.camera.position.y = this.radius * Math.cos(this.phi);
      this.camera.position.z = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
      this.camera.lookAt(this.target);
    }

    setPerspective(color) {
      // White perspective = theta 0, Black perspective = theta Math.PI
      const targetTheta = color === 'w' ? 0 : Math.PI;
      const startTheta = this.theta;
      const startTime = performance.now();
      const duration = 650;

      const easeOut = t => 1 - Math.pow(1 - t, 3);

      const step = now => {
        const progress = Math.min(1, (now - startTime) / duration);
        this.theta = startTheta + (targetTheta - startTheta) * easeOut(progress);
        this.updateCameraPosition();
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }

    /**
     * Builds the 3D chessboard with distinct 8x8 checkerboard grids,
     * grooves between squares, chassis, gold perimeter border, and rank/file coordinate letters & numbers!
     */
    buildBoard() {
      const sqSize = 1.25;
      const tileSize = 1.21; // 0.04 gap leaves a clear, dark grid seam between all squares!
      const tileHeight = 0.18;
      const geoSquare = new THREE.BoxGeometry(tileSize, tileHeight, tileSize);

      // Clear old board elements
      while (this.boardGroup.children.length > 0) {
        this.boardGroup.remove(this.boardGroup.children[0]);
      }

      // 1. Dark Groove Bed Plate under tiles
      const bedSize = 8 * sqSize;
      const bedGeo = new THREE.BoxGeometry(bedSize + 0.05, 0.1, bedSize + 0.05);
      const bedMat = new THREE.MeshStandardMaterial({
        color: 0x080c1e,
        roughness: 0.8,
        metalness: 0.2
      });
      const bedMesh = new THREE.Mesh(bedGeo, bedMat);
      bedMesh.position.set(0, 0.04, 0);
      bedMesh.receiveShadow = true;
      this.boardGroup.add(bedMesh);

      // 2. 64 Checkerboard Squares
      for (let r = 0; r < 8; r++) {
        this.squareMeshes[r] = [];
        for (let c = 0; c < 8; c++) {
          const isLight = (r + c) % 2 === 0;
          const mat = isLight ? this.matLightSquare : this.matDarkSquare;
          const mesh = new THREE.Mesh(geoSquare, mat);

          const x = (c - 3.5) * sqSize;
          const z = (r - 3.5) * sqSize;
          // Top surface sits at y = 0.09 + 0.09 = 0.18
          mesh.position.set(x, 0.09, z);
          mesh.receiveShadow = true;
          mesh.userData = { r, c };

          this.boardGroup.add(mesh);
          this.squareMeshes[r][c] = mesh;
        }
      }

      // 3. Outer Frame & Pedestal Chassis
      const frameWidth = bedSize + 1.2;
      const frameHeight = 0.42;
      const frameGeo = new THREE.BoxGeometry(frameWidth, frameHeight, frameWidth);
      const frameMesh = new THREE.Mesh(frameGeo, this.matBoardEdge);
      frameMesh.position.set(0, -0.16, 0);
      frameMesh.receiveShadow = true;
      this.boardGroup.add(frameMesh);

      // 4. Gold Perimeter Trim Bars (Outside the 8x8 area, completely clear of the squares!)
      const trimThick = 0.08;
      const trimHeight = 0.22;
      const trimMat = this.matBoardGoldTrim;

      // Top & Bottom bars
      const barHGeo = new THREE.BoxGeometry(bedSize + trimThick * 2, trimHeight, trimThick);
      const barTop = new THREE.Mesh(barHGeo, trimMat);
      barTop.position.set(0, 0.08, -bedSize / 2 - trimThick / 2);
      this.boardGroup.add(barTop);

      const barBottom = new THREE.Mesh(barHGeo, trimMat);
      barBottom.position.set(0, 0.08, bedSize / 2 + trimThick / 2);
      this.boardGroup.add(barBottom);

      // Left & Right bars
      const barVGeo = new THREE.BoxGeometry(trimThick, trimHeight, bedSize);
      const barLeft = new THREE.Mesh(barVGeo, trimMat);
      barLeft.position.set(-bedSize / 2 - trimThick / 2, 0.08, 0);
      this.boardGroup.add(barLeft);

      const barRight = new THREE.Mesh(barVGeo, trimMat);
      barRight.position.set(bedSize / 2 + trimThick / 2, 0.08, 0);
      this.boardGroup.add(barRight);

      // 5. Grid Coordinate Markings (Files A-H and Ranks 1-8)
      const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

      for (let c = 0; c < 8; c++) {
        const x = (c - 3.5) * sqSize;
        const sBot = this.createCoordinateSprite(files[c]);
        sBot.position.set(x, 0.08, bedSize / 2 + 0.36);
        this.boardGroup.add(sBot);

        const sTop = this.createCoordinateSprite(files[c]);
        sTop.position.set(x, 0.08, -bedSize / 2 - 0.36);
        this.boardGroup.add(sTop);
      }

      for (let r = 0; r < 8; r++) {
        const z = (r - 3.5) * sqSize;
        const sLeft = this.createCoordinateSprite(ranks[r]);
        sLeft.position.set(-bedSize / 2 - 0.36, 0.08, z);
        this.boardGroup.add(sLeft);

        const sRight = this.createCoordinateSprite(ranks[r]);
        sRight.position.set(bedSize / 2 + 0.36, 0.08, z);
        this.boardGroup.add(sRight);
      }
    }

    createCoordinateSprite(text) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 68px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 64);

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85 });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.65, 0.65, 1);
      return sprite;
    }

    squareToWorld(r, c) {
      const sqSize = 1.25;
      // Top surface of square tile is at y = 0.18
      return new THREE.Vector3((c - 3.5) * sqSize, 0.18, (r - 3.5) * sqSize);
    }

    /* ---------------- Procedural 3D Piece Geometries ---------------- */
    createPieceMesh(type, color) {
      const mat = color === 'w' ? this.matWhitePiece : this.matBlackPiece;
      const group = new THREE.Group();

      const createCylinder = (rb, rt, h, y) => {
        const geo = new THREE.CylinderGeometry(rt, rb, h, 24);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = y;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        return mesh;
      };

      const createSphere = (rad, y) => {
        const geo = new THREE.SphereGeometry(rad, 24, 20);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = y;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        return mesh;
      };

      const createTorus = (rad, tube, y) => {
        const geo = new THREE.TorusGeometry(rad, tube, 12, 28);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.y = y;
        mesh.castShadow = true;
        group.add(mesh);
        return mesh;
      };

      // Base pedestal
      createCylinder(0.40, 0.36, 0.12, 0.06);
      createTorus(0.35, 0.05, 0.12);

      if (type === 'p') {
        // Pawn
        createCylinder(0.32, 0.20, 0.50, 0.38);
        createTorus(0.22, 0.04, 0.65);
        createSphere(0.22, 0.88);
      } else if (type === 'r') {
        // Rook
        createCylinder(0.34, 0.28, 0.72, 0.50);
        createCylinder(0.30, 0.36, 0.18, 0.90);
        createCylinder(0.36, 0.36, 0.20, 1.05);
        createTorus(0.32, 0.04, 1.15);
      } else if (type === 'n') {
        // Knight
        createCylinder(0.34, 0.26, 0.42, 0.34);
        const headGeo = new THREE.BoxGeometry(0.32, 0.52, 0.48);
        const headMesh = new THREE.Mesh(headGeo, mat);
        headMesh.position.set(0, 0.80, 0.04);
        headMesh.rotation.x = 0.2;
        headMesh.castShadow = true;
        group.add(headMesh);

        const muzzleGeo = new THREE.BoxGeometry(0.26, 0.30, 0.38);
        const muzzleMesh = new THREE.Mesh(muzzleGeo, mat);
        muzzleMesh.position.set(0, 0.72, 0.25);
        muzzleMesh.castShadow = true;
        group.add(muzzleMesh);

        const earGeo = new THREE.ConeGeometry(0.07, 0.20, 8);
        const earL = new THREE.Mesh(earGeo, mat);
        earL.position.set(-0.10, 1.15, -0.04);
        earL.rotation.x = -0.15;
        group.add(earL);

        const earR = new THREE.Mesh(earGeo, mat);
        earR.position.set(0.10, 1.15, -0.04);
        earR.rotation.x = -0.15;
        group.add(earR);

        if (color === 'b') group.rotation.y = Math.PI;
      } else if (type === 'b') {
        // Bishop
        createCylinder(0.33, 0.20, 0.70, 0.48);
        createTorus(0.24, 0.04, 0.86);
        const mitreGeo = new THREE.SphereGeometry(0.23, 20, 20);
        mitreGeo.scale(1, 1.45, 1);
        const mitreMesh = new THREE.Mesh(mitreGeo, mat);
        mitreMesh.position.y = 1.18;
        mitreMesh.castShadow = true;
        group.add(mitreMesh);
        createSphere(0.07, 1.54);
      } else if (type === 'q') {
        // Queen
        createCylinder(0.36, 0.22, 0.90, 0.58);
        createTorus(0.28, 0.04, 1.05);
        createCylinder(0.24, 0.40, 0.32, 1.25);
        createSphere(0.13, 1.48);
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const jw = createSphere(0.045, 1.43);
          jw.position.x = Math.sin(ang) * 0.36;
          jw.position.z = Math.cos(ang) * 0.36;
        }
      } else if (type === 'k') {
        // King
        createCylinder(0.38, 0.24, 1.0, 0.62);
        createTorus(0.30, 0.05, 1.15);
        createCylinder(0.26, 0.36, 0.32, 1.34);
        createSphere(0.16, 1.54);

        // 3D Cross
        const crossV = new THREE.BoxGeometry(0.07, 0.28, 0.07);
        const crossMeshV = new THREE.Mesh(crossV, mat);
        crossMeshV.position.y = 1.82;
        crossMeshV.castShadow = true;
        group.add(crossMeshV);

        const crossH = new THREE.BoxGeometry(0.22, 0.07, 0.07);
        const crossMeshH = new THREE.Mesh(crossH, mat);
        crossMeshH.position.y = 1.86;
        crossMeshH.castShadow = true;
        group.add(crossMeshH);
      }

      group.userData = { type, color };
      return group;
    }

    renderBoardState(board) {
      while (this.piecesGroup.children.length > 0) {
        this.piecesGroup.remove(this.piecesGroup.children[0]);
      }
      this.pieceMeshes.clear();

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p) {
            const mesh = this.createPieceMesh(p.type, p.color);
            const pos = this.squareToWorld(r, c);
            mesh.position.copy(pos);
            mesh.userData.id = p.id;
            mesh.userData.r = r;
            mesh.userData.c = c;

            this.piecesGroup.add(mesh);
            this.pieceMeshes.set(p.id, mesh);
          }
        }
      }
    }

    animatePieceMove(pieceId, fromR, fromC, toR, toC, onComplete) {
      let mesh = this.pieceMeshes.get(pieceId);
      if (!mesh) {
        for (const m of this.piecesGroup.children) {
          if (m.userData.r === fromR && m.userData.c === fromC) {
            mesh = m;
            break;
          }
        }
      }

      if (!mesh) {
        if (onComplete) onComplete();
        return;
      }

      const pStart = this.squareToWorld(fromR, fromC);
      const pEnd = this.squareToWorld(toR, toC);
      const duration = 320;
      const startTime = performance.now();
      const arcPeak = 1.1;

      const step = now => {
        const progress = Math.min(1, (now - startTime) / duration);
        mesh.position.x = pStart.x + (pEnd.x - pStart.x) * progress;
        mesh.position.z = pStart.z + (pEnd.z - pStart.z) * progress;
        mesh.position.y = pStart.y + Math.sin(progress * Math.PI) * arcPeak;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          mesh.position.copy(pEnd);
          mesh.userData.r = toR;
          mesh.userData.c = toC;
          if (onComplete) onComplete();
        }
      };
      requestAnimationFrame(step);
    }

    /* ---------------- Markers & Highlights ---------------- */
    clearMarkers() {
      while (this.markersGroup.children.length > 0) {
        this.markersGroup.remove(this.markersGroup.children[0]);
      }
    }

    showSelection(r, c) {
      const pos = this.squareToWorld(r, c);
      const geo = new THREE.RingGeometry(0.1, 0.56, 32);
      const mesh = new THREE.Mesh(geo, this.matSelectGlow);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pos.x, 0.19, pos.z);
      this.markersGroup.add(mesh);
    }

    showMoveHints(moves) {
      for (const m of moves) {
        const pos = this.squareToWorld(m.to.r, m.to.c);
        if (m.capture) {
          const geo = new THREE.RingGeometry(0.36, 0.54, 32);
          const mesh = new THREE.Mesh(geo, this.matCaptureHint);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(pos.x, 0.192, pos.z);
          this.markersGroup.add(mesh);
        } else {
          const geo = new THREE.CircleGeometry(0.18, 24);
          const mesh = new THREE.Mesh(geo, this.matMoveHint);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(pos.x, 0.192, pos.z);
          this.markersGroup.add(mesh);
        }
      }
    }

    showLastMove(from, to) {
      [from, to].forEach(sq => {
        if (!sq) return;
        const pos = this.squareToWorld(sq.r, sq.c);
        const geo = new THREE.RingGeometry(0.42, 0.56, 32);
        const mesh = new THREE.Mesh(geo, this.matLastMoveRing);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(pos.x, 0.185, pos.z);
        this.markersGroup.add(mesh);
      });
    }

    showCheck(kingSquare) {
      if (!kingSquare) return;
      const pos = this.squareToWorld(kingSquare.r, kingSquare.c);
      const geo = new THREE.RingGeometry(0.2, 0.58, 32);
      const mesh = new THREE.Mesh(geo, this.matCheckRing);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pos.x, 0.195, pos.z);
      this.markersGroup.add(mesh);
    }

    /* ---------------- Controls & Interaction ---------------- */
    setupControls() {
      const getCoord = e => {
        if (e.touches && e.touches.length > 0) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
      };

      const onPointerDown = e => {
        if (e.target !== this.canvas) return;
        const coord = getCoord(e);
        this.orbitPrev = coord;
      };

      this.canvas.addEventListener('contextmenu', e => e.preventDefault());

      window.addEventListener('mousedown', onPointerDown);
      window.addEventListener('touchstart', onPointerDown, { passive: true });

      const onPointerMove = e => {
        if (this.isDraggingOrbit) {
          const coord = getCoord(e);
          const dx = coord.x - this.orbitPrev.x;
          const dy = coord.y - this.orbitPrev.y;
          this.orbitPrev = coord;

          this.theta -= dx * 0.008;
          this.phi -= dy * 0.008;

          // Clamp elevation angle (board remains clearly visible)
          const minPhi = Math.PI / 8;
          const maxPhi = Math.PI / 2.3;
          this.phi = Math.max(minPhi, Math.min(maxPhi, this.phi));

          this.updateCameraPosition();
        }
      };

      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('touchmove', onPointerMove, { passive: true });

      const onPointerUp = () => {
        this.isDraggingOrbit = false;
      };

      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchend', onPointerUp);

      this.canvas.addEventListener('wheel', e => {
        e.preventDefault();
        this.radius += e.deltaY * 0.012;
        this.radius = Math.max(9, Math.min(26, this.radius));
        this.updateCameraPosition();
      }, { passive: false });
    }

    raycastSquare(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // 1. Raycast against pieces directly
      const pieceHits = this.raycaster.intersectObjects(this.piecesGroup.children, true);
      if (pieceHits.length > 0) {
        let obj = pieceHits[0].object;
        while (obj && obj.parent && obj.parent !== this.piecesGroup) {
          obj = obj.parent;
        }
        if (obj && obj.userData && typeof obj.userData.r === 'number') {
          return { r: obj.userData.r, c: obj.userData.c };
        }
      }

      // 2. Raycast against board squares
      const squareMeshesFlat = this.squareMeshes.flat();
      const hits = this.raycaster.intersectObjects(squareMeshesFlat, false);

      if (hits.length > 0) {
        return hits[0].object.userData; // { r, c }
      }
      return null;
    }

    onResize() {
      if (!this.camera || !this.renderer) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      const time = performance.now() * 0.003;
      if (this.matSelectGlow) {
        this.matSelectGlow.opacity = 0.45 + Math.sin(time) * 0.15;
      }
      if (this.matCheckRing) {
        this.matCheckRing.opacity = 0.65 + Math.sin(time * 2) * 0.25;
      }

      this.renderer.render(this.scene, this.camera);
    }
  }

  /* ==========================================================================
     4. GAME CONTROLLER & UI APPLICATION
     ========================================================================== */
  class ChessVerseApp {
    constructor() {
      this.engine = new ChessEngine();
      this.viewer = null;

      this.profile = this.loadProfile();
      this.settings = this.loadSettings();

      // Side selection (default White)
      this.playerColor = 'w';
      this.aiColor = 'b';
      this.selectedSquare = null;
      this.currentLegalMoves = [];
      this.pendingPromotion = null;

      // Timers
      this.timerInterval = null;
      this.playerTime = 300;
      this.aiTime = 300;
      this.isGameActive = false;

      // DOM Elements
      this.dom = {
        app: document.getElementById('cv-app'),
        canvas: document.getElementById('cv-canvas'),

        // Screens
        scColor: document.getElementById('sc-color'),
        scGame: document.getElementById('sc-game'),
        scResult: document.getElementById('sc-result'),

        // Pre-game setup & Color
        nameInput: document.getElementById('nameInput'),
        nameErr: document.getElementById('nameErr'),
        colorGreet: document.getElementById('colorGreet'),
        ccards: document.querySelectorAll('.ccard'),
        colorNote: document.getElementById('colorNote'),
        btnConfirm: document.getElementById('btnConfirm'),
        introStats: document.getElementById('introStats'),

        // Game HUD
        playerNameTag: document.getElementById('playerNameTag'),
        aiLvlTag: document.getElementById('aiLvlTag'),
        clockPlayer: document.getElementById('clockPlayer'),
        clockAI: document.getElementById('clockAI'),
        turnPill: document.getElementById('turnPill'),
        thinkDot: document.getElementById('thinkDot'),
        capByPlayer: document.getElementById('capByPlayer'),
        capByAI: document.getElementById('capByAI'),
        histPanel: document.getElementById('histPanel'),
        histBody: document.getElementById('histBody'),

        // Controls
        btnHist: document.getElementById('btnHist'),
        btnUndo: document.getElementById('btnUndo'),
        btnSound: document.getElementById('btnSound'),
        btnSettings: document.getElementById('btnSettings'),
        btnResign: document.getElementById('btnResign'),
        btnRestart: document.getElementById('btnRestart'),
        btnMenu: document.getElementById('btnMenu'),

        // Results
        resIcon: document.getElementById('resIcon'),
        resTitle: document.getElementById('resTitle'),
        resSub: document.getElementById('resSub'),
        resStats: document.getElementById('resStats'),
        btnRematch: document.getElementById('btnRematch'),
        btnResMenu: document.getElementById('btnResMenu'),
        resProfile: document.getElementById('resProfile'),

        // Modals
        mSettings: document.getElementById('mSettings'),
        setClose: document.getElementById('setClose'),
        tSound: document.getElementById('tSound'),
        tHints: document.getElementById('tHints'),
        tPawn: document.getElementById('tPawn'),
        tLabels: document.getElementById('tLabels'),
        selDiff: document.getElementById('selDiff'),
        selTime: document.getElementById('selTime'),
        btnChangeName: document.getElementById('btnChangeName'),
        btnChangeColor: document.getElementById('btnChangeColor'),
        btnZip2: document.getElementById('btnZip2'),
        btnResetStats: document.getElementById('btnResetStats'),
        profSummary: document.getElementById('profSummary'),

        mPromo: document.getElementById('mPromo'),
        pbtns: document.querySelectorAll('.pbtn'),

        mConfirm: document.getElementById('mConfirm'),
        confHead: document.getElementById('confHead'),
        confBody: document.getElementById('confBody'),
        confYes: document.getElementById('confYes'),
        confNo: document.getElementById('confNo'),

        mZip: document.getElementById('mZip'),
        zipClose: document.getElementById('zipClose'),
        zipStatus: document.getElementById('zipStatus'),
        zipLink: document.getElementById('zipLink'),
        zipAgain: document.getElementById('zipAgain'),
        zipHint: document.getElementById('zipHint'),

        toast: document.getElementById('toast')
      };

      this.init();
    }

    loadProfile() {
      const def = {
        name: 'Player',
        color: 'w',
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        streak: 0,
        bestStreak: 0
      };
      try {
        const saved = localStorage.getItem('chessverse_profile');
        return saved ? { ...def, ...JSON.parse(saved) } : def;
      } catch (e) {
        return def;
      }
    }

    saveProfile() {
      try {
        localStorage.setItem('chessverse_profile', JSON.stringify(this.profile));
      } catch (e) {}
    }

    loadSettings() {
      const def = {
        sound: true,
        hints: true,
        pawnQuick: true,
        labels: true,
        difficulty: 0, // 0 = 50-50 Balanced (Adaptive)
        timeControl: 5
      };
      try {
        const saved = localStorage.getItem('chessverse_settings');
        return saved ? { ...def, ...JSON.parse(saved) } : def;
      } catch (e) {
        return def;
      }
    }

    saveSettings() {
      try {
        localStorage.setItem('chessverse_settings', JSON.stringify(this.settings));
      } catch (e) {}
    }

    init() {
      this.viewer = new Chess3DViewer(this.dom.canvas);
      sound.enabled = this.settings.sound;

      this.playerColor = this.profile.color || 'w';
      this.aiColor = this.playerColor === 'w' ? 'b' : 'w';

      this.bindEvents();
      this.applySettingsToUI();
      this.updateProfileUI();
      this.syncColorSelectionUI();

      // Show the Pre-Game Choose Side screen by default!
      this.showScreen('sc-color');
    }

    showScreen(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
      const sc = document.getElementById(id);
      if (sc) sc.classList.add('on');
    }

    showToast(msg, duration = 2800) {
      this.dom.toast.textContent = msg;
      this.dom.toast.classList.add('on');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        this.dom.toast.classList.remove('on');
      }, duration);
    }

    applySettingsToUI() {
      this.dom.tSound.textContent = this.settings.sound ? 'ON' : 'OFF';
      this.dom.tSound.classList.toggle('on', this.settings.sound);

      this.dom.tHints.textContent = this.settings.hints ? 'ON' : 'OFF';
      this.dom.tHints.classList.toggle('on', this.settings.hints);

      this.dom.tPawn.textContent = this.settings.pawnQuick ? 'ON' : 'OFF';
      this.dom.tPawn.classList.toggle('on', this.settings.pawnQuick);

      this.dom.tLabels.textContent = this.settings.labels ? 'ON' : 'OFF';
      this.dom.tLabels.classList.toggle('on', this.settings.labels);

      this.dom.selDiff.value = this.settings.difficulty;
      this.dom.selTime.value = this.settings.timeControl;
      this.dom.btnSound.textContent = this.settings.sound ? '🔊' : '🔇';
    }

    updateProfileUI() {
      const p = this.profile;
      const statsStr = p.games > 0
        ? `${p.games} games · ${p.wins}W / ${p.losses}L · Streak: ${p.streak} (Best: ${p.bestStreak})`
        : 'No games played yet';

      if (this.dom.introStats) this.dom.introStats.textContent = statsStr;
      this.dom.profSummary.textContent = `Career: ${statsStr}`;

      if (p.name) {
        if (this.dom.nameInput) this.dom.nameInput.value = p.name;
        this.dom.playerNameTag.textContent = p.name;
      }
    }

    syncColorSelectionUI() {
      this.dom.ccards.forEach(card => {
        const color = card.getAttribute('data-color');
        card.classList.toggle('sel', color === this.playerColor);
      });

      if (this.playerColor === 'w') {
        this.dom.colorNote.textContent = 'You will play as White and take the first move. (1. e4)';
        this.dom.btnConfirm.textContent = 'CONFIRM AND PLAY AS WHITE';
      } else {
        this.dom.colorNote.textContent = 'You will play as Black. AI takes the first move and the board flips to you.';
        this.dom.btnConfirm.textContent = 'CONFIRM AND PLAY AS BLACK';
      }
      this.dom.btnConfirm.disabled = false;
    }

    /* ---------------- Event Listeners ---------------- */
    bindEvents() {
      // Color Selection Cards
      this.dom.ccards.forEach(card => {
        card.addEventListener('click', () => {
          const chosen = card.getAttribute('data-color');
          this.playerColor = chosen;
          this.aiColor = chosen === 'w' ? 'b' : 'w';
          this.profile.color = chosen;
          this.saveProfile();
          this.syncColorSelectionUI();
          sound.playClick();
        });
      });

      // Confirm & Start Game Button
      this.dom.btnConfirm.addEventListener('click', () => {
        const val = this.dom.nameInput ? this.dom.nameInput.value.trim() : 'Player';
        if (val) {
          this.profile.name = val;
          this.saveProfile();
          this.updateProfileUI();
        }
        sound.playClick();
        this.startNewGame();
      });

      // HUD Button Controls
      this.dom.btnHist.addEventListener('click', () => {
        this.dom.histPanel.classList.toggle('on');
        sound.playClick();
      });

      this.dom.btnUndo.addEventListener('click', () => {
        this.handleUndo();
      });

      this.dom.btnSound.addEventListener('click', () => {
        this.settings.sound = !this.settings.sound;
        sound.enabled = this.settings.sound;
        this.saveSettings();
        this.applySettingsToUI();
        this.showToast(this.settings.sound ? 'Sound enabled' : 'Sound muted');
      });

      this.dom.btnSettings.addEventListener('click', () => {
        this.dom.mSettings.classList.add('on');
        sound.playClick();
      });

      this.dom.setClose.addEventListener('click', () => {
        this.dom.mSettings.classList.remove('on');
        sound.playClick();
      });

      this.dom.btnResign.addEventListener('click', () => {
        this.showConfirmDialog(
          'RESIGN GAME?',
          'Are you sure you want to resign this match?',
          () => {
            this.endGame('defeat', 'Resignation');
          }
        );
      });

      this.dom.btnRestart.addEventListener('click', () => {
        this.showConfirmDialog(
          'RESTART MATCH?',
          'Restart the match from the beginning?',
          () => {
            this.startNewGame();
          }
        );
      });

      this.dom.btnMenu.addEventListener('click', () => {
        this.stopClocks();
        this.isGameActive = false;
        this.syncColorSelectionUI();
        this.showScreen('sc-color');
      });

      // Settings Modal Toggles
      this.dom.tSound.addEventListener('click', () => {
        this.settings.sound = !this.settings.sound;
        sound.enabled = this.settings.sound;
        this.saveSettings();
        this.applySettingsToUI();
      });

      this.dom.tHints.addEventListener('click', () => {
        this.settings.hints = !this.settings.hints;
        this.saveSettings();
        this.applySettingsToUI();
        this.refreshMarkers();
      });

      this.dom.tPawn.addEventListener('click', () => {
        this.settings.pawnQuick = !this.settings.pawnQuick;
        this.saveSettings();
        this.applySettingsToUI();
      });

      this.dom.tLabels.addEventListener('click', () => {
        this.settings.labels = !this.settings.labels;
        this.saveSettings();
        this.applySettingsToUI();
      });

      this.dom.selDiff.addEventListener('change', e => {
        this.settings.difficulty = parseInt(e.target.value, 10);
        this.saveSettings();
        this.updateAITag();
      });

      this.dom.selTime.addEventListener('change', e => {
        this.settings.timeControl = parseInt(e.target.value, 10);
        this.saveSettings();
        this.initClocks();
      });

      this.dom.btnChangeName.addEventListener('click', () => {
        this.dom.mSettings.classList.remove('on');
        this.showScreen('sc-color');
      });

      this.dom.btnChangeColor.addEventListener('click', () => {
        this.dom.mSettings.classList.remove('on');
        this.showScreen('sc-color');
      });

      this.dom.btnResetStats.addEventListener('click', () => {
        this.showConfirmDialog(
          'RESET ALL STATISTICS?',
          'This will erase your games, wins, and win streaks. Proceed?',
          () => {
            this.profile.games = 0;
            this.profile.wins = 0;
            this.profile.losses = 0;
            this.profile.draws = 0;
            this.profile.streak = 0;
            this.profile.bestStreak = 0;
            this.saveProfile();
            this.updateProfileUI();
            this.showToast('Statistics reset successfully');
          }
        );
      });

      // ZIP Download Modal
      this.dom.btnZip2.addEventListener('click', () => {
        this.dom.mSettings.classList.remove('on');
        this.openZipModal();
      });
      this.dom.zipClose.addEventListener('click', () => {
        this.dom.mZip.classList.remove('on');
      });
      this.dom.zipAgain.addEventListener('click', () => {
        this.buildProjectZip();
      });

      // Result Screen Rematch & Menu
      this.dom.btnRematch.addEventListener('click', () => {
        sound.playClick();
        this.startNewGame();
      });
      this.dom.btnResMenu.addEventListener('click', () => {
        sound.playClick();
        this.syncColorSelectionUI();
        this.showScreen('sc-color');
      });

      // Promotion Buttons
      this.dom.pbtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const promo = btn.getAttribute('data-p');
          if (this.pendingPromotion) {
            const move = { ...this.pendingPromotion, promo };
            this.dom.mPromo.classList.remove('on');
            this.pendingPromotion = null;
            this.commitMove(move);
          }
        });
      });

      // Board Interaction (Raycasting click / tap)
      let pointerDownPos = { x: 0, y: 0 };
      this.dom.canvas.addEventListener('pointerdown', e => {
        pointerDownPos = { x: e.clientX, y: e.clientY };
      });

      this.dom.canvas.addEventListener('pointerup', e => {
        const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (dist < 6) {
          const sq = this.viewer.raycastSquare(e.clientX, e.clientY);
          if (sq) {
            this.handleSquareClick(sq.r, sq.c);
          } else {
            this.viewer.isDraggingOrbit = true;
            this.viewer.orbitPrev = { x: e.clientX, y: e.clientY };
          }
        }
      });
    }

    showConfirmDialog(title, message, onYes) {
      this.dom.confHead.textContent = title;
      this.dom.confBody.textContent = message;
      this.dom.mConfirm.classList.add('on');

      const cleanup = () => {
        this.dom.mConfirm.classList.remove('on');
        this.dom.confYes.removeEventListener('click', handleYes);
        this.dom.confNo.removeEventListener('click', handleNo);
      };

      const handleYes = () => {
        cleanup();
        if (onYes) onYes();
      };

      const handleNo = () => {
        cleanup();
      };

      this.dom.confYes.addEventListener('click', handleYes);
      this.dom.confNo.addEventListener('click', handleNo);
    }

    /* ---------------- Game Flow ---------------- */
    startNewGame() {
      this.engine.reset();
      this.selectedSquare = null;
      this.currentLegalMoves = [];
      this.pendingPromotion = null;
      this.isGameActive = true;

      // Perspective: Flip camera smoothly to player's side
      this.viewer.setPerspective(this.playerColor);
      this.viewer.renderBoardState(this.engine.board);
      this.viewer.clearMarkers();

      this.updateAITag();
      this.updateTurnPill();
      this.initClocks();
      this.updateHistoryUI();
      this.updateCapturedUI();

      this.showScreen('sc-game');
      this.showToast(`Match started — Playing as ${this.playerColor === 'w' ? 'White' : 'Black'}`);

      // If player chosen Black, AI starts as White
      if (this.engine.turn === this.aiColor) {
        this.triggerAIMove();
      }
    }

    updateAITag() {
      const d = this.settings.difficulty;
      let tag = '50-50 Fair';
      if (d === 1) tag = 'Casual';
      else if (d === 2) tag = 'Club';
      else if (d === 3) tag = 'Strong';
      else if (d === 4) tag = 'Master';
      this.dom.aiLvlTag.textContent = tag;
    }

    updateTurnPill() {
      const isPlayerTurn = this.engine.turn === this.playerColor;
      this.dom.turnPill.textContent = isPlayerTurn ? 'YOUR TURN' : "CHESSVERSE AI'S TURN";
      this.dom.turnPill.classList.toggle('ai', !isPlayerTurn);
      this.dom.thinkDot.classList.toggle('on', !isPlayerTurn);
    }

    initClocks() {
      this.stopClocks();
      const mins = this.settings.timeControl;
      if (mins === 0) {
        this.dom.clockPlayer.textContent = '∞';
        this.dom.clockAI.textContent = '∞';
        this.dom.clockPlayer.classList.remove('low');
        this.dom.clockAI.classList.remove('low');
        return;
      }

      this.playerTime = mins * 60;
      this.aiTime = mins * 60;
      this.renderClocks();

      this.timerInterval = setInterval(() => {
        if (!this.isGameActive) return;

        if (this.engine.turn === this.playerColor) {
          this.playerTime--;
          if (this.playerTime <= 0) {
            this.playerTime = 0;
            this.endGame('defeat', 'Time expired');
          }
        } else {
          this.aiTime--;
          if (this.aiTime <= 0) {
            this.aiTime = 0;
            this.endGame('victory', 'Opponent time expired');
          }
        }
        this.renderClocks();
      }, 1000);
    }

    stopClocks() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }

    renderClocks() {
      const fmt = s => {
        const m = Math.floor(s / 60);
        const rem = s % 60;
        return `${m}:${rem < 10 ? '0' : ''}${rem}`;
      };

      this.dom.clockPlayer.textContent = fmt(this.playerTime);
      this.dom.clockAI.textContent = fmt(this.aiTime);

      this.dom.clockPlayer.classList.toggle('low', this.playerTime <= 30);
      this.dom.clockAI.classList.toggle('low', this.aiTime <= 30);
    }

    /* ---------------- Move Handling ---------------- */
    handleSquareClick(r, c) {
      if (!this.isGameActive || this.engine.turn !== this.playerColor) return;

      const clickedPiece = this.engine.getPiece(r, c);

      // Pawn Quick-Move Feature
      if (this.settings.pawnQuick && !this.selectedSquare && !clickedPiece) {
        const pDir = this.playerColor === 'w' ? 1 : -1;
        const behindR = r + pDir;
        if (this.engine.inBounds(behindR, c)) {
          const behindPiece = this.engine.getPiece(behindR, c);
          if (behindPiece && behindPiece.color === this.playerColor && behindPiece.type === 'p') {
            const moves = this.engine.getLegalMovesForSquare(behindR, c);
            const targetMove = moves.find(m => m.to.r === r && m.to.c === c);
            if (targetMove) {
              this.attemptMove(targetMove);
              return;
            }
          }
        }
      }

      // If clicking already selected square -> deselect
      if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
        this.selectedSquare = null;
        this.currentLegalMoves = [];
        this.refreshMarkers();
        sound.playClick();
        return;
      }

      // If clicking a valid destination square
      if (this.selectedSquare) {
        const targetMove = this.currentLegalMoves.find(m => m.to.r === r && m.to.c === c);
        if (targetMove) {
          this.attemptMove(targetMove);
          return;
        }
      }

      // Select piece if it belongs to player
      if (clickedPiece && clickedPiece.color === this.playerColor) {
        this.selectedSquare = { r, c };
        this.currentLegalMoves = this.engine.getLegalMovesForSquare(r, c);
        this.refreshMarkers();
        sound.playClick();
      } else {
        this.selectedSquare = null;
        this.currentLegalMoves = [];
        this.refreshMarkers();
      }
    }

    attemptMove(move) {
      const piece = this.engine.getPiece(move.from.r, move.from.c);

      // Promotion popup
      if (piece && piece.type === 'p' && (move.to.r === 0 || move.to.r === 7)) {
        if (!move.promo) {
          this.pendingPromotion = move;
          this.dom.mPromo.classList.add('on');
          return;
        }
      }

      this.commitMove(move);
    }

    commitMove(move) {
      this.selectedSquare = null;
      this.currentLegalMoves = [];
      this.viewer.clearMarkers();

      const piece = this.engine.getPiece(move.from.r, move.from.c);
      const pieceId = piece.id;

      this.viewer.animatePieceMove(pieceId, move.from.r, move.from.c, move.to.r, move.to.c, () => {
        const record = this.engine.executeMove(move);

        if (record.captured) {
          sound.playCapture();
        } else {
          sound.playMove();
        }

        this.viewer.renderBoardState(this.engine.board);

        // Check for King in Check
        const nextInCheck = this.engine.isCheck(this.engine.board, this.engine.turn);
        if (nextInCheck) {
          sound.playCheck();
          const kingSq = this.engine.findKing(this.engine.board, this.engine.turn);
          this.viewer.showCheck(kingSq);
          this.showToast('Check!');
        }

        this.viewer.showLastMove(record.from, record.to);

        this.updateHistoryUI();
        this.updateCapturedUI();
        this.updateTurnPill();

        // Game over check
        const legal = this.engine.getAllLegalMoves(this.engine.turn);
        if (legal.length === 0) {
          if (nextInCheck) {
            const winner = this.engine.turn === 'w' ? 'b' : 'w';
            if (winner === this.playerColor) {
              this.endGame('victory', 'Checkmate');
            } else {
              this.endGame('defeat', 'Checkmate');
            }
          } else {
            this.endGame('draw', 'Stalemate');
          }
          return;
        }

        // 50-move rule
        if (this.engine.halfMoves >= 100) {
          this.endGame('draw', '50-move rule');
          return;
        }

        // Trigger AI move
        if (this.engine.turn === this.aiColor) {
          this.triggerAIMove();
        }
      });
    }

    triggerAIMove() {
      const delay = Math.random() * 400 + 400;

      setTimeout(() => {
        if (!this.isGameActive || this.engine.turn !== this.aiColor) return;

        // 50-50 Adaptive Equalizer AI Move
        const aiMove = this.engine.getAIMove(this.settings.difficulty, this.aiColor, this.profile);
        if (aiMove) {
          if (aiMove.to.r === 0 || aiMove.to.r === 7) {
            const p = this.engine.getPiece(aiMove.from.r, aiMove.from.c);
            if (p && p.type === 'p' && !aiMove.promo) {
              aiMove.promo = 'q';
            }
          }
          this.commitMove(aiMove);
        }
      }, delay);
    }

    handleUndo() {
      if (!this.isGameActive || this.engine.history.length === 0) return;
      if (this.engine.turn !== this.playerColor && this.engine.history.length < 2) return;

      const stepsToRevert = this.engine.turn === this.playerColor ? 2 : 1;
      const targetHistoryLength = Math.max(0, this.engine.history.length - stepsToRevert);

      const moveList = [...this.engine.history.slice(0, targetHistoryLength)];
      this.engine.reset();
      for (const item of moveList) {
        this.engine.executeMove({
          from: item.from,
          to: item.to,
          promo: item.piece.type !== 'p' && item.san.includes('=') ? item.san.split('=')[1].toLowerCase()[0] : null
        });
      }

      this.selectedSquare = null;
      this.currentLegalMoves = [];
      this.viewer.renderBoardState(this.engine.board);
      this.viewer.clearMarkers();

      if (this.engine.history.length > 0) {
        const last = this.engine.history[this.engine.history.length - 1];
        this.viewer.showLastMove(last.from, last.to);
      }

      this.updateHistoryUI();
      this.updateCapturedUI();
      this.updateTurnPill();
      this.showToast('Move undone');
      sound.playClick();
    }

    refreshMarkers() {
      this.viewer.clearMarkers();

      if (this.engine.history.length > 0) {
        const last = this.engine.history[this.engine.history.length - 1];
        this.viewer.showLastMove(last.from, last.to);
      }

      if (this.engine.isCheck(this.engine.board, this.engine.turn)) {
        const kingSq = this.engine.findKing(this.engine.board, this.engine.turn);
        this.viewer.showCheck(kingSq);
      }

      if (this.selectedSquare) {
        this.viewer.showSelection(this.selectedSquare.r, this.selectedSquare.c);
        if (this.settings.hints) {
          this.viewer.showMoveHints(this.currentLegalMoves);
        }
      }
    }

    updateCapturedUI() {
      const onBoard = { w: { p:0,n:0,b:0,r:0,q:0 }, b: { p:0,n:0,b:0,r:0,q:0 } };
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.engine.board[r][c];
          if (p && p.type !== 'k') {
            onBoard[p.color][p.type]++;
          }
        }
      }

      const totalPieces = { p:8, n:2, b:2, r:2, q:1 };
      const icons = {
        w: { p:'♙', n:'♘', b:'♗', r:'♖', q:'♕' },
        b: { p:'♟', n:'♞', b:'♝', r:'♜', q:'♛' }
      };

      const capByW = [];
      let matDiffW = 0;
      for (const t of ['q', 'r', 'b', 'n', 'p']) {
        const count = totalPieces[t] - onBoard.b[t];
        for (let i = 0; i < count; i++) {
          capByW.push(icons.b[t]);
          matDiffW += PIECE_VALS[t];
        }
      }

      const capByB = [];
      let matDiffB = 0;
      for (const t of ['q', 'r', 'b', 'n', 'p']) {
        const count = totalPieces[t] - onBoard.w[t];
        for (let i = 0; i < count; i++) {
          capByB.push(icons.w[t]);
          matDiffB += PIECE_VALS[t];
        }
      }

      const playerCap = this.playerColor === 'w' ? capByW : capByB;
      const aiCap = this.playerColor === 'w' ? capByB : capByW;
      const playerDiff = this.playerColor === 'w' ? (matDiffW - matDiffB) / 100 : (matDiffB - matDiffW) / 100;

      this.dom.capByPlayer.innerHTML = playerCap.join(' ') +
        (playerDiff > 0 ? `<span class="diff">+${playerDiff}</span>` : '');

      this.dom.capByAI.innerHTML = aiCap.join(' ') +
        (playerDiff < 0 ? `<span class="diff">+${Math.abs(playerDiff)}</span>` : '');
    }

    updateHistoryUI() {
      this.dom.histBody.innerHTML = '';
      const hist = this.engine.history;

      for (let i = 0; i < hist.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const wMove = hist[i] ? hist[i].san : '';
        const bMove = hist[i + 1] ? hist[i + 1].san : '';

        const row = document.createElement('div');
        row.className = 'histRow';
        row.innerHTML = `
          <span class="histNum">${moveNum}.</span>
          <span class="histMove ${i === hist.length - 1 ? 'active' : ''}">${wMove}</span>
          <span class="histMove ${i + 1 === hist.length - 1 ? 'active' : ''}">${bMove}</span>
        `;
        this.dom.histBody.appendChild(row);
      }

      this.dom.histBody.scrollTop = this.dom.histBody.scrollHeight;
    }

    endGame(result, reason) {
      this.isGameActive = false;
      this.stopClocks();

      this.profile.games++;
      if (result === 'victory') {
        this.profile.wins++;
        this.profile.streak++;
        if (this.profile.streak > this.profile.bestStreak) {
          this.profile.bestStreak = this.profile.streak;
        }
        sound.playVictory();
      } else if (result === 'defeat') {
        this.profile.losses++;
        this.profile.streak = 0;
        sound.playDefeat();
      } else {
        this.profile.draws++;
        sound.playClick();
      }

      this.saveProfile();
      this.updateProfileUI();

      if (result === 'victory') {
        this.dom.resIcon.textContent = '♔';
        this.dom.resTitle.textContent = 'VICTORY!';
        this.dom.resSub.textContent = `Magnificent play. ${reason}.`;
      } else if (result === 'defeat') {
        this.dom.resIcon.textContent = '♚';
        this.dom.resTitle.textContent = 'DEFEAT';
        this.dom.resSub.textContent = `Game concluded. ${reason}.`;
      } else {
        this.dom.resIcon.textContent = '⚖';
        this.dom.resTitle.textContent = 'DRAW';
        this.dom.resSub.textContent = `A hard-fought stalemate. ${reason}.`;
      }

      const totalMoves = Math.ceil(this.engine.history.length / 2);
      const winRate = Math.round((this.profile.wins / this.profile.games) * 100);

      this.dom.resStats.innerHTML = `
        <div class="statItem"><span class="statVal">${totalMoves}</span><span class="statLbl">Moves</span></div>
        <div class="statItem"><span class="statVal">${winRate}%</span><span class="statLbl">Win Rate</span></div>
        <div class="statItem"><span class="statVal">${this.profile.streak}</span><span class="statLbl">Streak</span></div>
      `;

      this.dom.resProfile.textContent = `${this.profile.name} · Career: ${this.profile.wins}W - ${this.profile.losses}L (${this.profile.games} played)`;

      setTimeout(() => {
        this.showScreen('sc-result');
      }, 700);
    }

    /* ---------------- Project .ZIP Builder ---------------- */
    openZipModal() {
      this.dom.mZip.classList.add('on');
      this.buildProjectZip();
    }

    async buildProjectZip() {
      this.dom.zipStatus.textContent = 'Packaging project files into .ZIP…';
      this.dom.zipLink.removeAttribute('href');
      this.dom.zipLink.style.pointerEvents = 'none';
      this.dom.zipLink.style.opacity = '0.5';

      try {
        if (typeof JSZip === 'undefined') {
          throw new Error('JSZip library not yet ready.');
        }

        const zip = new JSZip();

        const htmlContent = document.documentElement.outerHTML;
        zip.file('index.html', htmlContent);

        try {
          const cssResp = await fetch('css/style.css');
          if (cssResp.ok) {
            const cssText = await cssResp.text();
            zip.file('css/style.css', cssText);
          }
        } catch (e) {}

        try {
          const jsResp = await fetch('js/app.js');
          if (jsResp.ok) {
            const jsText = await jsResp.text();
            zip.file('js/app.js', jsText);
          }
        } catch (e) {}

        try {
          const threeResp = await fetch('vendor/three.min.js');
          if (threeResp.ok) {
            const threeBlob = await threeResp.blob();
            zip.file('vendor/three.min.js', threeBlob);
          }
        } catch (e) {}

        try {
          const jszipResp = await fetch('vendor/jszip.min.js');
          if (jszipResp.ok) {
            const jszipBlob = await jszipResp.blob();
            zip.file('vendor/jszip.min.js', jszipBlob);
          }
        } catch (e) {}

        zip.file('README.md', `# CHESSVERSE\n\nAn immersive 3D WebGL chess game with intelligent AI, adaptive difficulty, sleek cyber aesthetics, and real-time move analysis.\n\n## Quick Start\nDouble click index.html to play!`);

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);

        this.dom.zipLink.href = url;
        this.dom.zipLink.download = 'CHESSVERSE.zip';
        this.dom.zipLink.style.pointerEvents = 'auto';
        this.dom.zipLink.style.opacity = '1';
        this.dom.zipStatus.textContent = `CHESSVERSE.zip ready (${(blob.size / (1024 * 1024)).toFixed(2)} MB)`;
      } catch (err) {
        this.dom.zipStatus.textContent = 'Failed to package project: ' + err.message;
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.app = new ChessVerseApp();
  });
})();
