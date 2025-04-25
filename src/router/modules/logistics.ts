import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';

const logisticsRoutes: RouteRecordRaw = {
  path: '/logistics',
  component: Layout,
  redirect: '/logistics/shipment',
  name: 'Logistics',
  meta: {
    title: '物流管理',
    icon: 'Van',
  },
  children: [
    {
      path: 'shipment',
      name: 'Shipment',
      component: () => import('@/views/logistics/shipment/index.vue'),
      meta: { title: '发货管理', icon: 'Promotion' },
    },
    {
      path: 'tracking',
      name: 'Tracking',
      component: () => import('@/views/logistics/tracking/index.vue'),
      meta: { title: '物流跟踪', icon: 'Location' },
    },
    {
      path: 'provider',
      name: 'LogisticsProvider',
      component: () => import('@/views/logistics/provider/index.vue'),
      meta: { title: '物流商管理', icon: 'Connection' },
    },
    {
      path: 'cost',
      name: 'LogisticsCost',
      component: () => import('@/views/logistics/cost/index.vue'),
      meta: { title: '物流费用', icon: 'Money' },
    },
  ],
};

export default logisticsRoutes;