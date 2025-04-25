<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-logo">
        <img src="@/assets/logo.png" alt="Logo" />
        <h1 class="title">管理系统</h1>
      </div>
      
      <div class="login-form">
        <div class="login-type">
          <span class="active">账号密码登录</span>
          <span class="divider">|</span>
          <span>扫码登录</span>
        </div>
        
        <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="form">
          <el-form-item prop="username">
            <label>账户</label>
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              type="text"
              tabindex="1"
              autocomplete="off"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <label>密码</label>
            <el-input
              v-model="loginForm.password"
              placeholder="请输入密码"
              type="password"
              tabindex="2"
              autocomplete="off"
              show-password
            />
          </el-form-item>
          
          <el-button
            :loading="loading"
            type="primary"
            class="login-button"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form>
        
        <div class="login-options">
          <a href="javascript:;" class="forgot-password">忘记密码？</a>
        </div>
        
        <div class="login-methods">
          <p>支持两种登录方式：</p>
          <ol>
            <li>扫码登录：使用微信或企业微信扫描二维码</li>
            <li>Pin+Token登录：关注企业微信公众号，在企业号的"统一登录"界面设置Pin码后方可使用</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const loginForm = reactive({
  username: '',
  password: ''
});

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const loading = ref(false);
const loginFormRef = ref();

const handleLogin = async () => {
  try {
    loading.value = true;
    await loginFormRef.value.validate();
    
    await userStore.login(loginForm.username, loginForm.password);
    router.push({ path: '/' });
    ElMessage.success('登录成功');
  } catch (error) {
    console.error('登录失败:', error);
    ElMessage.error('登录失败，请检查用户名和密码');
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
  
  .login-box {
    width: 400px;
    padding: 30px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    
    .login-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30px;
      
      img {
        height: 40px;
        margin-right: 10px;
      }
      
      .title {
        font-size: 22px;
        color: #333;
        margin: 0;
      }
    }
    
    .login-type {
      display: flex;
      margin-bottom: 20px;
      
      span {
        cursor: pointer;
        padding: 0 10px;
        color: #666;
        
        &.active {
          color: #1890ff;
          font-weight: bold;
        }
        
        &.divider {
          cursor: default;
          color: #ddd;
        }
      }
    }
    
    .form {
      margin-bottom: 20px;
      
      label {
        display: block;
        margin-bottom: 5px;
        font-size: 14px;
        color: #333;
      }
      
      .el-input {
        margin-bottom: 5px;
        
        :deep(.el-input__inner) {
          background-color: #f5f7fa;
        }
      }
    }
    
    .login-button {
      width: 100%;
      margin-top: 10px;
      background-color: #1890ff;
    }
    
    .login-options {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
      
      .forgot-password {
        color: #1890ff;
        font-size: 14px;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    .login-methods {
      border-top: 1px solid #eee;
      padding-top: 15px;
      font-size: 13px;
      color: #666;
      
      p {
        margin-bottom: 5px;
      }
      
      ol {
        margin: 0;
        padding-left: 20px;
        
        li {
          margin-bottom: 5px;
        }
      }
    }
  }
}
</style>