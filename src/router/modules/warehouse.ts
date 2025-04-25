import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';

const warehouseRoutes: RouteRecordRaw = {
  path: '/warehouse',
  component: Layout,
  redirect: '/warehouse/overview',
  name: 'Warehouse',
  meta: {
    title: '仓库管理',
    icon: 'House',
  },
  children: [
    {
      path: 'overview',
      name: 'WarehouseOverview',
      component: () => import('@/views/warehouse/overview/index.vue'),
      meta: { title: '仓库概览', icon: 'DataLine' },
    },
    {
      path: 'list',
      name: 'WarehouseList',
      component: () => import('@/views/warehouse/list/index.vue'),
      meta: { title: '仓库列表', icon: 'List' },
    },
    {
      path: 'area',
      name: 'WarehouseArea',
      component: () => import('@/views/warehouse/area/index.vue'),
      meta: { title: '库区管理', icon: 'Grid' },
    },
    // {
    //   path: 'shelf',
    //   name: 'WarehouseShelf',
    //   component: () => import('@/views/warehouse/shelf/index.vue'),
    //   meta: { title: '货架管理', icon: 'SortUp' },
    // },
  ],
};

export default warehouseRoutes;