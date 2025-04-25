<template>
  <div class="hamburger-container" @click="toggleClick">
    <el-icon :class="{'is-active': isActive}">
      <Expand v-if="isActive" />
      <Fold v-else />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import { Expand, Fold } from '@element-plus/icons-vue';

defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggleClick']);

const toggleClick = () => {
  emit('toggleClick');
};
</script>

<style lang="scss" scoped>
.hamburger-container {
  padding: 0 15px;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.025);
  }
  
  .el-icon {
    font-size: 20px;
    
    &.is-active {
      transform: rotate(180deg);
    }
  }
}
</style>