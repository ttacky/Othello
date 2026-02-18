# CLAUDE.md — AI Assistant Guide for Othello

This file provides guidance for AI assistants (Claude Code and similar tools) working on this repository.

## Project Overview

**Othello** is a web-based implementation of the classic Othello (Reversi) board game, playable directly in a web browser. The project is built using standard web technologies (HTML, CSS, JavaScript) with no server-side component.

- **License:** Apache 2.0
- **Target platform:** Modern web browsers (desktop and mobile)

## Repository Structure

The repository is in early development. The intended layout once implemented:

```
Othello/
├── CLAUDE.md           # This file
├── README.md           # Project overview
├── LICENSE             # Apache 2.0 license
├── index.html          # Main entry point / game UI
├── css/
│   └── style.css       # Game styles and board layout
├── js/
│   ├── game.js         # Core game logic (rules, board state)
│   ├── ai.js           # AI opponent logic (if applicable)
│   └── ui.js           # DOM manipulation and event handling
└── tests/
    └── game.test.js    # Unit tests for game logic
```

## Game Rules Summary

Othello is played on an 8×8 grid. Two players take turns placing discs (black and white). A move is valid only if it flanks one or more of the opponent's discs in a straight line (horizontal, vertical, or diagonal). Flanked discs are flipped to the current player's color. The player with the most discs when the board is full (or no valid moves remain) wins.

Key rules to implement correctly:
- A move must flip at least one opponent disc to be valid
- If a player has no valid moves, their turn is skipped
- If neither player has valid moves, the game ends
- The starting position places two black and two white discs in the center in a diagonal pattern

## Development Workflow

### Running Locally

Since this is a pure frontend project, open `index.html` directly in a browser:

```bash
# Option 1: open in default browser
open index.html          # macOS
xdg-open index.html      # Linux

# Option 2: use a simple HTTP server to avoid any CORS issues
python3 -m http.server 8080
# then visit http://localhost:8080
```

### Testing

Unit tests for game logic should use a lightweight framework compatible with browser and Node.js environments (e.g., Jest or plain QUnit).

```bash
# If using Jest (once configured)
npm test

# Run a single test file
npx jest tests/game.test.js
```

### Linting and Formatting

Use ESLint for JavaScript and Prettier for formatting (once configured):

```bash
npx eslint js/
npx prettier --write js/ css/
```

## Code Conventions

### JavaScript

- Use **ES6+** syntax (const/let, arrow functions, template literals, classes, modules)
- Prefer `const` over `let`; avoid `var`
- Use **JSDoc** comments for all public functions
- Board state is represented as a **1D array of length 64** or a **2D 8×8 array** — pick one and be consistent throughout
- Cell values: `0` = empty, `1` = black, `2` = white (or use named constants)
- Keep game logic (rules, state) strictly separate from UI/DOM code

### HTML/CSS

- Semantic HTML5 elements
- Mobile-responsive layout using CSS Grid or Flexbox
- CSS custom properties (variables) for colors and sizing
- Avoid inline styles; keep all styling in `css/style.css`

### File Organization

- `game.js` must have **no DOM dependencies** — pure logic only — so it can be unit tested in Node.js
- `ui.js` imports from `game.js` and handles all browser interactions
- Use ES module syntax (`import`/`export`) if bundling, otherwise keep files self-contained with a clear dependency order in `index.html`

## Key Implementation Notes

### Board Representation

A recommended approach:

```javascript
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const BOARD_SIZE = 8;

// Initial board state
function createInitialBoard() {
  const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;
  return board;
}
```

### Move Validation

The `isValidMove(board, row, col, player)` function is critical. It must check all 8 directions from the target cell and confirm at least one opponent disc is flanked.

### State Management

Keep all mutable game state in a single object to make it easy to copy for AI look-ahead or undo functionality:

```javascript
const gameState = {
  board,          // 2D array
  currentPlayer,  // BLACK or WHITE
  scores,         // { [BLACK]: number, [WHITE]: number }
  gameOver,       // boolean
  winner,         // BLACK | WHITE | null (null = draw)
};
```

## AI Assistant Instructions

When working on this repository:

1. **Read this file and README.md first** before making any changes
2. **Keep `game.js` pure** — no `document`, `window`, or DOM references
3. **Test logic changes** by running the test suite before committing
4. **Commit often** with descriptive messages following this format:
   - `feat: add valid move highlighting`
   - `fix: correct diagonal flip detection`
   - `refactor: extract direction vectors to constant`
   - `test: add tests for edge board positions`
   - `style: apply prettier formatting`
5. **Do not break existing tests** — if you must change behavior, update tests to match and explain why
6. **Prefer simple solutions** — Othello logic is well-defined; avoid over-engineering
7. **Handle the "no valid moves" case** carefully — it is one of the most commonly missed edge cases

## Common Pitfalls

- Forgetting to check all 8 directions when computing valid moves
- Off-by-one errors in board boundary checks
- Not skipping a player's turn when they have no valid moves (instead of ending the game)
- Mutating board state directly instead of working on a copy (important for AI look-ahead)
- Mixing display logic into game logic functions

## Git Workflow

- Branch naming: `claude/<description>-<session-id>`
- All changes should be committed to the appropriate feature branch
- Write clear commit messages describing *what* changed and *why*
- Push with `git push -u origin <branch-name>`
