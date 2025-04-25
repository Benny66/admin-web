import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';

const systemRoutes: RouteRecordRaw = {
  path: '/system',
  component: Layout,
  redirect: '/system/user',
  name: 'System',
  meta: {
    title: '系统管理',
    icon: 'Setting',
  },
  children: [
    {
      path: 'user',
      name: 'User',
      component: () => import('@/views/system/user/index.vue'),
      meta: { title: '用户管理', icon: 'User' },
    },
    {
      path: 'role',
      name: 'Role',
      component: () => import('@/views/system/role/index.vue'),
      meta: { title: '角色管理', icon: 'UserFilled' },
    },
    {
      path: 'menu',
      name: 'Menu',
      component: () => import('@/views/system/menu/index.vue'),
      meta: { title: '菜单管理', icon: 'Menu' },
    },
    // {
    //   path: 'dict',
    //   name: 'Dict',
    //   component: () => import('@/views/system/dict/index.vue'),
    //   meta: { title: '字典管理', icon: 'Document' },
    // },
    // {
    //   path: 'log',
    //   name: 'Log',
    //   component: () => import('@/views/system/log/index.vue'),
    //   meta: { title: '操作日志', icon: 'DocumentCopy' },
    // },
  ],
};

export default systemRoutes;