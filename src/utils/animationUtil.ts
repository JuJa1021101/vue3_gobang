import { SkillType, IPosition } from '@/types/skill';

export const AnimationUtil = {
  /**
   * 创建技能粒子效果
   * @param container 粒子效果的容器元素
   * @param skillType 技能类型，用于决定粒子样式
   * @param targetPosition 目标位置，用于定位粒子效果
   */
  createSkillParticles(container: HTMLElement, skillType: SkillType, targetPosition: IPosition) {
    const particleCount = 20; // 粒子数量
    const cellSize = 40; // 棋盘单元格大小，用于计算粒子位置

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('skill-particle', `particle-${skillType.toLowerCase().replace(/_/g, '-')}`);

      // 计算粒子起始位置（基于目标棋子位置）
      const startX = targetPosition.col * cellSize + cellSize / 2;
      const startY = targetPosition.row * cellSize + cellSize / 2;

      // 随机偏移量
      const offsetX = (Math.random() - 0.5) * cellSize * 2; // -cellSize 到 +cellSize
      const offsetY = (Math.random() - 0.5) * cellSize * 2; // -cellSize 到 +cellSize

      particle.style.left = `${startX + offsetX}px`;
      particle.style.top = `${startY + offsetY}px`;
      particle.style.setProperty('--start-x', `${startX + offsetX}px`);
      particle.style.setProperty('--start-y', `${startY + offsetY}px`);

      // 随机结束位置
      const endX = startX + (Math.random() - 0.5) * 300; // 扩散范围
      const endY = startY + (Math.random() - 0.5) * 300;
      particle.style.setProperty('--end-x', `${endX}px`);
      particle.style.setProperty('--end-y', `${endY}px`);

      // 随机大小和动画延迟
      const size = Math.random() * 10 + 5; // 5px to 15px
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.animationDelay = `${Math.random() * 0.5}s`;
      particle.style.animationDuration = `${Math.random() * 1 + 1}s`; // 1s to 2s

      container.appendChild(particle);

      // 动画结束后移除粒子
      particle.addEventListener('animationend', () => {
        particle.remove();
      });
    }
  },
};

// 粒子效果的通用样式 (需要在全局或App.vue中引入)
/*
.skill-particle {
  position: absolute;
  background-color: white; // 默认颜色，会被技能类型覆盖
  border-radius: 50%;
  opacity: 0;
  transform: translate(-50%, -50%);
  animation: particle-fade-move forwards;
  z-index: 10000;
}

@keyframes particle-fade-move {
  0% {
    opacity: 1;
    transform: translate(var(--start-x), var(--start-y)) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--end-x), var(--end-y)) scale(0);
  }
}

// 技能特定粒子颜色
.particle-fly-sand {
  background-color: #FF6B6B; // 飞沙走石的颜色
  box-shadow: 0 0 5px #FF6B6B;
}
.particle-pick-gold {
  background-color: #FFD93D; // 拾金不昧的颜色 (金色)
  box-shadow: 0 0 5px #FFD93D;
}
.particle-clean-service {
  background-color: #95E1D3; // 保洁上门儿的颜色
  box-shadow: 0 0 5px #95E1D3;
}
.particle-freeze-water {
  background-color: #38B6FF; // 静如止水的颜色
  box-shadow: 0 0 5px #38B6FF;
}
.particle-mountain-power {
  background-color: #FFD93D; // 力拔山兮的颜色 (闪电色)
  box-shadow: 0 0 10px #FFD93D;
}
*/

