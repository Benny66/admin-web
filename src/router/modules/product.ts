import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';

const productRoutes: RouteRecordRaw = {
  path: '/product',
  component: Layout,
  redirect: '/product/list',
  name: 'Product',
  meta: {
    title: '商品管理',
    icon: 'Goods',
  },
  children: [
    {
      path: 'list',
      name: 'ProductList',
      component: () => import('@/views/product/list/index.vue'),
      meta: { title: '商品列表', icon: 'List' },
    },
    {
      path: 'category',
      name: 'ProductCategory',
      component: () => import('@/views/product/category/index.vue'),
      meta: { title: '商品分类', icon: 'Menu' },
    },
    {
      path: 'inventory',
      name: 'ProductInventory',
      component: () => import('@/views/product/inventory/index.vue'),
      meta: { title: '库存管理', icon: 'Box' },
    },
    {
      path: 'stockin',
      name: 'ProductStockIn',
      component: () => import('@/views/product/stockin/index.vue'),
      meta: { title: '入库管理', icon: 'TopRight' },
    },
    {
      path: 'stockout',
      name: 'ProductStockOut',
      component: () => import('@/views/product/stockout/index.vue'),
      meta: { title: '出库管理', icon: 'BottomLeft' },
    }
  ],
};

export default productRoutes;