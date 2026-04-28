// ==========================================
// ESTADO DEL JUEGO Y VARIABLES GLOBALES
// ==========================================
const boardElement = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const restartBtn = document.getElementById('restart-btn');
const turnIndicator = document.getElementById('turn-indicator');
const nodesMinimaxEl = document.getElementById('nodes-minimax');
const nodesAlphaBetaEl = document.getElementById('nodes-alphabeta');

let board = Array(16).fill(null); // Tablero 4x4 vacío
let currentPlayer = 'X'; // Humano es 'X', IA es 'O'
let gameActive = true;
let nodesMinimax = 0;
let nodesAlphaBeta = 0;

// Todas las combinaciones ganadoras en un tablero 4x4
const winCombos = [
    [0,1,2,3], [4,5,6,7], [8,9,10,11], [12,13,14,15], // Filas
    [0,4,8,12], [1,5,9,13], [2,6,10,14], [3,7,11,15], // Columnas
    [0,5,10,15], [3,6,9,12]                           // Diagonales
];

// Índices del centro del tablero (para la heurística)
const centerIndices = [5, 6, 9, 10];

// ==========================================
// FUNCIONES DEL JUEGO BASE
// ==========================================

function checkWin(currentBoard) {
    for (let combo of winCombos) {
        const [a, b, c, d] = combo;
        if (currentBoard[a] && currentBoard[a] === currentBoard[b] && 
            currentBoard[a] === currentBoard[c] && currentBoard[a] === currentBoard[d]) {
            return currentBoard[a]; // Retorna 'X' o 'O'
        }
    }
    return currentBoard.includes(null) ? null : 'Tie'; // Retorna 'Tie' si es empate
}

function handleCellClick(e) {
    const index = e.target.getAttribute('data-index');
    
    // Validar jugada
    if (board[index] || !gameActive || currentPlayer !== 'X') return;

    // Jugada del Humano
    makeMove(index, 'X');
    
    if (gameActive) {
        currentPlayer = 'O';
        turnIndicator.innerHTML = "Turno actual: <strong>IA (O) pensando...</strong>";
        
        // Un pequeño timeout para que la UI se actualice antes de que la IA congele el hilo
        setTimeout(() => makeAIMove(), 50);
    }
}

function makeMove(index, player) {
    board[index] = player;
    cells[index].innerText = player;
    cells[index].classList.add(player.toLowerCase());
    
    let winner = checkWin(board);
    if (winner) {
        endGame(winner);
    }
}

function endGame(winner) {
    gameActive = false;
    if (winner === 'Tie') {
        turnIndicator.innerHTML = "<strong>¡Es un Empate!</strong>";
    } else {
        turnIndicator.innerHTML = `<strong>¡El ganador es ${winner === 'X' ? 'Humano' : 'Inteligencia Artificial'}!</strong>`;
    }
}

function restartGame() {
    board = Array(16).fill(null);
    gameActive = true;
    currentPlayer = 'X';
    nodesMinimax = 0;
    nodesAlphaBeta = 0;
    nodesMinimaxEl.innerText = "0";
    nodesAlphaBetaEl.innerText = "0";
    turnIndicator.innerHTML = "Turno actual: <strong>Humano (X)</strong>";
    
    cells.forEach(cell => {
        cell.innerText = '';
        cell.classList.remove('x', 'o');
    });
}

// ==========================================
// INTELIGENCIA ARTIFICIAL Y HEURÍSTICA
// ==========================================

// Función Heurística (Evalúa el tablero sin llegar al final)
function evaluateBoard(currentBoard) {
    let score = 0;

    // 1. Control del centro del tablero
    centerIndices.forEach(index => {
        if (currentBoard[index] === 'O') score += 5;
        else if (currentBoard[index] === 'X') score -= 5;
    });

    // 2 y 3. Evaluación de líneas abiertas y bloqueo
    winCombos.forEach(combo => {
        let aiCount = 0;
        let humanCount = 0;

        combo.forEach(index => {
            if (currentBoard[index] === 'O') aiCount++;
            else if (currentBoard[index] === 'X') humanCount++;
        });

        // Si la línea está abierta solo para la IA
        if (aiCount > 0 && humanCount === 0) {
            if (aiCount === 1) score += 2;
            if (aiCount === 2) score += 10;
            if (aiCount === 3) score += 50; // A un paso de ganar
        }
        
        // Si la línea está abierta solo para el Humano
        if (humanCount > 0 && aiCount === 0) {
            if (humanCount === 1) score -= 2;
            if (humanCount === 2) score -= 10;
            if (humanCount === 3) score -= 80; // ¡BLOQUEO URGENTE! Prioridad máxima
        }
    });

    return score;
}

