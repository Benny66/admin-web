import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';

const userRoutes: RouteRecordRaw = {
  path: '/user',
  component: Layout,
  redirect: '/user/profile',
  name: 'UserCenter',
  meta: {
    title: '个人中心',
    icon: 'User',
    hidden: true
  },
  children: [
    {
      path: 'profile',
      name: 'Profile',
      component: () => import('@/views/user/profile/index.vue'),
      meta: { title: '个人中心' }
    }
  ]
};

export default userRoutes;