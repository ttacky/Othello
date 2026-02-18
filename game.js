// Constants
const BLACK = 1;
const WHITE = 2;
const EMPTY = 0;
const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

// Game state
let board = [];
let currentPlayer = BLACK;
let gameOver = false;
let gameMode = 'pvc';
let difficulty = 'medium';
let isProcessing = false;

// DOM elements
const boardEl = document.getElementById('board');
const scoreBlackEl = document.getElementById('score-black');
const scoreWhiteEl = document.getElementById('score-white');
const turnIndicatorEl = document.getElementById('turn-indicator');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restart-btn');
const gameModeEl = document.getElementById('game-mode');
const difficultyEl = document.getElementById('difficulty');
const difficultyContainer = document.getElementById('difficulty-container');
const playerBlackEl = document.getElementById('player-black');
const playerWhiteEl = document.getElementById('player-white');

// Positional weight table for AI evaluation
const POSITION_WEIGHTS = [
    [100, -20,  10,   5,   5,  10, -20, 100],
    [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [ 10,  -2,   1,   1,   1,   1,  -2,  10],
    [  5,  -2,   1,   0,   0,   1,  -2,   5],
    [  5,  -2,   1,   0,   0,   1,  -2,   5],
    [ 10,  -2,   1,   1,   1,   1,  -2,  10],
    [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [100, -20,  10,   5,   5,  10, -20, 100]
];

function initBoard() {
    board = Array.from({ length: 8 }, () => Array(8).fill(EMPTY));
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;
}

function opponent(player) {
    return player === BLACK ? WHITE : BLACK;
}

function isOnBoard(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Returns list of pieces that would be flipped if player places at (row, col)
function getFlips(boardState, row, col, player) {
    if (boardState[row][col] !== EMPTY) return [];

    const opp = opponent(player);
    const allFlips = [];

    for (const [dr, dc] of DIRECTIONS) {
        const flips = [];
        let r = row + dr;
        let c = col + dc;

        while (isOnBoard(r, c) && boardState[r][c] === opp) {
            flips.push([r, c]);
            r += dr;
            c += dc;
        }

        if (flips.length > 0 && isOnBoard(r, c) && boardState[r][c] === player) {
            allFlips.push(...flips);
        }
    }

    return allFlips;
}

function isValidMove(boardState, row, col, player) {
    return getFlips(boardState, row, col, player).length > 0;
}

function getValidMoves(boardState, player) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (isValidMove(boardState, r, c, player)) {
                moves.push([r, c]);
            }
        }
    }
    return moves;
}

function applyMove(boardState, row, col, player) {
    const flips = getFlips(boardState, row, col, player);
    const newBoard = boardState.map(r => [...r]);
    newBoard[row][col] = player;
    for (const [r, c] of flips) {
        newBoard[r][c] = player;
    }
    return { newBoard, flips };
}

function countPieces(boardState) {
    let black = 0, white = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (boardState[r][c] === BLACK) black++;
            else if (boardState[r][c] === WHITE) white++;
        }
    }
    return { black, white };
}

// --- AI ---

function evaluateBoard(boardState, player) {
    const opp = opponent(player);
    let score = 0;

    // Positional weights
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (boardState[r][c] === player) {
                score += POSITION_WEIGHTS[r][c];
            } else if (boardState[r][c] === opp) {
                score -= POSITION_WEIGHTS[r][c];
            }
        }
    }

    // Mobility: number of valid moves
    const myMoves = getValidMoves(boardState, player).length;
    const oppMoves = getValidMoves(boardState, opp).length;
    score += (myMoves - oppMoves) * 5;

    return score;
}

function minimax(boardState, depth, alpha, beta, maximizingPlayer, aiPlayer) {
    const opp = opponent(aiPlayer);
    const currentP = maximizingPlayer ? aiPlayer : opp;
    const moves = getValidMoves(boardState, currentP);

    if (depth === 0 || moves.length === 0) {
        // Check if opponent also has no moves (game over)
        if (moves.length === 0) {
            const oppMoves = getValidMoves(boardState, opponent(currentP));
            if (oppMoves.length === 0) {
                // Game over - evaluate final score
                const { black, white } = countPieces(boardState);
                const myCount = aiPlayer === BLACK ? black : white;
                const oppCount = aiPlayer === BLACK ? white : black;
                if (myCount > oppCount) return 10000 + myCount - oppCount;
                if (myCount < oppCount) return -10000 - oppCount + myCount;
                return 0;
            }
            // Pass turn - evaluate from opponent's perspective
            return minimax(boardState, depth, alpha, beta, !maximizingPlayer, aiPlayer);
        }
        return evaluateBoard(boardState, aiPlayer);
    }

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (const [r, c] of moves) {
            const { newBoard } = applyMove(boardState, r, c, currentP);
            const eval_ = minimax(newBoard, depth - 1, alpha, beta, false, aiPlayer);
            maxEval = Math.max(maxEval, eval_);
            alpha = Math.max(alpha, eval_);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const [r, c] of moves) {
            const { newBoard } = applyMove(boardState, r, c, currentP);
            const eval_ = minimax(newBoard, depth - 1, alpha, beta, true, aiPlayer);
            minEval = Math.min(minEval, eval_);
            beta = Math.min(beta, eval_);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function getAIMove(boardState, player) {
    const moves = getValidMoves(boardState, player);
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
        // Random move
        return moves[Math.floor(Math.random() * moves.length)];
    }

    const depth = difficulty === 'medium' ? 3 : 5;

    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const [r, c] of moves) {
        const { newBoard } = applyMove(boardState, r, c, player);
        const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false, player);
        if (score > bestScore) {
            bestScore = score;
            bestMove = [r, c];
        }
    }

    return bestMove;
}

