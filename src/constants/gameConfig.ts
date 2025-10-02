import { GamePhase } from '@/types/game';

/**
 * 游戏配置常量
 */
export const GAME_CONFIG = {
  // 棋盘配置
  BOARD_SIZE: 15,
  WIN_COUNT: 5, // 获胜连珠数

  // 阶段配置
  PHASE_ROUNDS: {
    [GamePhase.OPENING]: 10, // 开局期回合数
    [GamePhase.MIDDLE]: 25, // 中局期回合数
  },

  // 僵局判定
  STALEMATE_THRESHOLD: {
    BOARD_FILL_RATE: 0.6, // 棋盘填充率
    NO_CHAIN_ROUNDS: 8, // 无新连珠回合数
  },

  // 能量配置
  ENERGY: {
    PER_MOVE: 10, // 每步基础能量
    CHAIN_2: 15, // 2连奖励
    CHAIN_3: 25, // 3连奖励
    CHAIN_ALIVE: 40, // 活连奖励
    BLOCK_OPPONENT: 20, // 阻断对手奖励
    STALEMATE_BONUS: 50, // 僵局奖励
    FILL_RATE_BONUS: 30, // 高填充率奖励
    LOSING_BONUS: 1.3, // 劣势方能量加成
  },

  // 福运箱配置
  FORTUNE_BOX: {
    INTERVAL: 12, // 间隔回合
    ENERGY_RANGE: [50, 80], // 能量范围
    LOSING_PROBABILITY_BONUS: 0.3, // 劣势方概率加成
  },
} as const;
