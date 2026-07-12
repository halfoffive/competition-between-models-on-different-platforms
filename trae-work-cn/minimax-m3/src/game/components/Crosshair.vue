<script setup lang="ts">
// 中心准星
</script>

<template>
  <div class="crosshair">
    <div class="line line-h"></div>
    <div class="line line-v"></div>
  </div>
</template>

<style scoped>
.crosshair {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  pointer-events: none;
  z-index: 5;
}
.line {
  position: absolute;
  background: #fff;
  mix-blend-mode: difference;
}
.line-h {
  top: 50%;
  left: 0;
  width: 20px;
  height: 2px;
  transform: translateY(-50%);
}
.line-v {
  left: 50%;
  top: 0;
  width: 2px;
  height: 20px;
  transform: translateX(-50%);
}
</style>
