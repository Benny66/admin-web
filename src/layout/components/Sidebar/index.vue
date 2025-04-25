<template>
  <div class="sidebar-container">
    <div class="logo-container">
      <router-link to="/" class="logo-link">
        <img :src="logo" class="sidebar-logo" />
        <h1 class="sidebar-title">{{ title }}</h1>
      </router-link>
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        :collapse-transition="false"
        mode="vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <sidebar-item
          v-for="route in routes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { constantRoutes } from '@/router';
import SidebarItem from './SidebarItem.vue';
import { useSidebarStore } from '@/stores/sidebar';

const sidebarStore = useSidebarStore();
const route = useRoute();

const logo = ref('/src/assets/img/logo.svg');
const title = ref('Admin System');

const isCollapse = computed(() => sidebarStore.isCollapse);
const routes = computed(() => constantRoutes.filter(route => !route.meta?.hidden));
const activeMenu = computed(() => {
  const { meta, path } = route;
  if (meta.activeMenu) {
    return meta.activeMenu;
  }
  return path;
});
</script>

<style lang="scss" scoped>
.sidebar-container {
  background-color: #304156;
  height: 100%;
  
  .logo-container {
    height: 50px;
    padding: 10px 0;
    text-align: center;
    overflow: hidden;
    
    .logo-link {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-decoration: none;
      
      .sidebar-logo {
        width: 32px;
        height: 32px;
        vertical-align: middle;
        margin-right: 12px;
      }
      
      .sidebar-title {
        display: inline-block;
        margin: 0;
        color: #fff;
        font-weight: 600;
        font-size: 14px;
        vertical-align: middle;
      }
    }
  }
  
  .el-scrollbar {
    height: calc(100% - 50px);
  }
}
</style>