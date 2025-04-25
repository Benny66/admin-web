import { defineStore } from 'pinia';
import { login, logout, getUserInfo } from '@/api/user';
import { setToken, getToken, removeToken } from '@/utils/auth';

interface UserState {
  token: string;
  name: string;
  avatar: string;
  roles: string[];
  permissions: string[];
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken() || '',
    name: '',
    avatar: '/src/assets/img/avatar.svg', // 设置默认头像为本地图片
    roles: [],
    permissions: [],
  }),
  
  getters: {
    hasRole: (state) => (role: string) => state.roles.includes(role),
    hasPermission: (state) => (permission: string) => state.permissions.includes(permission),
  },
  
  actions: {
    // 登录
    async login(username: string, password: string) {
      try {
        // const { data } = await login(username, password);
        const data = {
          token: 'fake-token',
          name: 'John Doe',
          avatar: '/src/assets/img/avatar.svg',
          roles: ['admin'],
          permissions: ['view_dashboard', 'edit_settings'],
        };
        this.token = data.token;
        setToken(data.token);
        return data;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 获取用户信息
    async getInfo() {
      try {
        const { data } = await getUserInfo();
        this.name = data.name;
        // 如果后端返回了头像地址，则使用后端返回的，否则保持默认头像
        this.avatar = data.avatar || '/src/assets/img/avatar.svg';
        this.roles = data.roles;
        this.permissions = data.permissions;
        return data;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 退出登录
    async logout() {
      try {
        // await logout();
        this.resetState();
        removeToken();
        return true;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 重置状态
    resetState() {
      this.token = '';
      this.name = '';
      this.avatar = '/src/assets/img/avatar.svg'; // 重置时也设置为默认头像
      this.roles = [];
      this.permissions = [];
    },
  },
});