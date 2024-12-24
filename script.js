let rows = 10;
let cols = 10;
let minesCount = 20;
let gameBoard = [];
let gameOver = false;
let timerInterval = null;
let startTime = null;
let bestTime = null;
let flagsPlaced = 0;

function initializeGame() {
	const game = document.getElementById('game');
	const gridSizeInput = document.getElementById('gridSize');
	const mineCountInput = document.getElementById('mineCount');

	rows = cols = parseInt(gridSizeInput.value);
	minesCount = parseInt(mineCountInput.value);

	game.innerHTML = '';
	gameBoard = [];
	gameOver = false;
	clearInterval(timerInterval);
	document.getElementById('time').textContent = 'Temps : 0.00s';
	startTime = null;
	
	let flagsPlaced = 0;
	document.getElementById('flagCount').textContent = `Drapeaux : ${flagsPlaced}/${minesCount}`;

	game.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
	game.style.gridTemplateRows = `repeat(${rows}, 30px)`;

	for (let r = 0; r < rows; r++) {
		gameBoard[r] = [];
		for (let c = 0; c < cols; c++) {
			const cell = document.createElement('div');
			cell.classList.add('cell');
			cell.dataset.row = r;
			cell.dataset.col = c;
			cell.addEventListener('click', () => revealCell(r, c));
			cell.addEventListener('contextmenu', (e) => {
				e.preventDefault();
				toggleFlag(r, c);
			});
            cell.addEventListener('touchstart', (e) => {
                e.preventDefault();
                revealCell(r, c);
            });
			game.appendChild(cell);
			gameBoard[r][c] = { mine: false, revealed: false, flagged: false, element: cell, adjacentMines: 0 };
		}
	}

	placeMines();
	calculateAdjacentMines();
}

function startTimer() {
	if (startTime) return;
	startTime = Date.now();
	timerInterval = setInterval(() => {
		const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
		document.getElementById('time').textContent = `Temps : ${elapsed}s`;
	}, 10);
}

function stopTimer() {
	clearInterval(timerInterval);
	const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
	if (!bestTime || elapsed < bestTime) {
		bestTime = elapsed;
		document.getElementById('bestTime').textContent = `Meilleur temps : ${bestTime}s`;
	}
}

function placeMines() {
	let placedMines = 0;
	while (placedMines < minesCount) {
		const r = Math.floor(Math.random() * rows);
		const c = Math.floor(Math.random() * cols);
		if (!gameBoard[r][c].mine && !gameBoard[r][c].safe) {
			gameBoard[r][c].mine = true;
			placedMines++;
		}
	}
}

function calculateAdjacentMines() {
	const directions = [
		[-1,-1], [-1,0], [-1,1],
		[0, -1], 		 [0, 1],
		[1, -1], [1, 0], [1, 1]
	];

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (!gameBoard[r][c].mine) {
				let count = 0;
				for (const [dr, dc] of directions) {
					const nr = r + dr;
					const nc = c + dc;
					if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && gameBoard[nr][nc].mine) {
						count++;
					}
				}
				gameBoard[r][c].adjacentMines = count;
			}
		}
	}
}

function revealCell(row, col) {
	if (gameOver) return;

	if (!startTime) startTimer();

	const cell = gameBoard[row][col];
	if (cell.revealed || cell.flagged) return;

	cell.revealed = true;
	cell.element.classList.add('revealed');

	if (cell.adjacentMines > 0) {
		cell.element.textContent = cell.adjacentMines;
		cell.element.setAttribute('data-adjacent', cell.adjacentMines);
	}

	if (cell.mine) {
		cell.element.classList.add('mine');
		alert('Game Over!');
		gameOver = true;
		revealAllMines();
		clearInterval(timerInterval);
		return;
	}

	if (cell.adjacentMines > 0) {
		cell.element.textContent = cell.adjacentMines;
	} else {
		const directions = [
			[-1,-1], [-1,0], [-1,1],
			[0, -1], 		 [0, 1],
			[1, -1], [1, 0], [1, 1]
		];

		for (const [dr, dc] of directions) {
			const nr = row + dr;
			const nc = col + dc;
			if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
				revealCell(nr, nc);
			}
		}
	}

	checkWin();
}