// Minimax Clásico (Solo para contar nodos)
function minimax(currentBoard, depth, isMaximizing) {
    nodesMinimax++;
    let result = checkWin(currentBoard);
    
    if (result === 'O') return 1000 + depth;
    if (result === 'X') return -1000 - depth;
    if (result === 'Tie') return 0;
    if (depth === 0) return evaluateBoard(currentBoard);

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 16; i++) {
            if (!currentBoard[i]) {
                currentBoard[i] = 'O';
                let score = minimax(currentBoard, depth - 1, false);
                currentBoard[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 16; i++) {
            if (!currentBoard[i]) {
                currentBoard[i] = 'X';
                let score = minimax(currentBoard, depth - 1, true);
                currentBoard[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Minimax con Poda Alfa-Beta (El que realmente toma la decisión)
function minimaxAlphaBeta(currentBoard, depth, alpha, beta, isMaximizing) {
    nodesAlphaBeta++;
    let result = checkWin(currentBoard);
    
    if (result === 'O') return 1000 + depth;
    if (result === 'X') return -1000 - depth;
    if (result === 'Tie') return 0;
    if (depth === 0) return evaluateBoard(currentBoard);

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 16; i++) {
            if (!currentBoard[i]) {
                currentBoard[i] = 'O';
                let score = minimaxAlphaBeta(currentBoard, depth - 1, alpha, beta, false);
                currentBoard[i] = null;
                bestScore = Math.max(score, bestScore);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break; // Poda Beta
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 16; i++) {
            if (!currentBoard[i]) {
                currentBoard[i] = 'X';
                let score = minimaxAlphaBeta(currentBoard, depth - 1, alpha, beta, true);
                currentBoard[i] = null;
                bestScore = Math.min(score, bestScore);
                beta = Math.min(beta, score);
                if (beta <= alpha) break; // Poda Alfa
            }
        }
        return bestScore;
    }
}

// Orquestador del turno de la IA
function makeAIMove() {
    let bestScore = -Infinity;
    let move = -1;
    let searchDepth = 4; // Límite de profundidad establecido

    // Reiniciar contadores para este turno
    nodesMinimax = 0;
    nodesAlphaBeta = 0;

    // 1. Ejecutar Minimax Clásico (SIMULACIÓN para el contador)
    // Clonamos el tablero para no afectarlo. Solo lo hacemos para demostrar el peso algorítmico.
    for (let i = 0; i < 16; i++) {
        if (!board[i]) {
            let boardCopy = [...board];
            boardCopy[i] = 'O';
            minimax(boardCopy, searchDepth - 1, false);
        }
    }

    // 2. Ejecutar Minimax con Alfa-Beta (ACCIÓN REAL)
    for (let i = 0; i < 16; i++) {
        if (!board[i]) {
            board[i] = 'O';
            let score = minimaxAlphaBeta(board, searchDepth - 1, -Infinity, Infinity, false);
            board[i] = null;
            
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }

    // Actualizar Interfaz con los contadores de nodos
    nodesMinimaxEl.innerText = nodesMinimax.toLocaleString();
    nodesAlphaBetaEl.innerText = nodesAlphaBeta.toLocaleString();

    // Aplicar la jugada
    if (move !== -1) {
        makeMove(move, 'O');
    }

    if (gameActive) {
        currentPlayer = 'X';
        turnIndicator.innerHTML = "Turno actual: <strong>Humano (X)</strong>";
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartBtn.addEventListener('click', restartGame);