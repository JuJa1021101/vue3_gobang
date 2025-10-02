<template>
  <div class="skill-panel">
    <div class="panel-header">
      <h3 class="panel-title">{{ player.name }} 的技能</h3>
      <div class="energy-display">
        <span class="energy-icon">⚡</span>
        <span class="energy-value">{{ player.energy }} / {{ player.maxEnergy }}</span>
      </div>
    </div>

    <div class="skill-list">
      <div
        v-for="skill in player.skills"
        :key="skill.config.type"
        class="skill-item"
        :class="{
          disabled: !canUseSkill(skill),
          cooling: skill.status === SkillStatus.COOLING,
          used: skill.status === SkillStatus.USED,
          active: isSkillActive(skill.config.type),
        }"
        @click="handleSkillClick(skill)"
        :title="getSkillTooltip(skill)"
      >
        <div class="skill-icon" :style="{ backgroundColor: skill.config.color }">
          {{ skill.config.icon }}
        </div>
        <div class="skill-info">
          <div class="skill-name">{{ skill.config.name }}</div>
          <div class="skill-cost">能量: {{ skill.config.energyCost }}</div>
          <div v-if="skill.currentCooldown > 0" class="skill-cooldown">
            冷却: {{ skill.currentCooldown }} 回合
          </div>
          <div v-if="skill.config.maxUseCount !== -1" class="skill-uses">
            使用: {{ skill.useCount }} / {{ skill.config.maxUseCount }}
          </div>
        </div>
        <div v-if="!canUseSkill(skill)" class="skill-overlay"></div>
      </div>
    </div>

    <div v-if="player.isSkillDisabled" class="skill-disabled-message">
      技能被禁用 {{ player.disabledRounds }} 回合
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSkillStore } from '@/stores/skillStore';
import { useGameStore } from '@/stores/gameStore';
import { useSkillSystem } from '@/composables/useSkillSystem';
import { ChessPieceType } from '@/types/game';
import { ISkillInstance, SkillStatus, SkillType } from '@/types/skill';
import { SkillUtil } from '@/utils/skillUtil';

interface Props {
  playerType: ChessPieceType;
}

const props = defineProps<Props>();

const skillStore = useSkillStore();
const gameStore = useGameStore();
const skillSystem = useSkillSystem();

const player = computed(() => skillStore.getPlayer(props.playerType));

const canUseSkill = (skill: ISkillInstance): boolean => {
  return SkillUtil.canUseSkill(skill, player.value.energy, player.value.isSkillDisabled);
};

const isSkillActive = (skillType: SkillType): boolean => {
  // 这里可以根据实际情况判断技能是否处于激活状态
  // 例如，某些技能可能有一个持续回合的效果
  return false; 
};

const getSkillTooltip = (skill: ISkillInstance): string => {
  let tooltip = `${skill.config.name}: ${skill.config.description}\n`;
  tooltip += `能量消耗: ${skill.config.energyCost}\n`;
  if (skill.config.cooldown > 0) {
    tooltip += `冷却: ${skill.config.cooldown} 回合\n`;
  }
  if (skill.config.maxUseCount !== -1) {
    tooltip += `使用次数: ${skill.useCount}/${skill.config.maxUseCount}\n`;
  }
  if (skill.currentCooldown > 0) {
    tooltip += `剩余冷却: ${skill.currentCooldown} 回合\n`;
  }
  if (!canUseSkill(skill)) {
    tooltip += `\n当前无法使用：`;
    if (player.value.isSkillDisabled) tooltip += `技能被禁用；`;
    if (skill.status === SkillStatus.COOLING) tooltip += `冷却中；`;
    if (skill.status === SkillStatus.USED) tooltip += `已达最大使用次数；`;
    if (player.value.energy < skill.config.energyCost) tooltip += `能量不足；`;
  }
  return tooltip;
};

const handleSkillClick = async (skill: ISkillInstance): Promise<void> => {
  if (canUseSkill(skill)) {
    // 实际游戏中，可能需要用户选择目标位置，这里简化为直接激活
    const success = await skillSystem.activateSkill(skill.config.type);
    if (success) {
      console.log(`成功使用技能: ${skill.config.name}`);
    } else {
      console.warn(`技能 ${skill.config.name} 使用失败。`);
    }
  } else {
    alert(getSkillTooltip(skill));
  }
};
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.skill-panel {
  background: $white;
  border-radius: $border-radius-lg;
  padding: $spacing-4;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-3;
  position: relative;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-2;

    .panel-title {
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      color: $gray-800;
      margin: 0;
    }

    .energy-display {
      display: flex;
      align-items: center;
      gap: $spacing-1;
      background-color: $gray-100;
      padding: $spacing-1 $spacing-2;
      border-radius: $border-radius-full;

      .energy-icon {
        font-size: $font-size-base;
      }

      .energy-value {
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        color: $success-color;
      }
    }
  }

  .skill-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: $spacing-3;
  }

  .skill-item {
    background-color: $gray-100;
    border: 1px solid $gray-300;
    border-radius: $border-radius-md;
    padding: $spacing-2;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
    transition: $transition-all;
    position: relative;
    overflow: hidden;

    &:hover:not(.disabled) {
      transform: translateY(-3px);
      box-shadow: $shadow-base;
      border-color: $primary-color;
    }

    &.disabled,
    &.cooling,
    &.used {
      cursor: not-allowed;
      opacity: 0.6;
    }

    &.cooling {
      border-color: $warning-color;
    }

    &.used {
      border-color: $danger-color;
    }

    .skill-icon {
      width: $skill-icon-size * 2;
      height: $skill-icon-size * 2;
      border-radius: 50%;
      @include center-flex;
      font-size: $skill-icon-size;
      margin-bottom: $spacing-1;
      color: $white;
      box-shadow: $shadow-sm;
    }

    .skill-info {
      font-size: $font-size-sm;
      color: $gray-700;

      .skill-name {
        font-weight: $font-weight-semibold;
        color: $gray-900;
        margin-bottom: $spacing-1;
      }

      .skill-cost,
      .skill-cooldown,
      .skill-uses {
        font-size: $font-size-xs;
        color: $gray-600;
      }
    }

    .skill-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba($gray-900, 0.7);
      @include center-flex;
      color: $white;
      font-weight: $font-weight-bold;
      font-size: $font-size-lg;
      opacity: 0;
      transition: opacity 0.3s ease;

      &.cooling::before {
        content: "冷却中";
      }
      &.used::before {
        content: "已用完";
      }
      &.disabled::before {
        content: "能量不足";
      }
    }

    &:hover .skill-overlay {
      opacity: 1;
    }
  }

  .skill-disabled-message {
    background-color: $danger-light;
    color: $danger-dark;
    padding: $spacing-2;
    border-radius: $border-radius-md;
    text-align: center;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
  }
}
</style>