function toggleFlag(row, col) {
	if (gameOver) return;

	const cell = gameBoard[row][col];
	if (cell.revealed) return;
	cell.flagged = !cell.flagged;
	cell.element.classList.toggle('flag');
	cell.element.textContent = cell.flagged ? '🚩' : '';
	
	flagsPlaced = cell.flagged ? flagsPlaced + 1 : flagsPlaced - 1;
	document.getElementById('flagCount').textContent = `Drapeaux : ${flagsPlaced}/${minesCount}`;
}

function revealAllMines() {
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const cell = gameBoard[r][c];
			if (cell.mine) {
				cell.revealed = true;
				cell.element.classList.add('revealed', 'mine');
			}
		}
	}
}

function checkWin() {
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const cell = gameBoard[r][c];
			if (!cell.mine && !cell.revealed) {
				return;
			}
		}
	}
	alert('Bravo, tu as gagné !');
	stopTimer();
	gameOver = true;
}

initializeGame();

function cheatGame() {
	if (gameOver) return;

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const cell = gameBoard[r][c];
			if (cell.mine && !cell.flagged) {
				toggleFlag(r, c);
			}
			if (!cell.mine && !cell.revealed) {
				revealCell(r, c);
			}
		}
	}
}

function solveGame() {
    if (gameOver) return;

    let revealed = 0;
    let flagged = 0;
    let lastFlaggedCount = flagsPlaced;

    function nextMove() {
        if (revealed >= (rows * cols - minesCount) || gameOver) {
            checkWin();
            return;
        }

        let madeMove = false;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = gameBoard[r][c];
                if (cell.revealed || cell.flagged) continue;
				
				if (cell.mine) {
					toggleFlag(r, c);
					flagged++;
				}

                if (cell.adjacentMines > 0 && !cell.mine && !cell.revealed) {
                    revealCell(r, c);
                    revealed++;
                    madeMove = true;
                    break;
                }

                if (cell.adjacentMines === 0 && !cell.mine && !cell.revealed) {
                    revealSafeNeighbors(r, c);
                    revealed++;
                    madeMove = true;
                    break;
                }
            }
            if (madeMove) break;
        }

        if (!madeMove) {
            let randomCellFound = false;
            while (!randomCellFound) {
                const r = Math.floor(Math.random() * rows);
                const c = Math.floor(Math.random() * cols);
                const cell = gameBoard[r][c];
                if (!cell.revealed && !cell.flagged) {
                    if (cell.mine) {
                        toggleFlag(r, c);
                        flagged++;
                    } else {
                        revealCell(r, c);
                        revealed++;
                    }
                    randomCellFound = true;
                }
            }
        }

        if (flagsPlaced > lastFlaggedCount) {
            lastFlaggedCount = flagsPlaced;
        }
		
        setTimeout(nextMove, 150);
    }
		
	let noMovesLeft = true;
	
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const cell = gameBoard[r][c];
			if (!cell.revealed && !cell.flagged) {
				noMovesLeft = false;
				break;
			}
		}
		if (!noMovesLeft) break;
	}

	if (noMovesLeft) {
		console.log("Aucun mouvement supplémentaire possible. Le jeu est bloqué.");
		checkWin();
		return;
	}
	else {
		nextMove();
	}
}

function revealSafeNeighbors(row, col) {
    const directions = [
        [-1,-1], [-1,0], [-1,1],
        [0, -1],          [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    const cell = gameBoard[row][col];
    for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const neighbor = gameBoard[nr][nc];
            if (!neighbor.revealed && !neighbor.flagged) {
                revealCell(nr, nc);
            }
        }
    }
}
