<template>
  <div>
    <!-- 悬浮球 -->
    <div class="chat-bubble" ref="floatingBall" :style="{ left: ballLeft + 'px', top: ballTop + 'px' }"
      @mousedown="handleMouseDown">
      <img
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z'/%3E%3C/svg%3E"
        alt="ai助手" />
    </div>
    <!-- 菜单 -->
    <div class="menu" id="chatContainer" v-if="isMenuVisible" :style="{ left: menuLeft + 'px', top: menuTop + 'px' }"
      style="display: flex;flex-direction: column-reverse; overflow: auto;">

      <!--  Dify ai智能体地址-图中红线框起来的地方 -->
      <chat-panel />
    </div>
  </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import ChatPanel from "../chat-panel";

@Component({
  name: "suspend-ball-chat",
  components: {
    ChatPanel: ChatPanel,
  },
})
export default class SuspendBallChat extends Vue {
  private ballLeft: number = window.innerWidth - 80; // 初始位置
  private ballTop: number = window.innerHeight - 120;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private isMenuVisible: boolean = false;
  private menuLeft: number = 0;
  private menuTop: number = 0;
  private clickThreshold: number = 5; // 点击判断阈值
  private menuWidth: number = 350;
  private menuHeight: number = 500;
  private minEdgeDistance: number = 10; // 距离边缘最小距离

  handleMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = false;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.offsetX = this.ballLeft;
    this.offsetY = this.ballTop;
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
    // 拖动时移除过渡效果
    const ball = this.$refs.floatingBall as HTMLElement;
    ball.style.transition = "none";
  }

  handleMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const dx = event.clientX - this.startX;
      const dy = event.clientY - this.startY;
      this.ballLeft = this.offsetX + dx;
      this.ballTop = this.offsetY + dy;
      // 边界处理，考虑最小边缘距离
      this.ballLeft = Math.max(
        this.minEdgeDistance,
        Math.min(this.ballLeft, window.innerWidth - 60 - this.minEdgeDistance)
      );
      this.ballTop = Math.max(
        this.minEdgeDistance,
        Math.min(this.ballTop, window.innerHeight - 60 - this.minEdgeDistance)
      );

      // 更新菜单位置
      if (this.isMenuVisible) {
        this.updateMenuPosition();
      }
    } else {
      const dx = Math.abs(event.clientX - this.startX);
      const dy = Math.abs(event.clientY - this.startY);
      if (dx > this.clickThreshold || dy > this.clickThreshold) {
        this.isDragging = true;
      }
    }
  }

  handleMouseUp() {
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
    if (!this.isDragging) {
      this.toggleMenu();
    }
    // 吸壁效果，考虑最小边缘距离
    const targetLeft =
      this.ballLeft < window.innerWidth / 2
        ? this.minEdgeDistance
        : window.innerWidth - 60 - this.minEdgeDistance;

    // 添加过渡效果
    const ball = this.$refs.floatingBall as HTMLElement;
    ball.style.transition = "left 0.3s ease";
    this.ballLeft = targetLeft;

    // 吸壁后更新菜单位置
    if (this.isMenuVisible) {
      this.updateMenuPosition();
    }
    this.isDragging = false;
  }

  toggleMenu() {
    this.isMenuVisible = !this.isMenuVisible;
    this.updateMenuPosition();
  }

  updateMenuPosition() {
    let left = 0;
    let top = 0;
    if (
      this.ballLeft + this.menuWidth >
      window.innerWidth - this.minEdgeDistance
    ) {
      // 悬浮球在右边，菜单显示在左边
      left = this.ballLeft - this.menuWidth;
    } else {
      // 悬浮球在左边，菜单显示在右边
      left = this.ballLeft + 80;
    }
    // 处理垂直方向菜单超出屏幕的情况
    if (
      this.ballTop + this.menuHeight >
      window.innerHeight - this.minEdgeDistance
    ) {
      // 若菜单底部超出屏幕，将菜单向上偏移
      top = Math.max(
        this.minEdgeDistance,
        window.innerHeight - this.menuHeight - this.minEdgeDistance
      );
    } else {
      top = this.ballTop;
    }
    this.menuLeft = left;
    this.menuTop = top;
  }
}
</script>

<style scoped>
.chat-bubble {
  position: fixed;
  bottom: 60px;
  right: 20px;
  width: 60px;
  height: 60px;
  background-color: #15dbf5;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  transition: left 0.3s ease;
}

.chat-bubble img {
  width: 30px;
  height: 30px;
  user-select: none;
}

.menu {
  position: fixed;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 9999;
}

.chat-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 10px;
}
</style>
