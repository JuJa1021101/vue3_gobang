<template>
  <div class="chess-board" :style="boardStyle">
    <div
      v-for="(row, rowIndex) in gameStore.gameState.board"
      :key="rowIndex"
      class="board-row"
    >
      <div
        v-for="(cell, colIndex) in row"
        :key="`${rowIndex}-${colIndex}`"
        class="board-cell"
        :class="{
          'is-black-piece': cell === ChessPieceType.BLACK,
          'is-white-piece': cell === ChessPieceType.WHITE,
          'can-place': canPlacePiece(rowIndex, colIndex),
          'is-winning-piece': isWinningPiece(rowIndex, colIndex),
        }"
        @click="handleCellClick(rowIndex, colIndex)"
      >
        <div
          v-if="cell !== ChessPieceType.EMPTY"
          class="chess-piece"
          :class="{
            'piece-black': cell === ChessPieceType.BLACK,
            'piece-white': cell === ChessPieceType.WHITE,
          }"
        ></div>
        <div v-if="isLastMove(rowIndex, colIndex)" class="last-move-indicator"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { useGameLogic } from '@/composables/useGameLogic';
import { ChessPieceType } from '@/types/game';
import { GAME_CONFIG } from '@/constants/gameConfig';

const gameStore = useGameStore();
const gameLogic = useGameLogic();

const boardSize = GAME_CONFIG.BOARD_SIZE;
const cellSize = 40; // 每个单元格的像素大小

const boardStyle = computed(() => ({
  width: `${boardSize * cellSize}px`,
  height: `${boardSize * cellSize}px`,
  gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
  gridTemplateRows: `repeat(${boardSize}, 1fr)`,
}));

const canPlacePiece = (row: number, col: number): boolean => {
  return gameLogic.isValidPosition({ row, col });
};

const isLastMove = (row: number, col: number): boolean => {
  const lastPiece = gameStore.gameState.history[gameStore.gameState.history.length - 1];
  return lastPiece && lastPiece.position.row === row && lastPiece.position.col === col;
};

const isWinningPiece = (row: number, col: number): boolean => {
  // 假设 gameStore.gameState.winningLine 存储了获胜的五子连线
  // 这里简化处理，实际需要 gameStore 提供获胜连线信息
  return false; // 待实现
};

const handleCellClick = (row: number, col: number): void => {
  if (gameStore.isGameOver) {
    alert('游戏已结束，请重新开始！');
    return;
  }
  if (gameLogic.makeMove({ row, col })) {
    console.log(`玩家 ${gameStore.gameState.currentPlayer} 在 (${row}, ${col}) 落子`);
  }
};
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.chess-board {
  display: grid;
  background-color: $board-color;
  border: 1px solid $board-line-color;
  box-shadow: $shadow-md;
  border-radius: $border-radius-lg;
  overflow: hidden;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background-color: $board-line-color;
  }

  /* 垂直线 */
  @for $i from 1 through ($board-size - 1) {
    &::before:nth-of-type(#{$i}) {
      left: calc($i * $cell-size);
      top: 0;
      bottom: 0;
      width: 1px;
    }
  }

  /* 水平线 */
  @for $i from 1 through ($board-size - 1) {
    &::after:nth-of-type(#{$i}) {
      top: calc($i * $cell-size);
      left: 0;
      right: 0;
      height: 1px;
    }
  }
}

.board-row {
  display: contents;
}

.board-cell {
  width: $cell-size;
  height: $cell-size;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba($primary-color, 0.1);
  }

  &.can-place:hover {
    background-color: rgba($success-color, 0.2);
  }

  .chess-piece {
    width: $piece-size;
    height: $piece-size;
    border-radius: 50%;
    position: absolute;
    box-shadow: $shadow-sm;
    animation: pieceDrop 0.3s ease-out forwards;

    &.piece-black {
      background-color: $black-piece-color;
    }

    &.piece-white {
      background-color: $white-piece-color;
      border: 1px solid $gray-400;
    }
  }

  .last-move-indicator {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: $danger-color;
    border-radius: 50%;
    animation: pulse 1s infinite alternate;
  }

  &.is-winning-piece .chess-piece {
    box-shadow: 0 0 10px 5px $warning-color;
    animation: winGlow 1s infinite alternate;
  }
}

@keyframes pieceDrop {
  0% {
    transform: translateY(-20px) scale(0.5);
    opacity: 0;
  }
  70% {
    transform: translateY(5px) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.7; }
  100% { transform: scale(1.2); opacity: 1; }
}

@keyframes winGlow {
  0% { box-shadow: 0 0 10px 5px rgba($warning-color, 0.8); }
  100% { box-shadow: 0 0 20px 10px rgba($warning-color, 0.4); }
}
</style>
