(() => {
  const BOARD_SIZE = 8;
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = -1;
  const DIRECTIONS = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1]
  ];

  const state = {
    board: createInitialBoard(),
    currentPlayer: BLACK,
    humanColor: BLACK,
    aiColor: WHITE,
    gameEnded: false,
    aiThinking: false,
    difficulty: "normal"
  };

  const el = {
    board: document.getElementById("board"),
    turnLabel: document.getElementById("turnLabel"),
    scoreLabel: document.getElementById("scoreLabel"),
    messageLabel: document.getElementById("messageLabel"),
    difficulty: document.getElementById("difficulty"),
    humanColor: document.getElementById("humanColor"),
    newGame: document.getElementById("newGame")
  };

  el.difficulty.addEventListener("change", () => {
    state.difficulty = el.difficulty.value;
  });

  el.humanColor.addEventListener("change", () => {
    state.humanColor = Number(el.humanColor.value);
    state.aiColor = -state.humanColor;
    startNewGame();
  });

  el.newGame.addEventListener("click", startNewGame);

  function createInitialBoard() {
    const board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;
    return board;
  }

  function cloneBoard(board) {
    return board.map((row) => [...row]);
  }

  function isInside(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  function getFlipsForMove(board, row, col, player) {
    if (board[row][col] !== EMPTY) {
      return [];
    }

    const opponent = -player;
    const flips = [];

    for (const [dr, dc] of DIRECTIONS) {
      let r = row + dr;
      let c = col + dc;
      const line = [];

      while (isInside(r, c) && board[r][c] === opponent) {
        line.push([r, c]);
        r += dr;
        c += dc;
      }

      if (line.length > 0 && isInside(r, c) && board[r][c] === player) {
        flips.push(...line);
      }
    }

    return flips;
  }

  function getValidMoves(board, player) {
    const moves = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const flips = getFlipsForMove(board, row, col, player);
        if (flips.length > 0) {
          moves.push({ row, col, flips });
        }
      }
    }

    return moves;
  }

  function applyMove(board, move, player) {
    board[move.row][move.col] = player;
    for (const [r, c] of move.flips) {
      board[r][c] = player;
    }
  }

  function countStones(board) {
    let black = 0;
    let white = 0;

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (board[row][col] === BLACK) black += 1;
        if (board[row][col] === WHITE) white += 1;
      }
    }

    return { black, white };
  }

  function isBoardFull(board) {
    return board.every((row) => row.every((cell) => cell !== EMPTY));
  }

  function evaluateBoard(board, player) {
    const opponent = -player;
    const weights = [
      [120, -20, 20, 5, 5, 20, -20, 120],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [120, -20, 20, 5, 5, 20, -20, 120]
    ];

    let positional = 0;
    let myStones = 0;
    let oppStones = 0;

    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        if (board[r][c] === player) {
          positional += weights[r][c];
          myStones += 1;
        } else if (board[r][c] === opponent) {
          positional -= weights[r][c];
          oppStones += 1;
        }
      }
    }

    const mobility = getValidMoves(board, player).length - getValidMoves(board, opponent).length;
    const stoneDiff = myStones - oppStones;

    return positional + mobility * 8 + stoneDiff * 2;
  }

  function minimax(board, depth, playerToMove, maximizingPlayer, alpha, beta) {
    const moves = getValidMoves(board, playerToMove);
    const otherMoves = getValidMoves(board, -playerToMove);
    const terminal = depth === 0 || isBoardFull(board) || (moves.length === 0 && otherMoves.length === 0);

    if (terminal) {
      return { score: evaluateBoard(board, maximizingPlayer), move: null };
    }

    if (moves.length === 0) {
      return minimax(board, depth - 1, -playerToMove, maximizingPlayer, alpha, beta);
    }

    let bestMove = null;

    if (playerToMove === maximizingPlayer) {
      let bestScore = -Infinity;
      for (const move of moves) {
        const next = cloneBoard(board);
        applyMove(next, move, playerToMove);
        const result = minimax(next, depth - 1, -playerToMove, maximizingPlayer, alpha, beta);
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break;
      }
      return { score: bestScore, move: bestMove };
    }

    let bestScore = Infinity;
    for (const move of moves) {
      const next = cloneBoard(board);
      applyMove(next, move, playerToMove);
      const result = minimax(next, depth - 1, -playerToMove, maximizingPlayer, alpha, beta);
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break;
    }
    return { score: bestScore, move: bestMove };
  }

  function pickAiMove(board, aiColor, difficulty) {
    const moves = getValidMoves(board, aiColor);
    if (moves.length === 0) return null;

    if (difficulty === "easy") {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (difficulty === "normal") {
      let bestMove = moves[0];
      let bestScore = -Infinity;
      for (const move of moves) {
        const next = cloneBoard(board);
        applyMove(next, move, aiColor);
        const score = evaluateBoard(next, aiColor);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      return bestMove;
    }

    const remaining = board.flat().filter((v) => v === EMPTY).length;
    const depth = remaining <= 14 ? 6 : 4;
    return minimax(board, depth, aiColor, aiColor, -Infinity, Infinity).move;
  }

  function playerLabel(player) {
    return player === BLACK ? "黒" : "白";
  }

  function render() {
    const validMoves = !state.gameEnded && !state.aiThinking ? getValidMoves(state.board, state.currentPlayer) : [];
    const canPlay = state.currentPlayer === state.humanColor && !state.aiThinking && !state.gameEnded;

    el.board.innerHTML = "";

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const cell = document.createElement("button");
        cell.className = "cell";
        cell.type = "button";
        cell.setAttribute("aria-label", `r${row + 1}c${col + 1}`);

        const piece = state.board[row][col];
        if (piece !== EMPTY) {
          const stone = document.createElement("span");
          stone.className = `stone ${piece === BLACK ? "black" : "white"}`;
          cell.appendChild(stone);
        }

        const move = validMoves.find((m) => m.row === row && m.col === col);
        if (move && canPlay) {
          cell.classList.add("valid");
          cell.addEventListener("click", () => onHumanMove(move));
        } else {
          cell.classList.add("disabled");
          cell.disabled = true;
        }

        el.board.appendChild(cell);
      }
    }

    const { black, white } = countStones(state.board);
    el.turnLabel.textContent = `手番: ${playerLabel(state.currentPlayer)}`;
    el.scoreLabel.textContent = `黒 ${black} - 白 ${white}`;
  }

  function finishGame() {
    state.gameEnded = true;
    const { black, white } = countStones(state.board);

    if (black > white) {
      el.messageLabel.textContent = "ゲーム終了: 黒の勝ち";
    } else if (white > black) {
      el.messageLabel.textContent = "ゲーム終了: 白の勝ち";
    } else {
      el.messageLabel.textContent = "ゲーム終了: 引き分け";
    }
  }

  function advanceTurn() {
    if (isBoardFull(state.board)) {
      finishGame();
      render();
      return;
    }

    const currentMoves = getValidMoves(state.board, state.currentPlayer);
    const opponentMoves = getValidMoves(state.board, -state.currentPlayer);

    if (currentMoves.length === 0 && opponentMoves.length === 0) {
      finishGame();
      render();
      return;
    }

    if (currentMoves.length === 0) {
      el.messageLabel.textContent = `${playerLabel(state.currentPlayer)}は置ける場所がないためパス`;
      state.currentPlayer *= -1;
      render();
      setTimeout(maybeTakeAiTurn, 350);
      return;
    }

    if (state.currentPlayer === state.humanColor) {
      el.messageLabel.textContent = "あなたの手番です。";
    } else {
      el.messageLabel.textContent = "コンピュータ思考中...";
    }

    render();
    maybeTakeAiTurn();
  }

  function onHumanMove(move) {
    if (state.currentPlayer !== state.humanColor || state.gameEnded || state.aiThinking) {
      return;
    }

    applyMove(state.board, move, state.humanColor);
    state.currentPlayer = state.aiColor;
    advanceTurn();
  }

  function maybeTakeAiTurn() {
    if (state.gameEnded || state.currentPlayer !== state.aiColor || state.aiThinking) {
      return;
    }

    state.aiThinking = true;
    render();

    setTimeout(() => {
      const move = pickAiMove(state.board, state.aiColor, state.difficulty);

      if (move) {
        applyMove(state.board, move, state.aiColor);
      }

      state.currentPlayer = state.humanColor;
      state.aiThinking = false;
      advanceTurn();
    }, 220);
  }

  function startNewGame() {
    state.board = createInitialBoard();
    state.currentPlayer = BLACK;
    state.gameEnded = false;
    state.aiThinking = false;
    state.difficulty = el.difficulty.value;
    state.humanColor = Number(el.humanColor.value);
    state.aiColor = -state.humanColor;

    render();

    if (state.humanColor === WHITE) {
      el.messageLabel.textContent = "コンピュータが先手です。";
      maybeTakeAiTurn();
    } else {
      el.messageLabel.textContent = "あなたの手番です。";
    }
  }

  startNewGame();
})();
