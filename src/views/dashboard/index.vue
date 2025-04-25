<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <template #header>
            <div class="card-header">
              <span>欢迎使用管理系统</span>
            </div>
          </template>
          <div class="welcome-content">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="6">
                <div class="data-item">
                  <el-icon class="icon"><User /></el-icon>
                  <div class="content">
                    <div class="value">8,846</div>
                    <div class="label">用户总数</div>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <div class="data-item">
                  <el-icon class="icon"><ShoppingCart /></el-icon>
                  <div class="content">
                    <div class="value">1,234</div>
                    <div class="label">订单总数</div>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <div class="data-item">
                  <el-icon class="icon"><Goods /></el-icon>
                  <div class="content">
                    <div class="value">5,678</div>
                    <div class="label">商品总数</div>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <div class="data-item">
                  <el-icon class="icon"><Money /></el-icon>
                  <div class="content">
                    <div class="value">¥9,280</div>
                    <div class="label">销售总额</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷入口</span>
            </div>
          </template>
          <div class="shortcut-list">
            <div class="shortcut-item" v-for="(item, index) in shortcuts" :key="index" @click="navigateTo(item.path)">
              <el-icon class="icon"><component :is="item.icon" /></el-icon>
              <span class="label">{{ item.title }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统公告</span>
            </div>
          </template>
          <div class="notice-list">
            <div class="notice-item" v-for="(item, index) in notices" :key="index">
              <div class="notice-title">{{ item.title }}</div>
              <div class="notice-time">{{ item.time }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { User, ShoppingCart, Goods, Money, Setting, Document, Bell, List } from '@element-plus/icons-vue';

const router = useRouter();

const shortcuts = ref([
  { title: '用户管理', icon: 'User', path: '/system/user' },
  { title: '角色管理', icon: 'Setting', path: '/system/role' },
  { title: '菜单管理', icon: 'List', path: '/system/menu' },
  { title: '系统设置', icon: 'Setting', path: '/system/setting' }
]);

const notices = ref([
  { title: '系统更新通知：V1.2.0版本已发布', time: '2023-06-15 10:30' },
  { title: '维护通知：系统将于本周日凌晨2点进行例行维护', time: '2023-06-10 14:20' },
  { title: '新功能上线：数据分析模块已开放使用', time: '2023-06-05 09:15' },
  { title: '安全提醒：请定期修改您的登录密码', time: '2023-06-01 16:45' }
]);

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  
  .mt-20 {
    margin-top: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
  
  .welcome-card {
    margin-bottom: 20px;
    
    .welcome-content {
      padding: 10px 0;
    }
    
    .data-item {
      display: flex;
      align-items: center;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 4px;
      margin-bottom: 10px;
      
      .icon {
        font-size: 48px;
        color: #409EFF;
        margin-right: 20px;
      }
      
      .content {
        .value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          line-height: 1.5;
        }
        
        .label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }
  
  .shortcut-list {
    display: flex;
    flex-wrap: wrap;
    
    .shortcut-item {
      width: 25%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 15px 0;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        background-color: #f5f7fa;
      }
      
      .icon {
        font-size: 30px;
        color: #409EFF;
        margin-bottom: 8px;
      }
      
      .label {
        font-size: 14px;
      }
    }
  }
  
  .notice-list {
    .notice-item {
      padding: 12px 0;
      border-bottom: 1px solid #ebeef5;
      
      &:last-child {
        border-bottom: none;
      }
      
      .notice-title {
        font-size: 14px;
        color: #303133;
        margin-bottom: 5px;
      }
      
      .notice-time {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>