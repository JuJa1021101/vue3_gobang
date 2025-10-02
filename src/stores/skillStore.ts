import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { IPlayer, IEnergyChange } from '@/types/player';
import { ChessPieceType } from '@/types/game';
import { ISkillInstance, SkillStatus, SkillType } from '@/types/skill';
import { SKILL_CONFIG_MAP } from '@/constants/skillConfig';
import { GAME_CONFIG } from '@/constants/gameConfig';

export const useSkillStore = defineStore('skill', () => {
  // 玩家状态
  const blackPlayer = ref<IPlayer>({
    id: 'black',
    type: ChessPieceType.BLACK,
    name: '黑方',
    energy: 0,
    maxEnergy: 200,
    skills: [],
    isSkillDisabled: false,
    disabledRounds: 0,
  });

  const whitePlayer = ref<IPlayer>({
    id: 'white',
    type: ChessPieceType.WHITE,
    name: '白方',
    energy: 0,
    maxEnergy: 200,
    skills: [],
    isSkillDisabled: false,
    disabledRounds: 0,
  });

  // 能量变化记录
  const energyHistory = ref<IEnergyChange[]>([]);

  // 计算属性
  const currentPlayerSkills = computed(() => {
    return (playerType: ChessPieceType) => {
      const player = playerType === ChessPieceType.BLACK ? blackPlayer.value : whitePlayer.value;
      return player.skills;
    };
  });

  /**
   * 初始化技能系统
   */
  const initSkills = (): void => {
    const initPlayerSkills = (): ISkillInstance[] => {
      return Object.values(SkillType).map((type) => ({
        config: SKILL_CONFIG_MAP[type],
        status: SkillStatus.LOCKED,
        currentCooldown: 0,
        useCount: 0,
      }));
    };

    blackPlayer.value.skills = initPlayerSkills();
    whitePlayer.value.skills = initPlayerSkills();
    blackPlayer.value.energy = 0;
    whitePlayer.value.energy = 0;
    energyHistory.value = [];
  };

  /**
   * 获取玩家
   */
  const getPlayer = (playerType: ChessPieceType): IPlayer => {
    return playerType === ChessPieceType.BLACK ? blackPlayer.value : whitePlayer.value;
  };

  /**
   * 增加能量
   */
  const addEnergy = (playerType: ChessPieceType, amount: number, reason: string): void => {
    const player = getPlayer(playerType);
    player.energy = Math.min(player.maxEnergy, player.energy + amount);

    // 记录变化
    energyHistory.value.push({
      playerId: player.id,
      amount,
      reason,
      timestamp: Date.now(),
    });

    // 更新技能状态
    updateSkillStatus(playerType);
  };

  /**
   * 消耗能量
   */
  const consumeEnergy = (playerType: ChessPieceType, amount: number): boolean => {
    const player = getPlayer(playerType);
    if (player.energy < amount) {
      return false;
    }

    player.energy -= amount;
    updateSkillStatus(playerType);
    return true;
  };

  /**
   * 更新技能状态
   */
  const updateSkillStatus = (playerType: ChessPieceType): void => {
    const player = getPlayer(playerType);

    player.skills.forEach((skill) => {
      // 冷却中
      if (skill.currentCooldown > 0) {
        skill.status = SkillStatus.COOLING;
        return;
      }

      // 已达最大使用次数
      if (skill.config.maxUseCount !== -1 && skill.useCount >= skill.config.maxUseCount) {
        skill.status = SkillStatus.USED;
        return;
      }

      // 能量足够
      if (player.energy >= skill.config.energyCost) {
        skill.status = SkillStatus.AVAILABLE;
      } else {
        skill.status = SkillStatus.LOCKED;
      }
    });
  };

  /**
   * 使用技能
   */
  const useSkill = (playerType: ChessPieceType, skillType: SkillType): boolean => {
    const player = getPlayer(playerType);
    const skill = player.skills.find((s) => s.config.type === skillType);

    if (!skill || skill.status !== SkillStatus.AVAILABLE) {
      return false;
    }

    // 消耗能量
    if (!consumeEnergy(playerType, skill.config.energyCost)) {
      return false;
    }

    // 更新技能状态
    skill.useCount++;
    skill.currentCooldown = skill.config.cooldown;

    // 特殊处理：静如止水技能
    if (skillType === SkillType.FREEZE_WATER) {
      const opponent = getPlayer(
        playerType === ChessPieceType.BLACK ? ChessPieceType.WHITE : ChessPieceType.BLACK
      );
      opponent.isSkillDisabled = true;
      opponent.disabledRounds = 1;

      // 自己下回合也不能用技能
      player.isSkillDisabled = true;
      player.disabledRounds = 1;
    }

    updateSkillStatus(playerType);
    return true;
  };

  /**
   * 更新冷却
   */
  const updateCooldown = (playerType: ChessPieceType): void => {
    const player = getPlayer(playerType);

    player.skills.forEach((skill) => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--;
      }
    });

    // 更新禁用状态
    if (player.disabledRounds > 0) {
      player.disabledRounds--;
      if (player.disabledRounds === 0) {
        player.isSkillDisabled = false;
      }
    }

    updateSkillStatus(playerType);
  };

  /**
   * 重置技能系统
   */
  const resetSkills = (): void => {
    initSkills();
  };

  return {
    // 状态
    blackPlayer,
    whitePlayer,
    energyHistory,
    currentPlayerSkills,

    // 方法
    initSkills,
    getPlayer,
    addEnergy,
    consumeEnergy,
    useSkill,
    updateCooldown,
    resetSkills,
  };
});
