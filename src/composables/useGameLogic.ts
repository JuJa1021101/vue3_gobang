import { computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { useSkillStore } from '@/stores/skillStore';
import { IPosition, ChessPieceType, IChainInfo } from '@/types/game';
import { GAME_CONFIG } from '@/constants/gameConfig';

/**
 * 游戏逻辑组合式函数
 */
export const useGameLogic = () => {
  const gameStore = useGameStore();
  const skillStore = useSkillStore();

  /**
   * 执行落子操作
   */
  const makeMove = (position: IPosition): boolean => {
    // 检查游戏状态
    if (gameStore.isGameOver) {
      return false;
    }

    // 检查位置是否有效
    if (!isValidPosition(position)) {
      return false;
    }

    // 放置棋子
    if (!gameStore.placePiece(position)) {
      return false;
    }

    // 检查胜利
    if (gameStore.checkWin(position)) {
      return true;
    }

    // 计算能量奖励
    calculateEnergyReward(position);

    // 切换玩家
    gameStore.switchPlayer();

    // 更新技能冷却
    skillStore.updateCooldown(gameStore.gameState.currentPlayer);

    return true;
  };

  /**
   * 检查位置是否有效
   */
  const isValidPosition = (position: IPosition): boolean => {
    const { row, col } = position;
    const { boardSize, board } = gameStore.gameState;

    return (
      row >= 0 &&
      row < boardSize &&
      col >= 0 &&
      col < boardSize &&
      board[row][col] === ChessPieceType.EMPTY
    );
  };

  /**
   * 计算能量奖励
   */
  const calculateEnergyReward = (position: IPosition): void => {
    const currentPlayer = gameStore.gameState.currentPlayer;
    let totalReward = GAME_CONFIG.ENERGY.PER_MOVE;

    // 检查连珠奖励
    const chainInfo = getChainInfo(position, currentPlayer);
    if (chainInfo.count >= 2) {
      if (chainInfo.count === 2) {
        totalReward += GAME_CONFIG.ENERGY.CHAIN_2;
      } else if (chainInfo.count === 3) {
        totalReward += GAME_CONFIG.ENERGY.CHAIN_3;
      }

      // 活连奖励
      if (chainInfo.isAlive) {
        totalReward += GAME_CONFIG.ENERGY.CHAIN_ALIVE;
      }
    }

    // 检查是否阻断对手
    if (checkBlockOpponent(position)) {
      totalReward += GAME_CONFIG.ENERGY.BLOCK_OPPONENT;
    }

    // 僵局奖励
    if (gameStore.gameState.stalemateIndex >= 60) {
      totalReward += GAME_CONFIG.ENERGY.STALEMATE_BONUS;
    }

    // 劣势方加成
    const opponent = currentPlayer === ChessPieceType.BLACK ? ChessPieceType.WHITE : ChessPieceType.BLACK;
    const currentPlayerEnergy = skillStore.getPlayer(currentPlayer).energy;
    const opponentEnergy = skillStore.getPlayer(opponent).energy;

    if (currentPlayerEnergy < opponentEnergy) {
      totalReward = Math.floor(totalReward * GAME_CONFIG.ENERGY.LOSING_BONUS);
    }

    // 添加能量
    skillStore.addEnergy(currentPlayer, totalReward, '落子奖励');
  };

  /**
   * 获取连珠信息
   */
  const getChainInfo = (position: IPosition, player: ChessPieceType): IChainInfo => {
    const { row, col } = position;
    const { board, boardSize } = gameStore.gameState;
    const directions = [
      [0, 1], // 横
      [1, 0], // 竖
      [1, 1], // 斜 \
      [1, -1], // 斜 /
    ];

    let maxCount = 1;
    let maxIsAlive = false;
    let maxPositions: IPosition[] = [position];

    for (const [dx, dy] of directions) {
      let count = 1;
      const positions: IPosition[] = [position];
      let leftBlocked = false;
      let rightBlocked = false;

      // 正方向
      for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;

        if (newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize) {
          rightBlocked = true;
          break;
        }

        if (board[newRow][newCol] === player) {
          count++;
          positions.push({ row: newRow, col: newCol });
        } else if (board[newRow][newCol] !== ChessPieceType.EMPTY) {
          rightBlocked = true;
          break;
        } else {
          break;
        }
      }

      // 反方向
      for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;

        if (newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize) {
          leftBlocked = true;
          break;
        }

        if (board[newRow][newCol] === player) {
          count++;
          positions.unshift({ row: newRow, col: newCol });
        } else if (board[newRow][newCol] !== ChessPieceType.EMPTY) {
          leftBlocked = true;
          break;
        } else {
          break;
        }
      }

      if (count > maxCount) {
        maxCount = count;
        maxIsAlive = !leftBlocked && !rightBlocked;
        maxPositions = positions;
      }
    }

    return {
      count: maxCount,
      isAlive: maxIsAlive,
      positions: maxPositions,
    };
  };

  /**
   * 检查是否阻断对手
   */
  const checkBlockOpponent = (position: IPosition): boolean => {
    const opponent = gameStore.gameState.currentPlayer === ChessPieceType.BLACK 
      ? ChessPieceType.WHITE 
      : ChessPieceType.BLACK;

    // 临时移除当前棋子，检查对手在此位置的连珠情况
    const originalPiece = gameStore.gameState.board[position.row][position.col];
    gameStore.gameState.board[position.row][position.col] = ChessPieceType.EMPTY;

    const opponentChainInfo = getChainInfo(position, opponent);
    
    // 恢复棋子
    gameStore.gameState.board[position.row][position.col] = originalPiece;

    // 如果对手在此位置能形成3连或以上，则认为是阻断
    return opponentChainInfo.count >= 3;
  };

  /**
   * 获取可落子位置
   */
  const getAvailablePositions = (): IPosition[] => {
    const positions: IPosition[] = [];
    const { board, boardSize } = gameStore.gameState;

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === ChessPieceType.EMPTY) {
          positions.push({ row, col });
        }
      }
    }

    return positions;
  };

  /**
   * 获取边缘位置（用于飞沙走石技能）
   */
  const getEdgePositions = (player: ChessPieceType): IPosition[] => {
    const positions: IPosition[] = [];
    const { board, boardSize } = gameStore.gameState;

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === player) {
          // 检查是否在边缘区域（距离边缘2格内）
          const isEdge = row <= 1 || row >= boardSize - 2 || col <= 1 || col >= boardSize - 2;
          
          // 检查是否为关键棋子（3连以上）
          const chainInfo = getChainInfo({ row, col }, player);
          const isKey = chainInfo.count >= 3;

          if (isEdge && !isKey) {
            positions.push({ row, col });
          }
        }
      }
    }

    return positions;
  };

  /**
   * 获取随机清除位置（用于保洁上门儿技能）
   */
  const getRandomCleanPositions = (): IPosition[] => {
    const allPieces: IPosition[] = [];
    const { board, boardSize } = gameStore.gameState;

    // 收集所有非关键棋子
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] !== ChessPieceType.EMPTY) {
          const chainInfo = getChainInfo({ row, col }, board[row][col]);
          if (chainInfo.count < 3) {
            allPieces.push({ row, col });
          }
        }
      }
    }

    // 随机选择3-5个位置
    const count = Math.floor(Math.random() * 3) + 3; // 3-5
    const selectedPositions: IPosition[] = [];

    for (let i = 0; i < Math.min(count, allPieces.length); i++) {
      const randomIndex = Math.floor(Math.random() * allPieces.length);
      selectedPositions.push(allPieces.splice(randomIndex, 1)[0]);
    }

    return selectedPositions;
  };

  /**
   * 检查力拔山兮技能是否可用
   */
  const canUseMountainPower = (): boolean => {
    const blackPieces = gameStore.gameState.history.filter(p => p.type === ChessPieceType.BLACK).length;
    const whitePieces = gameStore.gameState.history.filter(p => p.type === ChessPieceType.WHITE).length;
    
    return Math.abs(blackPieces - whitePieces) <= 2;
  };

  /**
   * 重新开始游戏
   */
  const restartGame = (): void => {
    gameStore.restartGame();
    skillStore.resetSkills();
  };

  return {
    // 核心方法
    makeMove,
    isValidPosition,
    restartGame,

    // 工具方法
    getChainInfo,
    getAvailablePositions,
    getEdgePositions,
    getRandomCleanPositions,
    canUseMountainPower,

    // 计算属性
    currentPlayer: computed(() => gameStore.gameState.currentPlayer),
    gamePhase: computed(() => gameStore.gameState.phase),
    isGameOver: computed(() => gameStore.isGameOver),
    winner: computed(() => gameStore.gameState.winner),
  };
};
