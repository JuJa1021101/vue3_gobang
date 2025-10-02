import { ChessPieceType } from './game';

/**
 * 玩家接口
 */
export interface IPlayer {
  id: string;
  type: ChessPieceType;
  name: string;
  energy: number; // 当前能量
  maxEnergy: number; // 最大能量
  skills: ISkillInstance[];
  isSkillDisabled: boolean; // 是否被禁用技能
  disabledRounds: number; // 禁用回合数
}

/**
 * 能量变化记录接口
 */
export interface IEnergyChange {
  playerId: string;
  amount: number;
  reason: string;
  timestamp: number;
}
