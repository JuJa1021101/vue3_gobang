import { SkillType, SkillRarity, ISkillConfig } from '@/types/skill';

/**
 * 技能配置映射
 */
export const SKILL_CONFIG_MAP: Record<SkillType, ISkillConfig> = {
  [SkillType.FLY_SAND]: {
    type: SkillType.FLY_SAND,
    name: '飞沙走石',
    description: '把对手的棋子扔进什刹海',
    energyCost: 80,
    rarity: SkillRarity.COMMON,
    cooldown: 3,
    maxUseCount: -1,
    icon: '🪨',
    color: '#FF6B6B',
  },
  [SkillType.PICK_GOLD]: {
    type: SkillType.PICK_GOLD,
    name: '拾金不昧',
    description: '从什刹海里捞一颗棋子',
    energyCost: 100,
    rarity: SkillRarity.COMMON,
    cooldown: 0,
    maxUseCount: 1,
    icon: '🎣',
    color: '#4ECDC4',
  },
  [SkillType.CLEAN_SERVICE]: {
    type: SkillType.CLEAN_SERVICE,
    name: '保洁上门儿',
    description: '随机扫除3-5颗棋子',
    energyCost: 120,
    rarity: SkillRarity.RARE,
    cooldown: 0,
    maxUseCount: -1,
    icon: '🧹',
    color: '#95E1D3',
  },
  [SkillType.FREEZE_WATER]: {
    type: SkillType.FREEZE_WATER,
    name: '静如止水',
    description: '速冻对手（跳过一回合）',
    energyCost: 150,
    rarity: SkillRarity.RARE,
    cooldown: 0,
    maxUseCount: 1,
    icon: '❄️',
    color: '#38B6FF',
  },
  [SkillType.MOUNTAIN_POWER]: {
    type: SkillType.MOUNTAIN_POWER,
    name: '力拔山兮',
    description: '清空整个棋盘',
    energyCost: 200,
    rarity: SkillRarity.LEGENDARY,
    cooldown: 0,
    maxUseCount: 1,
    icon: '⚡',
    color: '#FFD93D',
  },
};

/**
 * 技能列表
 */
export const SKILL_LIST = Object.values(SKILL_CONFIG_MAP);
