<template>
  <div class="navbar">
    <div class="left-menu">
      <hamburger :is-active="!sidebarStore.isCollapse" @toggle-click="toggleSidebar" />
      <breadcrumb />
    </div>
    
    <div class="right-menu">
      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <el-avatar :size="30" :src="userStore.avatar || defaultAvatar" />
          <span class="user-name">{{ userStore.name }}</span>
          <el-icon><arrow-down /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleProfile">个人中心</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import Breadcrumb from './Breadcrumb.vue';
import Hamburger from './Hamburger.vue';
import { useUserStore } from '@/stores/user';
import { useSidebarStore } from '@/stores/sidebar';

const userStore = useUserStore();
const sidebarStore = useSidebarStore();
const router = useRouter();
const defaultAvatar = ref('/src/assets/avatar.png');

const toggleSidebar = () => {
  sidebarStore.toggleSidebar();
};

const handleProfile = () => {
  router.push('/user/profile');
};

const handleLogout = () => {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    userStore.logout().then(() => {
      router.push('/login');
    });
  });
};
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  
  .left-menu {
    display: flex;
    align-items: center;
  }
  
  .right-menu {
    display: flex;
    align-items: center;
    
    .avatar-container {
      cursor: pointer;
      
      .avatar-wrapper {
        display: flex;
        align-items: center;
        
        .user-name {
          margin: 0 5px;
        }
      }
    }
  }
}
</style>