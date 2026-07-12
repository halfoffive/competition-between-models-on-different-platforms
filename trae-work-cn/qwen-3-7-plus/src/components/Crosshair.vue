<template>
  <div class="crosshair">
    <div class="crosshair-line horizontal"></div>
    <div class="crosshair-line vertical"></div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.crosshair {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  pointer-events: none;
  z-index: 999;
}

.crosshair-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
}

.crosshair-line.horizontal {
  width: 100%;
  height: 2px;
  top: 50%;
  transform: translateY(-50%);
}

.crosshair-line.vertical {
  width: 2px;
  height: 100%;
  left: 50%;
  transform: translateX(-50%);
}
</style>
