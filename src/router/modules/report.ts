import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';

const reportRoutes: RouteRecordRaw = {
  path: '/report',
  component: Layout,
  redirect: '/report/inventory',
  name: 'Report',
  meta: {
    title: '报表统计',
    icon: 'PieChart',
  },
  children: [
    {
      path: 'inventory',
      name: 'InventoryReport',
      component: () => import('@/views/report/inventory/index.vue'),
      meta: { title: '库存报表', icon: 'DataAnalysis' },
    },
    {
      path: 'order',
      name: 'OrderReport',
      component: () => import('@/views/report/order/index.vue'),
      meta: { title: '订单报表', icon: 'DataLine' },
    },
    {
      path: 'logistics',
      name: 'LogisticsReport',
      component: () => import('@/views/report/logistics/index.vue'),
      meta: { title: '物流报表', icon: 'TrendCharts' },
    },
    {
      path: 'operation',
      name: 'OperationReport',
      component: () => import('@/views/report/operation/index.vue'),
      meta: { title: '运营报表', icon: 'Histogram' },
    },
  ],
};

export default reportRoutes;