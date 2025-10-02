/**
 * 棋子类型枚举
 */
export enum ChessPieceType {
  EMPTY = 0,
  BLACK = 1,
  WHITE = 2,
}

/**
 * 游戏阶段枚举
 */
export enum GamePhase {
  OPENING = 'OPENING', // 开局期
  MIDDLE = 'MIDDLE', // 中局期
  STALEMATE = 'STALEMATE', // 僵持期
}

/**
 * 游戏状态枚举
 */
export enum GameStatus {
  READY = 'READY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
}

/**
 * 坐标接口
 */
export interface IPosition {
  row: number;
  col: number;
}

/**
 * 棋子接口
 */
export interface IChessPiece {
  type: ChessPieceType;
  position: IPosition;
  round: number; // 第几回合落子
  isKey?: boolean; // 是否为关键棋子（3连以上）
}

/**
 * 游戏状态接口
 */
export interface IGameState {
  boardSize: number; // 棋盘大小
  board: ChessPieceType[][]; // 棋盘状态
  currentPlayer: ChessPieceType; // 当前玩家
  round: number; // 当前回合
  phase: GamePhase; // 游戏阶段
  status: GameStatus; // 游戏状态
  winner: ChessPieceType | null; // 获胜者
  history: IChessPiece[]; // 历史记录
  stalemateIndex: number; // 僵持指数 (0-100)
}

/**
 * 连珠信息接口
 */
export interface IChainInfo {
  count: number; // 连珠数量
  isAlive: boolean; // 是否活连（两端都没被堵）
  positions: IPosition[]; // 连珠位置
}
