<template>
  <div class="skill-effect-overlay" :class="`effect-${skillEffect.animation}`">
    <div class="effect-content">
      <div class="effect-icon">{{ getSkillIcon(skillEffect.type) }}</div>
      <div class="effect-text">{{ getSkillName(skillEffect.type) }}</div>
    </div>

    <!-- 粒子效果容器 -->
    <div ref="particleContainer" class="particle-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { ISkillEffect, SkillType } from '@/types/skill';
import { SKILL_CONFIG_MAP } from '@/constants/skillConfig';
import { AnimationUtil } from '@/utils/animationUtil';

interface Props {
  skillEffect: ISkillEffect;
}

const props = defineProps<Props>();

const particleContainer = ref<HTMLElement | null>(null);

/**
 * 获取技能图标
 */
const getSkillIcon = (skillType: SkillType): string => {
  return SKILL_CONFIG_MAP[skillType]?.icon || '';
};

/**
 * 获取技能名称
 */
const getSkillName = (skillType: SkillType): string => {
  return SKILL_CONFIG_MAP[skillType]?.name || '';
};

/**
 * 播放技能动画和粒子效果
 */
const playSkillAnimation = () => {
  if (particleContainer.value && props.skillEffect.targetPositions && props.skillEffect.targetPositions.length > 0) {
    // 针对每个目标位置创建粒子效果
    props.skillEffect.targetPositions.forEach(pos => {
      AnimationUtil.createSkillParticles(particleContainer.value!, props.skillEffect.type, pos);
    });
  } else if (particleContainer.value) {
    // 如果没有特定目标位置，在中心创建粒子效果
    // 假设棋盘中心为 {row: 7, col: 7} 对于15x15棋盘
    AnimationUtil.createSkillParticles(particleContainer.value!, props.skillEffect.type, { row: 7, col: 7 });
  }
};

onMounted(() => {
  playSkillAnimation();
});

watch(() => props.skillEffect, () => {
  playSkillAnimation();
}, { deep: true });

// 清理粒子效果（如果需要）
onUnmounted(() => {
  if (particleContainer.value) {
    particleContainer.value.innerHTML = ''; // 清除所有粒子
  }
});
</script>

<style scoped lang="scss">
.skill-effect-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  pointer-events: none; /* 允许点击穿透 */
  background-color: rgba(0, 0, 0, 0.6); /* 默认背景 */
  transition: background-color 0.5s ease;

  .effect-content {
    text-align: center;
    color: white;
    animation: fadeInScale 0.8s ease-out forwards;

    .effect-icon {
      font-size: 6rem;
      margin-bottom: 1rem;
      animation: bounceEffect 1.5s infinite ease-in-out;
    }

    .effect-text {
      font-size: 2.5rem;
      font-weight: bold;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.6);
    }
  }

  .particle-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /* 技能特定背景和动画 */
  &.effect-fly-sand {
    background: radial-gradient(circle, rgba(255, 107, 107, 0.8) 0%, rgba(139, 69, 19, 0.8) 100%);
  }

  &.effect-pick-gold {
    background: radial-gradient(circle, rgba(78, 205, 196, 0.8) 0%, rgba(0, 128, 128, 0.8) 100%);
  }

  &.effect-clean-service {
    background: radial-gradient(circle, rgba(149, 225, 211, 0.8) 0%, rgba(64, 224, 208, 0.8) 100%);
  }

  &.effect-freeze-water {
    background: radial-gradient(circle, rgba(56, 182, 255, 0.8) 0%, rgba(0, 100, 200, 0.8) 100%);
  }

  &.effect-mountain-power {
    background: radial-gradient(circle, rgba(255, 217, 61, 0.8) 0%, rgba(255, 140, 0, 0.8) 100%);
  }
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes bounceEffect {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-30px); }
}
</style>
