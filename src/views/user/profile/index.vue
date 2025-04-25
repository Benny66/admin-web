<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 用户信息卡片 -->
      <el-col :span="6" :xs="24">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
            </div>
          </template>
          <div class="text-center">
            <div class="user-info">
              <el-avatar :size="100" :src="userStore.avatar" />
              <div class="user-name">{{ userStore.name }}</div>
              <div class="user-role">{{ userRole }}</div>
            </div>
            <div class="user-info-list">
              <div class="user-info-item">
                <span class="info-label">部门：</span>
                <span class="info-value">{{ userInfo.dept }}</span>
              </div>
              <div class="user-info-item">
                <span class="info-label">手机号码：</span>
                <span class="info-value">{{ userInfo.phone }}</span>
              </div>
              <div class="user-info-item">
                <span class="info-label">邮箱：</span>
                <span class="info-value">{{ userInfo.email }}</span>
              </div>
              <div class="user-info-item">
                <span class="info-label">创建日期：</span>
                <span class="info-value">{{ userInfo.createTime }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧选项卡 -->
      <el-col :span="18" :xs="24">
        <el-card>
          <template #header>
            <el-tabs v-model="activeTab">
              <el-tab-pane label="基本资料" name="userinfo">
                <template #label><el-icon><User /></el-icon> 基本资料</template>
              </el-tab-pane>
              <el-tab-pane label="修改密码" name="resetPwd">
                <template #label><el-icon><Lock /></el-icon> 修改密码</template>
              </el-tab-pane>
            </el-tabs>
          </template>
          
          <!-- 基本资料 -->
          <el-form
            v-if="activeTab === 'userinfo'"
            ref="userInfoForm"
            :model="userInfoForm"
            :rules="userInfoRules"
            label-width="100px"
          >
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="userInfoForm.nickName" maxlength="30" />
            </el-form-item>
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="userInfoForm.phone" maxlength="11" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userInfoForm.email" maxlength="50" />
            </el-form-item>
            <el-form-item label="性别">
              <el-radio-group v-model="userInfoForm.sex">
                <el-radio label="0">男</el-radio>
                <el-radio label="1">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitUserInfo">保存</el-button>
            </el-form-item>
          </el-form>
          
          <!-- 修改密码 -->
          <el-form
            v-else
            ref="pwdForm"
            :model="pwdForm"
            :rules="pwdRules"
            label-width="100px"
          >
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input
                v-model="pwdForm.oldPassword"
                placeholder="请输入旧密码"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="pwdForm.newPassword"
                placeholder="请输入新密码"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="pwdForm.confirmPassword"
                placeholder="请确认新密码"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitPwd">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const activeTab = ref('userinfo');

// 模拟用户信息
const userInfo = reactive({
  dept: '研发部',
  phone: '13800138000',
  email: 'test@example.com',
  createTime: '2023-01-01'
});

// 用户角色
const userRole = computed(() => {
  const roles = userStore.roles;
  if (roles.includes('admin')) {
    return '超级管理员';
  } else if (roles.length > 0) {
    return roles.join('、');
  }
  return '普通用户';
});

// 基本资料表单
const userInfoForm = reactive({
  nickName: userStore.name,
  phone: userInfo.phone,
  email: userInfo.email,
  sex: '0'
});

// 基本资料表单校验规则
const userInfoRules = {
  nickName: [
    { required: true, message: '用户昵称不能为空', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

// 修改密码表单
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 修改密码表单校验规则
const pwdRules = {
  oldPassword: [
    { required: true, message: '旧密码不能为空', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '确认密码不能为空', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 提交用户信息
const submitUserInfo = () => {
  // 这里应该调用API更新用户信息
  ElMessage.success('个人信息修改成功');
};

// 提交修改密码
const submitPwd = () => {
  // 这里应该调用API修改密码
  ElMessage.success('密码修改成功');
  pwdForm.oldPassword = '';
  pwdForm.newPassword = '';
  pwdForm.confirmPassword = '';
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
  
  .box-card {
    .card-header {
      font-weight: bold;
    }
    
    .text-center {
      text-align: center;
    }
    
    .user-info {
      padding: 20px 0;
      
      .user-name {
        font-size: 18px;
        font-weight: bold;
        margin: 10px 0 5px;
      }
      
      .user-role {
        font-size: 14px;
        color: #999;
        margin-bottom: 20px;
      }
    }
    
    .user-info-list {
      text-align: left;
      
      .user-info-item {
        padding: 10px 0;
        border-bottom: 1px solid #f0f0f0;
        
        .info-label {
          color: #666;
        }
        
        .info-value {
          color: #333;
        }
      }
    }
  }
}
</style>