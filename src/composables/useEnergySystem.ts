import { ref, computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { useSkillStore } from '@/stores/skillStore';
import { ChessPieceType } from '@/types/game';
import { GAME_CONFIG } from '@/constants/gameConfig';

/**
 * 能量系统组合式函数
 */
export const useEnergySystem = () => {
  const gameStore = useGameStore();
  const skillStore = useSkillStore();

  // 响应式状态
  const isFortuneBoxAvailable = ref(false);
  const fortuneBoxPlayer = ref<ChessPieceType | null>(null);

  // 计算属性
  const currentPlayer = computed(() => gameStore.gameState.currentPlayer);

  /**
   * 检查并生成福运箱
   */
  const checkFortuneBox = (): void => {
    if (gameStore.gameState.round > 0 && gameStore.gameState.round % GAME_CONFIG.FORTUNE_BOX.INTERVAL === 0) {
      // 只有当没有福运箱时才生成
      if (!isFortuneBoxAvailable.value) {
        // 劣势方获得福运箱的概率更高
        const blackEnergy = skillStore.getPlayer(ChessPieceType.BLACK).energy;
        const whiteEnergy = skillStore.getPlayer(ChessPieceType.WHITE).energy;

        let blackProbability = 0.5;
        let whiteProbability = 0.5;

        if (blackEnergy < whiteEnergy) {
          blackProbability += GAME_CONFIG.FORTUNE_BOX.LOSING_PROBABILITY_BONUS;
          whiteProbability -= GAME_CONFIG.FORTUNE_BOX.LOSING_PROBABILITY_BONUS;
        } else if (whiteEnergy < blackEnergy) {
          whiteProbability += GAME_CONFIG.FORTUNE_BOX.LOSING_PROBABILITY_BONUS;
          blackProbability -= GAME_CONFIG.FORTUNE_BOX.LOSING_PROBABILITY_BONUS;
        }

        // 确保概率在0-1之间
        blackProbability = Math.max(0, Math.min(1, blackProbability));
        whiteProbability = Math.max(0, Math.min(1, whiteProbability));

        const totalProbability = blackProbability + whiteProbability;
        const normalizedBlackProbability = blackProbability / totalProbability;

        if (Math.random() < normalizedBlackProbability) {
          fortuneBoxPlayer.value = ChessPieceType.BLACK;
        } else {
          fortuneBoxPlayer.value = ChessPieceType.WHITE;
        }
        isFortuneBoxAvailable.value = true;
        console.log(`${fortuneBoxPlayer.value === ChessPieceType.BLACK ? '黑方' : '白方'} 获得了福运箱！`);
      }
    }
  };

  /**
   * 打开福运箱
   */
  const openFortuneBox = (): void => {
    if (!isFortuneBoxAvailable.value || !fortuneBoxPlayer.value) return;

    const [minEnergy, maxEnergy] = GAME_CONFIG.FORTUNE_BOX.ENERGY_RANGE;
    const bonusEnergy = Math.floor(Math.random() * (maxEnergy - minEnergy + 1)) + minEnergy;

    skillStore.addEnergy(fortuneBoxPlayer.value, bonusEnergy, '福运箱奖励');
    console.log(`${fortuneBoxPlayer.value === ChessPieceType.BLACK ? '黑方' : '白方'} 打开福运箱，获得了 ${bonusEnergy} 能量！`);

    isFortuneBoxAvailable.value = false;
    fortuneBoxPlayer.value = null;
  };

  /**
   * 检查僵局奖励
   */
  const checkStalemateReward = (): void => {
    if (gameStore.gameState.stalemateIndex >= 80) {
      // 僵局奖励给当前玩家
      skillStore.addEnergy(currentPlayer.value, GAME_CONFIG.ENERGY.STALEMATE_BONUS, '僵局奖励');
      console.log(`${currentPlayer.value === ChessPieceType.BLACK ? '黑方' : '白方'} 获得了僵局奖励！`);
    }
  };

  return {
    isFortuneBoxAvailable,
    fortuneBoxPlayer,
    checkFortuneBox,
    openFortuneBox,
    checkStalemateReward,
  };
};
