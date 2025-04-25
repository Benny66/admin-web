import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';

// 路由模块自动导入
const modules = import.meta.glob('./modules/**/*.ts', { eager: true });
const routeModules: RouteRecordRaw[] = [];

Object.keys(modules).forEach((key) => {
  const mod = (modules[key] as any).default || {};
  const modList = Array.isArray(mod) ? [...mod] : [mod];
  routeModules.push(...modList);
});

// 基础路由
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error-page/404.vue'),
    meta: { title: '404', hidden: true },
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'HomeFilled' },
      },
    ],
  },
  ...routeModules,
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { hidden: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 }),
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 管理系统` : '管理系统';
  
  // 这里可以添加登录验证、权限验证等逻辑
  next();
});

export default router;