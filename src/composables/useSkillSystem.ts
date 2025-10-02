import { ref, computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { useSkillStore } from '@/stores/skillStore';
import { IPosition, ChessPieceType } from '@/types/game';
import { SkillType, ISkillInstance, ISkillEffect } from '@/types/skill';
import { ChessUtil } from '@/utils/chessUtil';
import { SkillUtil } from '@/utils/skillUtil';

/**
 * 技能系统组合式函数
 */
export const useSkillSystem = () => {
  const gameStore = useGameStore();
  const skillStore = useSkillStore();

  // 响应式状态
  const isSkillEffectActive = ref(false);
  const currentSkillEffect = ref<ISkillEffect | null>(null);

  // 计算属性
  const currentPlayer = computed(() => gameStore.gameState.currentPlayer);
  const currentPlayerSkills = computed(() => skillStore.currentPlayerSkills(currentPlayer.value));
  const isCurrentPlayerSkillDisabled = computed(() => skillStore.getPlayer(currentPlayer.value).isSkillDisabled);

  /**
   * 使用技能
   */
  const activateSkill = async (skillType: SkillType, targetPosition?: IPosition): Promise<boolean> => {
    const player = currentPlayer.value;
    const playerState = skillStore.getPlayer(player);
    const skill = playerState.skills.find(s => s.config.type === skillType);

    if (!skill || !SkillUtil.canUseSkill(skill, playerState.energy, playerState.isSkillDisabled)) {
      console.warn(`技能 ${skillType} 无法使用：能量不足、冷却中或已禁用。`);
      return false;
    }

    // 消耗能量并更新技能状态
    if (!skillStore.consumeEnergy(player, skill.config.energyCost)) {
      console.error(`消耗能量失败，技能 ${skillType} 无法使用。`);
      return false;
    }
    skill.useCount++;
    skill.currentCooldown = skill.config.cooldown;
    skillStore.updateSkillStatus(player);

    // 执行技能效果
    let effectPositions: IPosition[] = [];
    let effectDuration = 1500; // 默认动画时长

    switch (skillType) {
      case SkillType.FLY_SAND: {
        // 飞沙走石：移除对手棋子
        const opponent = player === ChessPieceType.BLACK ? ChessPieceType.WHITE : ChessPieceType.BLACK;
        const target = targetPosition || SkillUtil.getBestFlySandTarget(gameStore.gameState.board, opponent);
        if (target && gameStore.removePiece(target)) {
          effectPositions.push(target);
          console.log(`${player === ChessPieceType.BLACK ? '黑方' : '白方'} 使用飞沙走石，移除了对手在 (${target.row}, ${target.col}) 的棋子。`);
        } else {
          console.warn('飞沙走石未能找到有效目标或移除失败。');
          // 如果技能未生效，返还能量和使用次数
          skillStore.addEnergy(player, skill.config.energyCost, '技能未生效返还');
          skill.useCount--;
          skill.currentCooldown = 0;
          skillStore.updateSkillStatus(player);
          return false;
        }
        effectDuration = 2000;
        break;
      }
      case SkillType.PICK_GOLD: {
        // 拾金不昧：额外落子机会
        const target = targetPosition || SkillUtil.getBestPickGoldPosition(gameStore.gameState.board, player);
        if (target && gameStore.placePiece(target)) {
          effectPositions.push(target);
          console.log(`${player === ChessPieceType.BLACK ? '黑方' : '白方'} 使用拾金不昧，在 (${target.row}, ${target.col}) 额外落子。`);
          // 额外落子不切换玩家，但需要检查胜利
          if (gameStore.checkWin(target)) {
            // 游戏结束，不需要切换玩家
          } else {
            // 额外落子后，能量奖励和冷却更新在makeMove中处理，这里不需要重复
            // 只是为了视觉效果，不触发回合结束逻辑
          }
        } else {
          console.warn('拾金不昧未能找到有效目标或落子失败。');
          skillStore.addEnergy(player, skill.config.energyCost, '技能未生效返还');
          skill.useCount--;
          skill.currentCooldown = 0;
          skillStore.updateSkillStatus(player);
          return false;
        }
        effectDuration = 1500;
        break;
      }
      case SkillType.CLEAN_SERVICE: {
        // 保洁上门儿：随机清除棋子
        const targets = SkillUtil.getCleanServiceTargets(gameStore.gameState.board);
        if (targets.length > 0) {
          targets.forEach(pos => gameStore.removePiece(pos));
          effectPositions = targets;
          console.log(`${player === ChessPieceType.BLACK ? '黑方' : '白方'} 使用保洁上门儿，清除了 ${targets.length} 颗棋子。`);
        } else {
          console.warn('保洁上门儿未能找到可清除的棋子。');
          skillStore.addEnergy(player, skill.config.energyCost, '技能未生效返还');
          skill.useCount--;
          skill.currentCooldown = 0;
          skillStore.updateSkillStatus(player);
          return false;
        }
        effectDuration = 3000;
        break;
      }
      case SkillType.FREEZE_WATER: {
        // 静如止水：冻结对手一回合
        const opponentPlayer = skillStore.getPlayer(player === ChessPieceType.BLACK ? ChessPieceType.WHITE : ChessPieceType.BLACK);
        opponentPlayer.isSkillDisabled = true;
        opponentPlayer.disabledRounds = 1; // 冻结一回合
        console.log(`${player === ChessPieceType.BLACK ? '黑方' : '白方'} 使用静如止水，冻结了对手一回合。`);
        effectDuration = 2000;
        break;
      }
      case SkillType.MOUNTAIN_POWER: {
        // 力拔山兮：清空棋盘
        gameStore.clearBoard();
        console.log(`${player === ChessPieceType.BLACK ? '黑方' : '白方'} 使用力拔山兮，清空了棋盘。`);
        effectDuration = 3000;
        break;
      }
      default:
        console.warn(`未知技能类型: ${skillType}`);
        skillStore.addEnergy(player, skill.config.energyCost, '技能未生效返还');
        skill.useCount--;
        skill.currentCooldown = 0;
        skillStore.updateSkillStatus(player);
        return false;
    }

    // 触发技能效果动画
    currentSkillEffect.value = {
      type: skillType,
      targetPositions: effectPositions,
      animation: skillType.toLowerCase().replace(/_/g, '-') + '-effect', // 动画名称
      duration: effectDuration,
    };
    isSkillEffectActive.value = true;

    // 动画结束后重置效果状态
    setTimeout(() => {
      isSkillEffectActive.value = false;
      currentSkillEffect.value = null;
    }, effectDuration + 500); // 动画结束后多留一点时间

    return true;
  };

  return {
    isSkillEffectActive,
    currentSkillEffect,
    currentPlayerSkills,
    isCurrentPlayerSkillDisabled,
    activateSkill,
  };
};
