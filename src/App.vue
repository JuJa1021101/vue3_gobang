<template>
  <div id="app" class="skill-gobang-app">
    <!-- 游戏标题栏 -->
    <header class="game-header">
      <div class="header-content">
        <h1 class="game-title">
          <span class="title-icon">⚫⚪</span>
          技能五子棋
          <span class="title-version">v1.0</span>
        </h1>
        
        <div class="game-info">
          <div class="round-info">
            <span class="info-label">回合:</span>
            <span class="info-value">{{ gameStore.gameState.round }}</span>
          </div>
          
          <div class="phase-info">
            <span class="info-label">阶段:</span>
            <span class="info-value phase-badge" :class="phaseClass">
              {{ phaseText }}
            </span>
          </div>
          
          <div class="stalemate-info">
            <span class="info-label">僵持指数:</span>
            <div class="stalemate-bar">
              <div 
                class="stalemate-fill" 
                :style="{ width: gameStore.gameState.stalemateIndex + '%' }"
              ></div>
            </div>
            <span class="info-value">{{ gameStore.gameState.stalemateIndex }}%</span>
          </div>
        </div>

        <div class="header-actions">
          <button 
            class="action-btn restart-btn"
            @click="handleRestart"
            :disabled="!canRestart"
          >
            🔄 重新开始
          </button>
          
          <button 
            class="action-btn pause-btn"
            @click="handlePause"
            :disabled="gameStore.isGameOver"
          >
            {{ isPaused ? '▶️ 继续' : '⏸️ 暂停' }}
          </button>
        </div>
      </div>
    </header>

    <!-- 主游戏区域 -->
    <main class="game-main">
      <!-- 左侧玩家信息 -->
      <aside class="left-panel">
        <PlayerInfo :player-type="ChessPieceType.BLACK" />
        <SkillPanel :player-type="ChessPieceType.BLACK" />
      </aside>

      <!-- 中央棋盘区域 -->
      <section class="board-section">
        <div class="board-container">
          <ChessBoard />
          
          <!-- 游戏状态覆盖层 -->
          <div v-if="showGameOverlay" class="game-overlay" :class="overlayClass">
            <div class="overlay-content">
              <div v-if="gameStore.gameState.winner" class="winner-announcement">
                <div class="winner-icon">
                  {{ gameStore.gameState.winner === ChessPieceType.BLACK ? '⚫' : '⚪' }}
                </div>
                <h2 class="winner-text">
                  {{ gameStore.gameState.winner === ChessPieceType.BLACK ? '黑方' : '白方' }} 获胜！
                </h2>
                <div class="winner-celebration">🎉 恭喜获胜！ 🎉</div>
              </div>
              
              <div v-else-if="isPaused" class="pause-announcement">
                <div class="pause-icon">⏸️</div>
                <h2 class="pause-text">游戏已暂停</h2>
                <p class="pause-hint">点击继续按钮恢复游戏</p>
              </div>

              <div class="overlay-actions">
                <button 
                  v-if="gameStore.gameState.winner"
                  class="overlay-btn primary"
                  @click="handleRestart"
                >
                  再来一局
                </button>
                
                <button 
                  v-if="isPaused"
                  class="overlay-btn primary"
                  @click="handlePause"
                >
                  继续游戏
                </button>
                
                <button 
                  class="overlay-btn secondary"
                  @click="handleRestart"
                >
                  重新开始
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 游戏控制面板 -->
        <div class="game-controls">
          <GameControl />
        </div>
      </section>

      <!-- 右侧玩家信息 -->
      <aside class="right-panel">
        <PlayerInfo :player-type="ChessPieceType.WHITE" />
        <SkillPanel :player-type="ChessPieceType.WHITE" />
      </aside>
    </main>

    <!-- 福运箱弹窗 -->
    <div v-if="energySystem.isFortuneBoxAvailable" class="fortune-box-modal">
      <div class="modal-backdrop" @click="handleFortuneBoxClose"></div>
      <div class="fortune-box-content">
        <div class="fortune-box-header">
          <h3>🎁 天降福运</h3>
          <p>{{ fortuneBoxPlayerName }} 获得了福运箱！</p>
        </div>
        
        <div class="fortune-box-animation">
          <div class="gift-box" :class="{ opening: isOpeningBox }">
            <div class="box-lid"></div>
            <div class="box-body"></div>
            <div class="box-sparkles">✨</div>
          </div>
        </div>
        
        <div class="fortune-box-actions">
          <button 
            class="fortune-btn open-btn"
            @click="handleOpenFortuneBox"
            :disabled="isOpeningBox"
          >
            {{ isOpeningBox ? '开启中...' : '打开福运箱' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 技能效果全屏动画 -->
    <SkillEffect 
      v-if="skillSystem.isSkillEffectActive"
      :skill-effect="skillSystem.currentSkillEffect"
    />

    <!-- 音效控制 -->
    <div class="audio-controls">
      <button 
        class="audio-btn"
        @click="toggleSound"
        :class="{ muted: isSoundMuted }"
      >
        {{ isSoundMuted ? '🔇' : '🔊' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { useSkillStore } from '@/stores/skillStore';
import { useGameLogic } from '@/composables/useGameLogic';
import { useSkillSystem } from '@/composables/useSkillSystem';
import { useEnergySystem } from '@/composables/useEnergySystem';
import ChessBoard from '@/components/ChessBoard/ChessBoard.vue';
import SkillPanel from '@/components/SkillPanel/SkillPanel.vue';
import PlayerInfo from '@/components/PlayerInfo/PlayerInfo.vue';
import GameControl from '@/components/GameControl/GameControl.vue';
import SkillEffect from '@/components/SkillEffect/SkillEffect.vue';
import { ChessPieceType, GameStatus, GamePhase } from '@/types/game';

// 组合式函数
const gameStore = useGameStore();
const skillStore = useSkillStore();
const gameLogic = useGameLogic();
const skillSystem = useSkillSystem();
const energySystem = useEnergySystem();

// 响应式数据
const isPaused = ref(false);
const isSoundMuted = ref(false);
const isOpeningBox = ref(false);

// 计算属性
const phaseClass = computed(() => {
  const phase = gameStore.gameState.phase;
  return `phase-${phase.toLowerCase()}`;
});

const phaseText = computed(() => {
  const phaseMap = {
    [GamePhase.OPENING]: '开局期',
    [GamePhase.MIDDLE]: '中局期',
    [GamePhase.STALEMATE]: '僵持期',
  };
  return phaseMap[gameStore.gameState.phase] || '未知';
});

const canRestart = computed(() => {
  return gameStore.gameState.round > 0 || gameStore.isGameOver;
});

const showGameOverlay = computed(() => {
  return gameStore.isGameOver || isPaused.value;
});

const overlayClass = computed(() => {
  if (gameStore.isGameOver) return 'game-over';
  if (isPaused.value) return 'game-paused';
  return '';
});

const fortuneBoxPlayerName = computed(() => {
  if (!energySystem.fortuneBoxPlayer) return '';
  return energySystem.fortuneBoxPlayer === ChessPieceType.BLACK ? '黑方' : '白方';
});

/**
 * 处理重新开始
 */
const handleRestart = (): void => {
  if (confirm('确定要重新开始游戏吗？')) {
    gameLogic.restartGame();
    isPaused.value = false;
    playSound('restart');
  }
};

/**
 * 处理暂停/继续
 */
const handlePause = (): void => {
  isPaused.value = !isPaused.value;
  
  if (isPaused.value) {
    gameStore.gameState.status = GameStatus.PAUSED;
    playSound('pause');
  } else {
    gameStore.gameState.status = GameStatus.PLAYING;
    playSound('resume');
  }
};

/**
 * 处理福运箱关闭
 */
const handleFortuneBoxClose = (): void => {
  // 点击背景不关闭，必须打开福运箱
};

/**
 * 处理打开福运箱
 */
const handleOpenFortuneBox = async (): Promise<void> => {
  isOpeningBox.value = true;
  playSound('fortuneBox');
  
  // 动画延迟
  setTimeout(() => {
    energySystem.openFortuneBox();
    isOpeningBox.value = false;
  }, 2000);
};

/**
 * 切换音效
 */
const toggleSound = (): void => {
  isSoundMuted.value = !isSoundMuted.value;
  localStorage.setItem('soundMuted', isSoundMuted.value.toString());
};

/**
 * 播放音效
 */
const playSound = (soundType: string): void => {
  if (isSoundMuted.value) return;
  
  // 实际项目中，这里会播放对应的音频文件
  console.log(`播放音效: ${soundType}`);
  // const audio = new Audio(`/audio/${soundType}.mp3`);
  // audio.play();
};

// 生命周期钩子
onMounted(() => {
  gameStore.initGame();
  skillStore.initSkills();
  // 从 localStorage 读取音效设置
  const savedSoundMuted = localStorage.getItem('soundMuted');
  if (savedSoundMuted !== null) {
    isSoundMuted.value = savedSoundMuted === 'true';
  }
});

// 监听回合变化，检查福运箱
watch(() => gameStore.gameState.round, (newRound) => {
  if (newRound > 0) {
    energySystem.checkFortuneBox();
  }
});

// 监听游戏状态变化，检查僵局奖励
watch(() => gameStore.gameState.status, (newStatus) => {
  if (newStatus === GameStatus.PLAYING) {
    energySystem.checkStalemateReward();
  }
});
</script>

<style lang="scss">
@import "@/assets/styles/reset.scss";
@import "@/assets/styles/common.scss";
@import "@/assets/styles/variables.scss";

html, body, #app {
  height: 100%;
  margin: 0;
  overflow: hidden; /* Prevent scrolling */
}

.skill-gobang-app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(to bottom right, #e0eafc, #cfdef3); /* Soft gradient background */
  color: $gray-800;
  font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  position: relative;
}

.game-header {
  background-color: $white;
  padding: $spacing-3 $spacing-5;
  box-shadow: $shadow-md;
  z-index: 100;

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-3;
  }

  .game-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $primary-color;
    display: flex;
    align-items: center;
    gap: $spacing-2;
    margin: 0;

    .title-icon {
      font-size: $font-size-3xl;
    }

    .title-version {
      font-size: $font-size-sm;
      color: $gray-500;
      font-weight: $font-weight-normal;
      margin-left: $spacing-1;
    }
  }

  .game-info {
    display: flex;
    gap: $spacing-4;
    align-items: center;

    .round-info,
    .phase-info,
    .stalemate-info {
      display: flex;
      align-items: center;
      gap: $spacing-1;
      font-size: $font-size-base;
      color: $gray-700;

      .info-label {
        font-weight: $font-weight-medium;
      }

      .info-value {
        font-weight: $font-weight-semibold;
      }
    }

    .phase-badge {
      padding: $spacing-1 $spacing-2;
      border-radius: $border-radius-full;
      color: $white;
      font-size: $font-size-sm;

      &.phase-opening {
        background-color: $success-color;
      }
      &.phase-middle {
        background-color: $info-color;
      }
      &.phase-stalemate {
        background-color: $danger-color;
      }
    }

    .stalemate-bar {
      width: 80px;
      height: 8px;
      background-color: $gray-300;
      border-radius: $border-radius-full;
      overflow: hidden;
      margin-left: $spacing-1;

      .stalemate-fill {
        height: 100%;
        background: linear-gradient(to right, $info-color, $warning-color, $danger-color);
        transition: width 0.5s ease-out;
        border-radius: $border-radius-full;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: $spacing-2;

    .action-btn {
      @extend .btn;
      padding: $spacing-1 $spacing-3;
      font-size: $font-size-sm;
      display: flex;
      align-items: center;
      gap: $spacing-1;

      &.restart-btn {
        background-color: $secondary-color;
        color: $white;

        &:hover {
          background-color: darken($secondary-color, 10%);
        }
      }

      &.pause-btn {
        background-color: $info-color;
        color: $white;

        &:hover {
          background-color: darken($info-color, 10%);
        }
      }
    }
  }
}

.game-main {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Align items to the top */
  padding: $spacing-5;
  gap: $spacing-5;
  overflow: auto; /* Allow scrolling if content overflows */

  .left-panel,
  .right-panel {
    flex-shrink: 0;
    width: 280px; /* Fixed width for side panels */
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  .board-section {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-4;
    max-width: fit-content; /* Adjust to content width */
  }

  .board-container {
    position: relative;
    display: inline-block; /* Shrink to content */
  }

  .game-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    @include center-flex;
    flex-direction: column;
    color: $white;
    z-index: 50;
    animation: fadeIn 0.5s ease-out;

    .overlay-content {
      text-align: center;
      padding: $spacing-5;
      background-color: rgba(0, 0, 0, 0.8);
      border-radius: $border-radius-lg;
      box-shadow: $shadow-xl;
      animation: slideInUp 0.6s ease-out;
    }

    .winner-announcement,
    .pause-announcement {
      margin-bottom: $spacing-4;

      .winner-icon,
      .pause-icon {
        font-size: $font-size-4xl;
        margin-bottom: $spacing-2;
      }

      .winner-text,
      .pause-text {
        font-size: $font-size-3xl;
        font-weight: $font-weight-bold;
        margin: 0;
      }

      .winner-celebration,
      .pause-hint {
        font-size: $font-size-lg;
        color: $gray-300;
      }
    }

    .overlay-actions {
      display: flex;
      gap: $spacing-3;
      justify-content: center;
      margin-top: $spacing-4;

      .overlay-btn {
        @extend .btn;
        font-size: $font-size-lg;

        &.primary {
          @extend .btn-primary;
        }

        &.secondary {
          @extend .btn-secondary;
          background-color: $gray-600;
          color: $white;

          &:hover {
            background-color: darken($gray-600, 10%);
          }
        }
      }
    }
  }
}

.fortune-box-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  @include center-flex;
  z-index: 1000;

  .modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .fortune-box-content {
    background: linear-gradient(to bottom right, #fdfbfb, #ebedee); /* Light gradient */
    border-radius: $border-radius-lg;
    padding: $spacing-5;
    box-shadow: $shadow-xl;
    text-align: center;
    z-index: 1010;
    position: relative;
    width: 350px;
    animation: slideInUp 0.6s ease-out;

    .fortune-box-header {
      margin-bottom: $spacing-4;

      h3 {
        font-size: $font-size-3xl;
        color: $primary-color;
        margin-bottom: $spacing-2;
      }

      p {
        font-size: $font-size-lg;
        color: $gray-700;
      }
    }

    .fortune-box-animation {
      margin-bottom: $spacing-5;
      position: relative;
      height: 120px;

      .gift-box {
        width: 100px;
        height: 80px;
        background-color: #e74c3c; /* Red gift box */
        border-radius: $border-radius-sm;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        transition: all 0.3s ease-out;

        .box-lid {
          width: 110px;
          height: 20px;
          background-color: #c0392b;
          border-radius: $border-radius-sm $border-radius-sm 0 0;
          position: absolute;
          top: -20px;
          left: -5px;
          transform-origin: bottom center;
          transition: all 0.3s ease-out;
        }

        .box-body {
          width: 100%;
          height: 100%;
          border: 2px solid #a93226;
          border-radius: $border-radius-sm;
        }

        .box-sparkles {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          font-size: $font-size-3xl;
          opacity: 0;
          transition: opacity 0.5s ease-in-out;
        }

        &.opening {
          .box-lid {
            transform: translate(-50%, -100%) rotate(-30deg);
            top: -40px;
          }
          .box-sparkles {
            opacity: 1;
            animation: sparkle-burst 1s forwards;
          }
        }
      }
    }

    .fortune-box-actions {
      .fortune-btn {
        @extend .btn;
        @extend .btn-primary;
        background-color: $primary-color;
        color: $white;
        font-size: $font-size-lg;

        &:hover {
          background-color: darken($primary-color, 10%);
        }
      }
    }
  }
}

.audio-controls {
  position: fixed;
  bottom: $spacing-4;
  right: $spacing-4;
  z-index: 100;

  .audio-btn {
    @include center-flex;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: $gray-700;
    color: $white;
    font-size: $font-size-xl;
    box-shadow: $shadow-md;
    transition: $transition-all;

    &:hover {
      background-color: darken($gray-700, 10%);
      transform: scale(1.05);
    }

    &.muted {
      background-color: $danger-color;

      &:hover {
        background-color: darken($danger-color, 10%);
      }
    }
  }
}

@keyframes sparkle-burst {
  0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
  50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
  100% { transform: translateX(-50%) scale(1); opacity: 0; }
}
</style>
