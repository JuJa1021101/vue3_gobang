import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  IGameState,
  ChessPieceType,
  GamePhase,
  GameStatus,
  IPosition,
  IChessPiece,
} from '@/types/game';
import { GAME_CONFIG } from '@/constants/gameConfig';

export const useGameStore = defineStore('game', () => {
  const gameState = ref<IGameState>({
    boardSize: GAME_CONFIG.BOARD_SIZE,
    board: Array(GAME_CONFIG.BOARD_SIZE)
      .fill(null)
      .map(() => Array(GAME_CONFIG.BOARD_SIZE).fill(ChessPieceType.EMPTY)),
    currentPlayer: ChessPieceType.BLACK,
    round: 0,
    phase: GamePhase.OPENING,
    status: GameStatus.READY,
    winner: null,
    history: [],
    stalemateIndex: 0,
  });

  // 计算属性
  const currentPhase = computed(() => gameState.value.phase);
  const currentRound = computed(() => gameState.value.round);
  const isGameOver = computed(() => gameState.value.status === GameStatus.FINISHED);
  const boardFillRate = computed(() => {
    const total = gameState.value.boardSize * gameState.value.boardSize;
    const filled = gameState.value.history.length;
    return filled / total;
  });

  /**
   * 初始化游戏
   */
  const initGame = (): void => {
    gameState.value = {
      boardSize: GAME_CONFIG.BOARD_SIZE,
      board: Array(GAME_CONFIG.BOARD_SIZE)
        .fill(null)
        .map(() => Array(GAME_CONFIG.BOARD_SIZE).fill(ChessPieceType.EMPTY)),
      currentPlayer: ChessPieceType.BLACK,
      round: 0,
      phase: GamePhase.OPENING,
      status: GameStatus.PLAYING,
      winner: null,
      history: [],
      stalemateIndex: 0,
    };
  };

  /**
   * 落子
   */
  const placePiece = (position: IPosition): boolean => {
    const { row, col } = position;
    if (
      row < 0 ||
      row >= gameState.value.boardSize ||
      col < 0 ||
      col >= gameState.value.boardSize
    ) {
      return false;
    }

    if (gameState.value.board[row][col] !== ChessPieceType.EMPTY) {
      return false;
    }

    // 放置棋子
    gameState.value.board[row][col] = gameState.value.currentPlayer;

    // 记录历史
    const piece: IChessPiece = {
      type: gameState.value.currentPlayer,
      position,
      round: gameState.value.round,
    };
    gameState.value.history.push(piece);

    return true;
  };

  /**
   * 移除棋子
   */
  const removePiece = (position: IPosition): boolean => {
    const { row, col } = position;
    if (gameState.value.board[row][col] === ChessPieceType.EMPTY) {
      return false;
    }

    gameState.value.board[row][col] = ChessPieceType.EMPTY;
    // 从历史中移除
    gameState.value.history = gameState.value.history.filter(
      (p) => p.position.row !== row || p.position.col !== col
    );

    return true;
  };

  /**
   * 切换玩家
   */
  const switchPlayer = (): void => {
    gameState.value.currentPlayer =
      gameState.value.currentPlayer === ChessPieceType.BLACK
        ? ChessPieceType.WHITE
        : ChessPieceType.BLACK;
    gameState.value.round++;

    // 更新游戏阶段
    updateGamePhase();
  };

  /**
   * 更新游戏阶段
   */
  const updateGamePhase = (): void => {
    const round = gameState.value.round;
    if (round <= GAME_CONFIG.PHASE_ROUNDS[GamePhase.OPENING]) {
      gameState.value.phase = GamePhase.OPENING;
    } else if (round <= GAME_CONFIG.PHASE_ROUNDS[GamePhase.MIDDLE]) {
      gameState.value.phase = GamePhase.MIDDLE;
    } else {
      gameState.value.phase = GamePhase.STALEMATE;
    }

    // 更新僵持指数
    updateStalemateIndex();
  };

  /**
   * 更新僵持指数
   */
  const updateStalemateIndex = (): void => {
    const fillRate = boardFillRate.value;
    const threshold = GAME_CONFIG.STALEMATE_THRESHOLD.BOARD_FILL_RATE;
    gameState.value.stalemateIndex = Math.min(100, (fillRate / threshold) * 100);
  };

  /**
   * 检查胜利
   */
  const checkWin = (position: IPosition): boolean => {
    const { row, col } = position;
    const player = gameState.value.board[row][col];
    const directions = [
      [0, 1], // 横
      [1, 0], // 竖
      [1, 1], // 斜 \
      [1, -1], // 斜 /
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      // 正方向
      for (let i = 1; i < GAME_CONFIG.WIN_COUNT; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (
          newRow < 0 ||
          newRow >= gameState.value.boardSize ||
          newCol < 0 ||
          newCol >= gameState.value.boardSize ||
          gameState.value.board[newRow][newCol] !== player
        ) {
          break;
        }
        count++;
      }

      // 反方向
      for (let i = 1; i < GAME_CONFIG.WIN_COUNT; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (
          newRow < 0 ||
          newRow >= gameState.value.boardSize ||
          newCol < 0 ||
          newCol >= gameState.value.boardSize ||
          gameState.value.board[newRow][newCol] !== player
        ) {
          break;
        }
        count++;
      }

      if (count >= GAME_CONFIG.WIN_COUNT) {
        gameState.value.winner = player;
        gameState.value.status = GameStatus.FINISHED;
        return true;
      }
    }

    return false;
  };

  /**
   * 清空棋盘
   */
  const clearBoard = (): void => {
    gameState.value.board = Array(GAME_CONFIG.BOARD_SIZE)
      .fill(null)
      .map(() => Array(GAME_CONFIG.BOARD_SIZE).fill(ChessPieceType.EMPTY));
    gameState.value.history = [];
  };

  /**
   * 重新开始
   */
  const restartGame = (): void => {
    initGame();
  };

  return {
    // 状态
    gameState,
    currentPhase,
    currentRound,
    isGameOver,
    boardFillRate,

    // 方法
    initGame,
    placePiece,
    removePiece,
    switchPlayer,
    checkWin,
    clearBoard,
    restartGame,
  };
});