// --- Rendering ---

function renderBoard() {
    boardEl.innerHTML = '';
    const validMoves = gameOver ? [] : getValidMoves(board, currentPlayer);

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;

            if (board[r][c] !== EMPTY) {
                const piece = document.createElement('div');
                piece.className = `piece ${board[r][c] === BLACK ? 'black' : 'white'}`;
                cell.appendChild(piece);
            }

            if (validMoves.some(([mr, mc]) => mr === r && mc === c)) {
                cell.classList.add('valid-move');
            }

            cell.addEventListener('click', () => handleCellClick(r, c));
            boardEl.appendChild(cell);
        }
    }

    updateScores();
    updateTurnIndicator();
}

function updateScores() {
    const { black, white } = countPieces(board);
    scoreBlackEl.textContent = black;
    scoreWhiteEl.textContent = white;
}

function updateTurnIndicator() {
    if (gameOver) {
        turnIndicatorEl.textContent = '終了';
        turnIndicatorEl.style.background = 'rgba(255, 213, 79, 0.2)';
        turnIndicatorEl.style.color = '#ffd54f';
    } else {
        const name = currentPlayer === BLACK ? '黒' : '白';
        turnIndicatorEl.textContent = `${name}の番`;
        turnIndicatorEl.style.background = 'rgba(76, 175, 80, 0.2)';
        turnIndicatorEl.style.color = '#81c784';
    }

    playerBlackEl.classList.toggle('active', !gameOver && currentPlayer === BLACK);
    playerWhiteEl.classList.toggle('active', !gameOver && currentPlayer === WHITE);
}

function animateFlips(flips, player, callback) {
    if (flips.length === 0) {
        callback();
        return;
    }

    const colorClass = player === BLACK ? 'black' : 'white';
    let completed = 0;

    flips.forEach(([r, c], i) => {
        const cellIndex = r * 8 + c;
        const piece = boardEl.children[cellIndex].querySelector('.piece');
        if (!piece) {
            completed++;
            if (completed === flips.length) callback();
            return;
        }

        setTimeout(() => {
            piece.classList.add('flipping');
            setTimeout(() => {
                piece.className = `piece ${colorClass}`;
                piece.classList.remove('flipping');
                completed++;
                if (completed === flips.length) callback();
            }, 200);
        }, i * 50);
    });
}

function handleCellClick(row, col) {
    if (gameOver || isProcessing) return;
    if (gameMode === 'pvc' && currentPlayer === WHITE) return;

    if (!isValidMove(board, row, col, currentPlayer)) return;

    makeMove(row, col);
}

function makeMove(row, col) {
    isProcessing = true;
    const { newBoard, flips } = applyMove(board, row, col, currentPlayer);

    // Place the piece
    board[row][col] = currentPlayer;
    renderBoard();

    // Animate flips
    animateFlips(flips, currentPlayer, () => {
        board = newBoard;
        renderBoard();
        currentPlayer = opponent(currentPlayer);

        // Check if next player has moves
        const nextMoves = getValidMoves(board, currentPlayer);
        if (nextMoves.length === 0) {
            // Check if the other player has moves
            const otherMoves = getValidMoves(board, opponent(currentPlayer));
            if (otherMoves.length === 0) {
                endGame();
                isProcessing = false;
                return;
            }
            // Pass
            const skippedName = currentPlayer === BLACK ? '黒' : '白';
            messageEl.textContent = `${skippedName}は置ける場所がありません。パスします。`;
            currentPlayer = opponent(currentPlayer);
            renderBoard();
        } else {
            messageEl.textContent = '';
        }

        isProcessing = false;

        // AI turn
        if (!gameOver && gameMode === 'pvc' && currentPlayer === WHITE) {
            setTimeout(doAIMove, 300);
        }
    });
}

function doAIMove() {
    if (gameOver || isProcessing) return;

    isProcessing = true;
    messageEl.textContent = 'CPUが考えています...';

    setTimeout(() => {
        const move = getAIMove(board, WHITE);
        if (move) {
            messageEl.textContent = '';
            const [r, c] = move;
            makeMove(r, c);
        } else {
            isProcessing = false;
        }
    }, 200);
}

function endGame() {
    gameOver = true;
    const { black, white } = countPieces(board);

    let result;
    if (black > white) {
        result = `黒の勝ち! (${black} - ${white})`;
    } else if (white > black) {
        result = `白の勝ち! (${white} - ${black})`;
    } else {
        result = `引き分け! (${black} - ${white})`;
    }

    messageEl.textContent = result;
    renderBoard();
}

function startGame() {
    initBoard();
    currentPlayer = BLACK;
    gameOver = false;
    isProcessing = false;
    messageEl.textContent = '';
    gameMode = gameModeEl.value;
    difficulty = difficultyEl.value;
    difficultyContainer.style.display = gameMode === 'pvc' ? 'flex' : 'none';
    renderBoard();
}

// Event listeners
restartBtn.addEventListener('click', startGame);
gameModeEl.addEventListener('change', startGame);
difficultyEl.addEventListener('change', () => {
    difficulty = difficultyEl.value;
    startGame();
});

// Start
startGame();
