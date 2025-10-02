import { ChessPieceType, IPosition, IChainInfo } from '@/types/game';

export const ChessUtil = {
  /**
   * 检查给定位置是否在棋盘内
   */
  isValidPosition(row: number, col: number, boardSize: number): boolean {
    return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
  },

  /**
   * 获取指定位置的棋子类型
   */
  getPieceType(board: ChessPieceType[][], position: IPosition): ChessPieceType {
    if (!this.isValidPosition(position.row, position.col, board.length)) {
      return ChessPieceType.EMPTY; // 或者抛出错误，取决于需求
    }
    return board[position.row][position.col];
  },

  /**
   * 查找棋盘上所有指定类型的棋子位置
   */
  findAllPieces(board: ChessPieceType[][], type: ChessPieceType): IPosition[] {
    const positions: IPosition[] = [];
    const boardSize = board.length;
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === type) {
          positions.push({ row, col });
        }
      }
    }
    return positions;
  },

  /**
   * 随机获取一个空闲位置
   */
  getRandomEmptyPosition(board: ChessPieceType[][]): IPosition | null {
    const emptyPositions: IPosition[] = [];
    const boardSize = board.length;
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === ChessPieceType.EMPTY) {
          emptyPositions.push({ row, col });
        }
      }
    }
    if (emptyPositions.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * emptyPositions.length);
    return emptyPositions[randomIndex];
  },

  /**
   * 计算两个位置之间的曼哈顿距离
   */
  getManhattanDistance(pos1: IPosition, pos2: IPosition): number {
    return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
  },

  /**
   * 获取连珠信息
   */
  getChainInfo(board: ChessPieceType[][], position: IPosition, player: ChessPieceType): IChainInfo {
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
