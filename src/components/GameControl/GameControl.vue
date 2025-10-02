<template>
  <div class="game-control-panel">
    <div class="panel-header">
      <h3 class="panel-title">游戏控制</h3>
    </div>

    <div class="control-buttons">
      <button 
        class="control-btn new-game-btn"
        @click="handleNewGame"
        title="开始一局新游戏"
      >
        <span class="btn-icon">🚀</span>
        <span class="btn-text">新游戏</span>
      </button>

      <button 
        class="control-btn undo-btn"
        @click="handleUndo"
        :disabled="!canUndo"
        title="悔棋一步"
      >
        <span class="btn-icon">↩️</span>
        <span class="btn-text">悔棋</span>
      </button>

      <button 
        class="control-btn hint-btn"
        @click="handleHint"
        :disabled="!canGetHint"
        title="获取落子提示"
      >
        <span class="btn-icon">💡</span>
        <span class="btn-text">提示</span>
      </button>

      <button 
        class="control-btn settings-btn"
        @click="handleSettings"
        title="打开游戏设置"
      >
        <span class="btn-icon">⚙️</span>
        <span class="btn-text">设置</span>
      </button>
    </div>

    <div class="game-mode-selector">
      <label for="game-mode" class="mode-label">游戏模式:</label>
      <select 
        id="game-mode"
        v-model="selectedMode"
        class="mode-select"
        @change="handleModeChange"
      >
        <option value="classic">经典模式</option>
        <option value="berserk">狂暴模式</option>
        <option value="no-skill">无技能模式</option>
      </select>
    </div>

    <!-- 提示信息 -->
    <div v-if="hintMessage" class="hint-message">
      {{ hintMessage }}
    </div>

    <!-- 设置弹窗 (简化实现) -->
    <div v-if="showSettings" class="settings-modal">
      <h4>游戏设置</h4>
      <p>此处可以添加音量、主题等设置选项。</p>
      <button @click="showSettings = false">关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { useGameLogic } from '@/composables/useGameLogic';

// 组合式函数
const gameStore = useGameStore();
const gameLogic = useGameLogic();

// 响应式数据
const selectedMode = ref('classic');
const hintMessage = ref('');
const showSettings = ref(false);

// 计算属性
const canUndo = computed(() => {
  return gameStore.gameState.round > 0 && !gameStore.isGameOver;
});

const canGetHint = computed(() => {
  return !gameStore.isGameOver;
});

/**
 * 处理新游戏
 */
const handleNewGame = (): void => {
  if (confirm('确定要开始新游戏吗？当前进度将丢失。')) {
    gameLogic.restartGame();
  }
};

/**
 * 处理悔棋
 */
const handleUndo = (): void => {
  // 悔棋逻辑需要更复杂的状态管理，此处为简化实现
  alert('悔棋功能正在开发中！');
};

/**
 * 处理提示
 */
const handleHint = (): void => {
  // 提示逻辑需要AI或评估函数，此处为简化实现
  hintMessage.value = '提示：建议您落在棋盘的中心区域。';
  setTimeout(() => {
    hintMessage.value = '';
  }, 3000);
};

/**
 * 处理设置
 */
const handleSettings = (): void => {
  showSettings.value = !showSettings.value;
};

/**
 * 处理模式切换
 */
const handleModeChange = (): void => {
  alert(`游戏模式已切换为: ${selectedMode.value}。新模式将在下一局游戏生效。`);
  // 实际的模式切换逻辑会更复杂，可能需要重置游戏并应用不同配置
};
</script>

<style scoped lang="scss">
.game-control-panel {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.panel-header {
  text-align: center;
  margin-bottom: 16px;

  .panel-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #495057;
  }
}

.control-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    background-color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      background-color: #e9ecef;
      border-color: #adb5bd;
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-icon {
      font-size: 1.2rem;
    }

    .btn-text {
      font-size: 0.875rem;
    }
  }
}

.game-mode-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .mode-label {
    font-size: 0.875rem;
    color: #6c757d;
  }

  .mode-select {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid #ced4da;
    border-radius: 6px;
    background-color: white;
  }
}

.hint-message {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.875rem;
  text-align: center;
}

.settings-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1100;
}
</style>
