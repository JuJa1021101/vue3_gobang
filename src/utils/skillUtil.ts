import { ChessPieceType, IPosition } from '@/types/game';
import { ISkillInstance, SkillStatus } from '@/types/skill';
import { ChessUtil } from './chessUtil';

export const SkillUtil = {
  /**
   * 判断技能是否可用
   */
  canUseSkill(
    skill: ISkillInstance,
    playerEnergy: number,
    isPlayerSkillDisabled: boolean
  ): boolean {
    if (isPlayerSkillDisabled) {
      return false;
    }
    if (skill.status === SkillStatus.COOLING || skill.status === SkillStatus.USED) {
      return false;
    }
    if (playerEnergy < skill.config.energyCost) {
      return false;
    }
    return true;
  },

  /**
   * 获取飞沙走石技能的最佳目标位置（移除对手非关键棋子）
   */
  getBestFlySandTarget(board: ChessPieceType[][], opponentType: ChessPieceType): IPosition | null {
    const opponentPieces = ChessUtil.findAllPieces(board, opponentType);
    // 过滤掉关键棋子（3连以上）
    const nonKeyOpponentPieces = opponentPieces.filter(pos => {
      const chainInfo = ChessUtil.getChainInfo(board, pos, opponentType); // 假设ChessUtil有getChainInfo方法
      return chainInfo.count < 3;
    });

    if (nonKeyOpponentPieces.length === 0) {
      return null;
    }

    // 优先选择边缘的非关键棋子
    const boardSize = board.length;
    const edgePieces = nonKeyOpponentPieces.filter(pos => {
      const isEdge = pos.row <= 1 || pos.row >= boardSize - 2 || pos.col <= 1 || pos.col >= boardSize - 2;
      return isEdge;
    });

    if (edgePieces.length > 0) {
      return edgePieces[Math.floor(Math.random() * edgePieces.length)];
    }

    // 否则随机选择一个非关键棋子
    return nonKeyOpponentPieces[Math.floor(Math.random() * nonKeyOpponentPieces.length)];
  },

  /**
   * 获取拾金不昧技能的最佳落子位置（在己方棋子附近）
   */
  getBestPickGoldPosition(board: ChessPieceType[][], playerType: ChessPieceType): IPosition | null {
    const playerPieces = ChessUtil.findAllPieces(board, playerType);
    const emptyPositions = ChessUtil.findAllPieces(board, ChessPieceType.EMPTY);

    if (playerPieces.length === 0 || emptyPositions.length === 0) {
      return ChessUtil.getRandomEmptyPosition(board);
    }

    // 寻找距离己方棋子最近的空位
    let bestPosition: IPosition | null = null;
    let minDistance = Infinity;

    for (const emptyPos of emptyPositions) {
      for (const playerPos of playerPieces) {
        const dist = ChessUtil.getManhattanDistance(emptyPos, playerPos);
        if (dist < minDistance) {
          minDistance = dist;
          bestPosition = emptyPos;
        }
      }
    }
    return bestPosition;
  },

  /**
   * 获取保洁上门儿技能的随机清除位置
   */
  getCleanServiceTargets(board: ChessPieceType[][]): IPosition[] {
    const allPieces: IPosition[] = [];
    const boardSize = board.length;

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] !== ChessPieceType.EMPTY) {
          // 排除关键棋子（3连以上）
          const chainInfo = ChessUtil.getChainInfo(board, { row, col }, board[row][col]); // 假设ChessUtil有getChainInfo方法
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
  },

  // 辅助函数：获取连珠信息 (这里需要从 gameLogic 复制过来，或者在 ChessUtil 中实现)
  getChainInfo(board: ChessPieceType[][], position: IPosition, player: ChessPieceType): { count: number; isAlive: boolean; positions: IPosition[] } {
    const { row, col } = position;
    const boardSize = board.length;
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
  },
};
