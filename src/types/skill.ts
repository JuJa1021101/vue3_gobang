/**
 * 技能类型枚举
 */
export enum SkillType {
  FLY_SAND = 'FLY_SAND', // 飞沙走石
  PICK_GOLD = 'PICK_GOLD', // 拾金不昧
  CLEAN_SERVICE = 'CLEAN_SERVICE', // 保洁上门儿
  FREEZE_WATER = 'FREEZE_WATER', // 静如止水
  MOUNTAIN_POWER = 'MOUNTAIN_POWER', // 力拔山兮
}

/**
 * 技能稀有度枚举
 */
export enum SkillRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY',
}

/**
 * 技能状态枚举
 */
export enum SkillStatus {
  LOCKED = 'LOCKED', // 锁定
  AVAILABLE = 'AVAILABLE', // 可用
  COOLING = 'COOLING', // 冷却中
  USED = 'USED', // 已使用
}

/**
 * 技能配置接口
 */
export interface ISkillConfig {
  type: SkillType;
  name: string;
  description: string;
  energyCost: number; // 能量消耗
  rarity: SkillRarity; // 稀有度
  cooldown: number; // 冷却回合数
  maxUseCount: number; // 最大使用次数（-1表示无限制）
  icon: string; // 图标
  color: string; // 颜色
}

/**
 * 技能实例接口
 */
export interface ISkillInstance {
  config: ISkillConfig;
  status: SkillStatus;
  currentCooldown: number; // 当前冷却
  useCount: number; // 已使用次数
}

/**
 * 技能效果接口
 */
export interface ISkillEffect {
  type: SkillType;
  targetPositions?: IPosition[]; // 受影响的位置
  animation: string; // 动画类型
  duration: number; // 持续时间(ms)
}
