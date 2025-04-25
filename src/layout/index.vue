<template>
  <div class="app-wrapper">
    <sidebar class="sidebar-container" />
    <div class="main-container">
      <navbar />
      <app-main />
      <div class="footer-copyright">
        Copyright © 2025 仓库物流管理系统 | 作者：bennywen | All Rights Reserved
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar/index.vue';
import AppMain from './components/AppMain.vue';
</script>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  height: 100vh;
  width: 100%;
  display: flex;
  
  .sidebar-container {
    width: 210px;
    height: 100%;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    overflow: hidden;
    transition: width 0.28s;
    z-index: 1001;
  }
  
  .main-container {
    min-height: 100%;
    transition: margin-left 0.28s;
    margin-left: 210px;
    position: relative;
    width: calc(100% - 210px);
  }
  
  .footer-copyright {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 210px;
    padding: 10px 20px;
    text-align: center;
    color: #888;
    font-size: 12px;
    background-color: #f8f9fa;
    border-top: 1px solid #ebeef5;
  }
}
</style>