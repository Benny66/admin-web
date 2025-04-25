import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';

const orderRoutes: RouteRecordRaw = {
  path: '/order',
  component: Layout,
  redirect: '/order/list',
  name: 'Order',
  meta: {
    title: '订单管理',
    icon: 'Tickets',
  },
  children: [
    {
      path: 'list',
      name: 'OrderList',
      component: () => import('@/views/order/list/index.vue'),
      meta: { title: '订单列表', icon: 'List' },
    },
    {
      path: 'process',
      name: 'OrderProcess',
      component: () => import('@/views/order/process/index.vue'),
      meta: { title: '订单处理', icon: 'Operation' },
    },
    {
      path: 'return',
      name: 'OrderReturn',
      component: () => import('@/views/order/return/index.vue'),
      meta: { title: '退货管理', icon: 'RefreshLeft' },
    },
  ],
};

export default orderRoutes;