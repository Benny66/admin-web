<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="filter-container">
      <el-form :model="queryParams" ref="queryForm" :inline="true">
        <el-form-item label="订单编号" prop="orderNo">
          <el-input v-model="queryParams.orderNo" placeholder="请输入订单编号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="queryParams.customerName" placeholder="请输入客户名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="订单状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable style="width: 200px">
            <el-option v-for="dict in statusOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间" prop="dateRange">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="table-container">
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <div class="right-buttons">
            <el-button type="primary" icon="Plus" @click="handleAdd">新增订单</el-button>
            <el-button type="success" icon="View" :disabled="single" @click="handleView">查看详情</el-button>
            <el-button type="warning" icon="Edit" :disabled="single" @click="handleEdit">编辑订单</el-button>
            <el-button type="danger" icon="Delete" :disabled="multiple" @click="handleDelete">批量删除</el-button>
            <el-button type="primary" icon="Download" @click="handleExport">导出订单</el-button>
          </div>
        </div>
      </template>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="orderList"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="订单编号" prop="orderNo" width="180" />
        <el-table-column label="客户名称" prop="customerName" min-width="120" show-overflow-tooltip />
        <el-table-column label="订单金额" prop="totalAmount" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="订单状态" prop="status" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" prop="paymentMethod" width="120" />
        <el-table-column label="下单时间" prop="createTime" width="160" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="text" icon="View" @click.stop="handleView(scope.row)">查看</el-button>
            <el-button type="text" icon="Edit" @click.stop="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              type="text" 
              icon="Delete" 
              @click.stop="handleDelete(scope.row)"
              v-if="scope.row.status === 'pending'"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 查看订单详情对话框 -->
    <el-dialog title="订单详情" v-model="viewDialog.visible" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单编号">{{ orderDetail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(orderDetail.status)">
            {{ getStatusLabel(orderDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ orderDetail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ orderDetail.phone }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ orderDetail.address }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ orderDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ orderDetail.paymentMethod }}</el-descriptions-item>
        <el-descriptions-item label="支付时间" v-if="orderDetail.payTime">{{ orderDetail.payTime }}</el-descriptions-item>
        <el-descriptions-item label="发货时间" v-if="orderDetail.shipTime">{{ orderDetail.shipTime }}</el-descriptions-item>
        <el-descriptions-item label="完成时间" v-if="orderDetail.completeTime">{{ orderDetail.completeTime }}</el-descriptions-item>
        <el-descriptions-item label="取消时间" v-if="orderDetail.cancelTime">{{ orderDetail.cancelTime }}</el-descriptions-item>
        <el-descriptions-item label="订单备注" :span="2">{{ orderDetail.remark || '无' }}</el-descriptions-item>
      </el-descriptions>

      <div class="order-products">
        <div class="title">订单商品</div>
        <el-table :data="orderDetail.products" border>
          <el-table-column label="商品编码" prop="code" width="120" />
          <el-table-column label="商品名称" prop="name" min-width="150" show-overflow-tooltip />
          <el-table-column label="规格" prop="specification" width="120" />
          <el-table-column label="单价" prop="price" width="100" align="right">
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="quantity" width="80" align="center" />
          <el-table-column label="小计" width="120" align="right">
            <template #default="scope">
              ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="order-summary">
        <div class="summary-item">
          <span>商品总额：</span>
          <span>¥{{ orderDetail.productAmount?.toFixed(2) }}</span>
        </div>
        <div class="summary-item">
          <span>运费：</span>
          <span>¥{{ orderDetail.shippingFee?.toFixed(2) }}</span>
        </div>
        <div class="summary-item">
          <span>优惠金额：</span>
          <span>-¥{{ orderDetail.discountAmount?.toFixed(2) }}</span>
        </div>
        <div class="summary-item total">
          <span>订单总额：</span>
          <span>¥{{ orderDetail.totalAmount?.toFixed(2) }}</span>
        </div>
      </div>

      <div class="order-logs" v-if="orderDetail.logs && orderDetail.logs.length > 0">
        <div class="title">订单日志</div>
        <el-timeline>
          <el-timeline-item
            v-for="(log, index) in orderDetail.logs"
            :key="index"
            :timestamp="log.operateTime"
            :type="getLogType(log.operateType)"
          >
            {{ log.operateContent }} ({{ log.operateBy }})
          </el-timeline-item>
        </el-timeline>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="viewDialog.visible = false">关闭</el-button>
          <el-button type="primary" @click="handlePrint" v-if="orderDetail.status !== 'cancelled'">打印订单</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加/编辑订单对话框 -->
    <el-dialog :title="editDialog.title" v-model="editDialog.visible" width="900px" append-to-body>
      <el-form ref="orderFormRef" :model="orderForm" :rules="rules" label-width="100px">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="客户名称" prop="customerName">
                  <el-input v-model="orderForm.customerName" placeholder="请输入客户名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系电话" prop="phone">
                  <el-input v-model="orderForm.phone" placeholder="请输入联系电话" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="收货地址" prop="address">
                  <el-input v-model="orderForm.address" placeholder="请输入收货地址" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="支付方式" prop="paymentMethod">
                  <el-select v-model="orderForm.paymentMethod" placeholder="请选择支付方式" style="width: 100%">
                    <el-option label="微信支付" value="wechat" />
                    <el-option label="支付宝" value="alipay" />
                    <el-option label="银行转账" value="bank" />
                    <el-option label="货到付款" value="cod" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="订单状态" prop="status">
                  <el-select v-model="orderForm.status" placeholder="请选择订单状态" style="width: 100%">
                    <el-option
                      v-for="dict in statusOptions"
                      :key="dict.value"
                      :label="dict.label"
                      :value="dict.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="订单备注" prop="remark">
                  <el-input
                    v-model="orderForm.remark"
                    type="textarea"
                    placeholder="请输入订单备注"
                    :rows="2"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
          <el-tab-pane label="商品信息" name="products">
            <div class="product-search">
              <el-input
                v-model="productSearch"
                placeholder="搜索商品（名称/编码）"
                style="width: 300px"
                @keyup.enter="searchProducts"
              >
                <template #append>
                  <el-button icon="Search" @click="searchProducts" />
                </template>
              </el-input>
            </div>

            <el-table :data="availableProducts" border @selection-change="handleProductSelectionChange">
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="商品编码" prop="code" width="120" />
              <el-table-column label="商品名称" prop="name" min-width="150" show-overflow-tooltip />
              <el-table-column label="规格" prop="specification" width="120" />
              <el-table-column label="单价" prop="price" width="100" align="right">
                <template #default="scope">
                  ¥{{ scope.row.price.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="库存" prop="stock" width="80" align="center" />
              <el-table-column label="数量" width="120" align="center">
                <template #default="scope">
                  <el-input-number
                    v-model="scope.row.orderQuantity"
                    :min="1"
                    :max="scope.row.stock"
                    size="small"
                    @change="handleQuantityChange"
                  />
                </template>
              </el-table-column>
            </el-table>

            <div class="selected-products" v-if="selectedProducts.length > 0">
              <div class="title">已选商品</div>
              <el-table :data="selectedProducts" border>
                <el-table-column label="商品编码" prop="code" width="120" />
                <el-table-column label="商品名称" prop="name" min-width="150" show-overflow-tooltip />
                <el-table-column label="规格" prop="specification" width="120" />
                <el-table-column label="单价" prop="price" width="100" align="right">
                  <template #default="scope">
                    ¥{{ scope.row.price.toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column label="数量" prop="orderQuantity" width="80" align="center" />
                <el-table-column label="小计" width="120" align="right">
                  <template #default="scope">
                    ¥{{ (scope.row.price * scope.row.orderQuantity).toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" align="center">
                  <template #default="scope">
                    <el-button
                      type="text"
                      icon="Delete"
                      @click="removeSelectedProduct(scope.$index)"
                    >移除</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div class="order-summary">
                <div class="summary-item">
                  <span>商品总额：</span>
                  <span>¥{{ productTotal.toFixed(2) }}</span>
                </div>
                <div class="summary-item">
                  <span>运费：</span>
                  <el-input-number
                    v-model="orderForm.shippingFee"
                    :min="0"
                    :precision="2"
                    size="small"
                    style="width: 120px"
                  />
                </div>
                <div class="summary-item">
                  <span>优惠金额：</span>
                  <el-input-number
                    v-model="orderForm.discountAmount"
                    :min="0"
                    :max="productTotal"
                    :precision="2"
                    size="small"
                    style="width: 120px"
                  />
                </div>
                <div class="summary-item total">
                  <span>订单总额：</span>
                  <span>¥{{ orderTotal.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitOrderForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, View, Edit, Delete, Plus, Download, Refresh } from '@element-plus/icons-vue';

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  customerName: '',
  status: '',
  dateRange: []
});

// 订单状态选项
const statusOptions = [
  { value: 'pending', label: '待付款' },
  { value: 'paid', label: '已付款' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
];

// 订单列表数据
const orderList = ref([]);
const total = ref(0);
const loading = ref(false);
const selectedRows = ref([]);
const single = computed(() => selectedRows.value.length !== 1);
const multiple = computed(() => selectedRows.value.length === 0);

// 查看对话框
const viewDialog = reactive({
  visible: false
});

// 编辑对话框
const editDialog = reactive({
  visible: false,
  title: ''
});

// 当前激活的标签页
const activeTab = ref('basic');

// 订单详情
const orderDetail = reactive({
  orderNo: '',
  customerName: '',
  phone: '',
  address: '',
  status: '',
  paymentMethod: '',
  createTime: '',
  payTime: '',
  shipTime: '',
  completeTime: '',
  cancelTime: '',
  productAmount: 0,
  shippingFee: 0,
  discountAmount: 0,
  totalAmount: 0,
  remark: '',
  products: [],
  logs: []
});

// 订单表单
const orderFormRef = ref();
const orderForm = reactive({
  id: '',
  orderNo: '',
  customerName: '',
  phone: '',
  address: '',
  status: 'pending',
  paymentMethod: 'wechat',
  shippingFee: 0,
  discountAmount: 0,
  remark: ''
});

// 商品搜索
const productSearch = ref('');

// 可选商品列表
const availableProducts = ref([]);

// 已选商品列表
const selectedProducts = ref([]);

// 商品总金额
const productTotal = computed(() => {
  return selectedProducts.value.reduce((sum, item) => {
    return sum + (item.price * item.orderQuantity);
  }, 0);
});

// 订单总金额
const orderTotal = computed(() => {
  return productTotal.value + (orderForm.shippingFee || 0) - (orderForm.discountAmount || 0);
});

// 表单校验规则
const rules = {
  customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  address: [{ required: true, message: '请输入收货地址', trigger: 'blur' }],
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  status: [{ required: true, message: '请选择订单状态', trigger: 'change' }]
};

// 初始化
onMounted(() => {
  getOrderList();
  getProductList();
});

// 获取订单列表
const getOrderList = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    orderList.value = [
      {
        id: '1',
        orderNo: 'DD20230501001',
        customerName: '张三',
        phone: '13800138001',
        address: '北京市朝阳区某某街道1号',
        status: 'completed',
        paymentMethod: '微信支付',
        createTime: '2023-05-01 10:00:00',
        payTime: '2023-05-01 10:05:30',
        shipTime: '2023-05-01 14:20:00',
        completeTime: '2023-05-03 15:30:00',
        productAmount: 2000,
        shippingFee: 10,
        discountAmount: 200,
        totalAmount: 1810,
        remark: '请尽快发货'
      },
      {
        id: '2',
        orderNo: 'DD20230502001',
        customerName: '李四',
        phone: '13900139001',
        address: '上海市浦东新区某某路2号',
        status: 'shipped',
        paymentMethod: '支付宝',
        createTime: '2023-05-02 09:15:00',
        payTime: '2023-05-02 09:20:10',
        shipTime: '2023-05-02 13:40:00',
        productAmount: 3500,
        shippingFee: 0,
        discountAmount: 300,
        totalAmount: 3200,
        remark: ''
      },
      {
        id: '3',
        orderNo: 'DD20230503001',
        customerName: '王五',
        phone: '13700137001',
        address: '广州市天河区某某大道3号',
        status: 'paid',
        paymentMethod: '银行转账',
        createTime: '2023-05-03 14:30:00',
        payTime: '2023-05-03 14:45:20',
        productAmount: 1800,
        shippingFee: 15,
        discountAmount: 0,
        totalAmount: 1815,
        remark: '周末送货'
      },
      {
        id: '4',
        orderNo: 'DD20230504001',
        customerName: '赵六',
        phone: '13600136001',
        address: '深圳市南山区某某路4号',
        status: 'pending',
        paymentMethod: '货到付款',
        createTime: '2023-05-04 16:20:00',
        productAmount: 2500,
        shippingFee: 20,
        discountAmount: 100,
        totalAmount: 2420,
        remark: ''
      },
      {
        id: '5',
        orderNo: 'DD20230505001',
        customerName: '钱七',
        phone: '13500135001',
        address: '成都市武侯区某某街5号',
        status: 'cancelled',
        paymentMethod: '微信支付',
        createTime: '2023-05-05 11:10:00',
        cancelTime: '2023-05-05 15:30:00',
        productAmount: 1200,
        shippingFee: 10,
        discountAmount: 50,
        totalAmount: 1160,
        remark: '客户取消订单'
      }
    ];
    total.value = 5;
    loading.value = false;
  }, 500);
};

// 获取商品列表
const getProductList = () => {
  // 模拟API调用
  setTimeout(() => {
    availableProducts.value = [
      {
        id: '1',
        code: 'P0001',
        name: '苹果手机',
        specification: '128G',
        price: 5000,
        stock: 50,
        orderQuantity: 1,
        selected: false
      },
      {
        id: '2',
        code: 'P0002',
        name: '华为平板',
        specification: '10.8英寸',
        price: 3000,
        stock: 30,
        orderQuantity: 1,
        selected: false
      },
      {
        id: '3',
        code: 'P0003',
        name: '小米手环',
        specification: '标准版',
        price: 200,
        stock: 100,
        orderQuantity: 1,
        selected: false
      },
      {
        id: '4',
        code: 'P0004',
        name: '联想笔记本',
        specification: '14英寸',
        price: 4000,
        stock: 20,
        orderQuantity: 1,
        selected: false
      },
      {
        id: '5',
        code: 'P0005',
        name: '戴尔显示器',
        specification: '24英寸',
        price: 1200,
        stock: 40,
        orderQuantity: 1,
        selected: false
      }
    ];
  }, 300);
};

// 获取订单状态标签
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待付款',
    paid: '已付款',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
};

// 获取订单状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    shipped: 'info',
    completed: 'success',
    cancelled: 'danger'
  };
  return statusMap[status] || '';
};

// 获取日志类型
const getLogType = (type: string) => {
  const typeMap: Record<string, string> = {
    create: 'primary',
    pay: 'success',
    ship: 'info',
    complete: 'success',
    cancel: 'danger'
  };
  return typeMap[type] || '';
};

// 查询操作
const handleQuery = () => {
  queryParams.pageNum = 1;
  getOrderList();
};

// 重置查询
const resetQuery = () => {
  queryParams.orderNo = '';
  queryParams.customerName = '';
  queryParams.status = '';
  queryParams.dateRange = [];
  handleQuery();
};

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  getOrderList();
};

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val;
  getOrderList();
};

// 选择行
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection;
};

// 行点击
const handleRowClick = (row: any) => {
  // 实现单选效果
  orderList.value.forEach((item: any) => {
    item.selected = false;
  });
  row.selected = true;
  selectedRows.value = [row];
};

// 查看详情
const handleView = (row?: any) => {
  const order = row || selectedRows.value[0];
  if (!order && !row) {
    ElMessage.warning('请选择要查看的订单');
    return;
  }
  
  viewDialog.visible = true;
  
  // 填充详情表单
  Object.assign(orderDetail, order);
  
  // 获取订单商品
  getOrderProducts(order.id);
  
  // 获取订单日志
  getOrderLogs(order.id);
};

// 获取订单商品
const getOrderProducts = (id: string) => {
  // 模拟API调用
  setTimeout(() => {
    if (id === '1') {
      orderDetail.products = [
        {
          code: 'P0001',
          name: '苹果手机',
          specification: '128G',
          price: 5000,
          quantity: 1
        },
        {
          code: 'P0003',
          name: '小米手环',
          specification: '标准版',
          price: 200,
          quantity: 2
        }
      ];
    } else if (id === '2') {
      orderDetail.products = [
        {
          code: 'P0002',
          name: '华为平板',
          specification: '10.8英寸',
          price: 3000,
          quantity: 1
        },
        {
          code: 'P0002',
          name: '华为平板',
          specification: '10.8英寸',
          price: 3000,
          quantity: 1
        },
        {
          code: 'P0005',
          name: '戴尔显示器',
          specification: '24英寸',
          price: 1200,
          quantity: 1
        }
      ];
    } else if (id === '3') {
      orderDetail.products = [
        {
          code: 'P0004',
          name: '联想笔记本',
          specification: '14英寸',
          price: 4000,
          quantity: 1
        }
      ];
    } else if (id === '4') {
      orderDetail.products = [
        {
          code: 'P0001',
          name: '苹果手机',
          specification: '128G',
          price: 5000,
          quantity: 1
        }
      ];
    } else if (id === '5') {
      orderDetail.products = [
        {
          code: 'P0003',
          name: '小米手环',
          specification: '标准版',
          price: 200,
          quantity: 6
        }
      ];
    } else {
      orderDetail.products = [];
    }
  }, 300);
};

// 获取订单日志
const getOrderLogs = (id: string) => {
  // 模拟API调用
  setTimeout(() => {
    if (id === '1') {
      orderDetail.logs = [
        {
          operateType: 'create',
          operateBy: '张三',
          operateContent: '创建了订单',
          operateTime: '2023-05-01 10:00:00'
        },
        {
          operateType: 'pay',
          operateBy: '张三',
          operateContent: '支付了订单',
          operateTime: '2023-05-01 10:05:30'
        },
        {
          operateType: 'ship',
          operateBy: '李四',
          operateContent: '发货了订单',
          operateTime: '2023-05-01 14:20:00'
        },
        {
          operateType: 'complete',
          operateBy: '系统',
          operateContent: '完成了订单',
          operateTime: '2023-05-03 15:30:00'
        }
      ];
    } else if (id === '2') {
      orderDetail.logs = [
        {
          operateType: 'create',
          operateBy: '李四',
          operateContent: '创建了订单',
          operateTime: '2023-05-02 09:15:00'
        },
        {
          operateType: 'pay',
          operateBy: '李四',
          operateContent: '支付了订单',
          operateTime: '2023-05-02 09:20:10'
        },
        {
          operateType: 'ship',
          operateBy: '王五',
          operateContent: '发货了订单',
          operateTime: '2023-05-02 13:40:00'
        }
      ];
    } else if (id === '3') {
      orderDetail.logs = [
        {
          operateType: 'create',
          operateBy: '王五',
          operateContent: '创建了订单',
          operateTime: '2023-05-03 14:30:00'
        },
        {
          operateType: 'pay',
          operateBy: '王五',
          operateContent: '支付了订单',
          operateTime: '2023-05-03 14:45:20'
        }
      ];
    } else if (id === '4') {
      orderDetail.logs = [
        {
          operateType: 'create',
          operateBy: '赵六',
          operateContent: '创建了订单',
          operateTime: '2023-05-04 16:20:00'
        }
      ];
    } else if (id === '5') {
      orderDetail.logs = [
        {
          operateType: 'create',
          operateBy: '钱七',
          operateContent: '创建了订单',
          operateTime: '2023-05-05 11:10:00'
        },
        {
          operateType: 'cancel',
          operateBy: '钱七',
          operateContent: '取消了订单',
          operateTime: '2023-05-05 15:30:00'
        }
      ];
    } else {
      orderDetail.logs = [];
    }
  }, 300);
};

// 打印订单
const handlePrint = () => {
  window.print();
};

// 新增订单
const handleAdd = () => {
  editDialog.title = '新增订单';
  editDialog.visible = true;
  activeTab.value = 'basic';
  
  // 重置表单
  orderForm.id = '';
  orderForm.orderNo = '';
  orderForm.customerName = '';
  orderForm.phone = '';
  orderForm.address = '';
  orderForm.status = 'pending';
  orderForm.paymentMethod = 'wechat';
  orderForm.shippingFee = 0;
  orderForm.discountAmount = 0;
  orderForm.remark = '';
  
  // 清空已选商品
  selectedProducts.value = [];
  
  // 重置商品选择状态
  availableProducts.value.forEach(item => {
    item.selected = false;
    item.orderQuantity = 1;
  });
};

// 编辑订单
const handleEdit = (row?: any) => {
  const order = row || selectedRows.value[0];
  if (!order && !row) {
    ElMessage.warning('请选择要编辑的订单');
    return;
  }
  
  if (['completed', 'cancelled'].includes(order.status)) {
    ElMessage.warning('已完成或已取消的订单不能编辑');
    return;
  }
  
  editDialog.title = '编辑订单';
  editDialog.visible = true;
  activeTab.value = 'basic';
  
  // 填充表单
  orderForm.id = order.id;
  orderForm.orderNo = order.orderNo;
  orderForm.customerName = order.customerName;
  orderForm.phone = order.phone;
  orderForm.address = order.address;
  orderForm.status = order.status;
  orderForm.paymentMethod = order.paymentMethod === '微信支付' ? 'wechat' : 
                           order.paymentMethod === '支付宝' ? 'alipay' : 
                           order.paymentMethod === '银行转账' ? 'bank' : 'cod';
  orderForm.shippingFee = order.shippingFee;
  orderForm.discountAmount = order.discountAmount;
  orderForm.remark = order.remark;
  
  // 获取订单商品
  getOrderProductsForEdit(order.id);
};

// 获取订单商品用于编辑
const getOrderProductsForEdit = (id: string) => {
  // 模拟API调用
  setTimeout(() => {
    // 重置商品选择状态
    availableProducts.value.forEach(item => {
      item.selected = false;
      item.orderQuantity = 1;
    });
    
    // 清空已选商品
    selectedProducts.value = [];
    
    if (id === '1') {
      // 找到对应商品并设置为已选
      const product1 = availableProducts.value.find(item => item.code === 'P0001');
      const product2 = availableProducts.value.find(item => item.code === 'P0003');
      
      if (product1) {
        product1.selected = true;
        product1.orderQuantity = 1;
        selectedProducts.value.push({ ...product1 });
      }
      
      if (product2) {
        product2.selected = true;
        product2.orderQuantity = 2;
        selectedProducts.value.push({ ...product2, orderQuantity: 2 });
      }
    } else if (id === '2') {
      const product1 = availableProducts.value.find(item => item.code === 'P0002');
      const product2 = availableProducts.value.find(item => item.code === 'P0005');
      
      if (product1) {
        product1.selected = true;
        product1.orderQuantity = 1;
        selectedProducts.value.push({ ...product1 });
      }
      
      if (product2) {
        product2.selected = true;
        product2.orderQuantity = 1;
        selectedProducts.value.push({ ...product2 });
      }
    } else if (id === '3') {
      const product = availableProducts.value.find(item => item.code === 'P0004');
      
      if (product) {
        product.selected = true;
        product.orderQuantity = 1;
        selectedProducts.value.push({ ...product });
      }
    } else if (id === '4') {
      const product = availableProducts.value.find(item => item.code === 'P0001');
      
      if (product) {
        product.selected = true;
        product.orderQuantity = 1;
        selectedProducts.value.push({ ...product });
      }
    } else if (id === '5') {
      const product = availableProducts.value.find(item => item.code === 'P0003');
      
      if (product) {
        product.selected = true;
        product.orderQuantity = 6;
        selectedProducts.value.push({ ...product, orderQuantity: 6 });
      }
    }
  }, 300);
};

// 删除订单
const handleDelete = (row?: any) => {
  const orders = row ? [row] : selectedRows.value;
  if (orders.length === 0) {
    ElMessage.warning('请选择要删除的订单');
    return;
  }
  
  // 检查是否有不能删除的订单
  const invalidOrders = orders.filter(order => order.status !== 'pending');
  if (invalidOrders.length > 0) {
    ElMessage.warning('只能删除待付款状态的订单');
    return;
  }
  
  const orderNos = orders.map((order: any) => order.orderNo).join('、');
  
  ElMessageBox.confirm(`确认要删除订单"${orderNos}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 从列表中移除
      orders.forEach((order: any) => {
        const index = orderList.value.findIndex((item: any) => item.id === order.id);
        if (index !== -1) {
          orderList.value.splice(index, 1);
        }
      });
      
      // 更新总数
      total.value = orderList.value.length;
      
      // 清空选中
      selectedRows.value = [];
      
      ElMessage.success('删除成功');
    }, 300);
  }).catch(() => {});
};

// 导出订单
const handleExport = () => {
  ElMessage.success('订单数据导出成功');
};

// 搜索商品
const searchProducts = () => {
  // 模拟搜索
  if (productSearch.value) {
    const keyword = productSearch.value.toLowerCase();
    const originalProducts = [...availableProducts.value];
    
    // 过滤商品
    availableProducts.value = originalProducts.filter(item => 
      item.code.toLowerCase().includes(keyword) || 
      item.name.toLowerCase().includes(keyword)
    );
  } else {
    // 如果搜索关键字为空，重新加载所有商品
    getProductList();
  }
};

// 商品选择变更
const handleProductSelectionChange = (selection: any[]) => {
  // 更新选中状态
  availableProducts.value.forEach(item => {
    item.selected = selection.some(selected => selected.id === item.id);
  });
  
  // 更新已选商品列表
  selectedProducts.value = selection.map(item => ({
    ...item,
    amount: item.orderQuantity * item.price
  }));
};

// 数量变更
const handleQuantityChange = () => {
  // 同步已选商品的数量
  selectedProducts.value.forEach(selected => {
    const available = availableProducts.value.find(item => item.id === selected.id);
    if (available) {
      selected.orderQuantity = available.orderQuantity;
    }
  });
};

// 移除已选商品
const removeSelectedProduct = (index: number) => {
  const removedProduct = selectedProducts.value[index];
  
  // 更新可选商品列表中的选中状态
  const availableIndex = availableProducts.value.findIndex(item => item.id === removedProduct.id);
  if (availableIndex !== -1) {
    availableProducts.value[availableIndex].selected = false;
  }
  
  // 从已选商品列表中移除
  selectedProducts.value.splice(index, 1);
};

// 提交表单
const submitOrderForm = () => {
  orderFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    
    if (selectedProducts.value.length === 0) {
      ElMessage.warning('请至少选择一个商品');
      activeTab.value = 'products';
      return;
    }
    
    // 模拟API调用
    setTimeout(() => {
      if (orderForm.id) {
        // 编辑订单
        const index = orderList.value.findIndex((item: any) => item.id === orderForm.id);
        if (index !== -1) {
          // 计算商品总金额
          const productAmount = selectedProducts.value.reduce((sum, item) => {
            return sum + (item.price * item.orderQuantity);
          }, 0);
          
          // 计算订单总金额
          const totalAmount = productAmount + orderForm.shippingFee - orderForm.discountAmount;
          
          // 更新订单
          orderList.value[index] = {
            ...orderList.value[index],
            customerName: orderForm.customerName,
            phone: orderForm.phone,
            address: orderForm.address,
            status: orderForm.status,
            paymentMethod: orderForm.paymentMethod === 'wechat' ? '微信支付' : 
                          orderForm.paymentMethod === 'alipay' ? '支付宝' : 
                          orderForm.paymentMethod === 'bank' ? '银行转账' : '货到付款',
            productAmount,
            shippingFee: orderForm.shippingFee,
            discountAmount: orderForm.discountAmount,
            totalAmount,
            remark: orderForm.remark
          };
          
          ElMessage.success('订单更新成功');
        }
      } else {
        // 新增订单
        // 生成订单号
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderNo = `DD${year}${month}${day}${random}`;
        
        // 计算商品总金额
        const productAmount = selectedProducts.value.reduce((sum, item) => {
          return sum + (item.price * item.orderQuantity);
        }, 0);
        
        // 计算订单总金额
        const totalAmount = productAmount + orderForm.shippingFee - orderForm.discountAmount;
        
        // 构建新订单
        const newOrder = {
          id: (orderList.value.length + 1).toString(),
          orderNo,
          customerName: orderForm.customerName,
          phone: orderForm.phone,
          address: orderForm.address,
          status: orderForm.status,
          paymentMethod: orderForm.paymentMethod === 'wechat' ? '微信支付' : 
                        orderForm.paymentMethod === 'alipay' ? '支付宝' : 
                        orderForm.paymentMethod === 'bank' ? '银行转账' : '货到付款',
          createTime: `${year}-${month}-${day} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
          productAmount,
          shippingFee: orderForm.shippingFee,
          discountAmount: orderForm.discountAmount,
          totalAmount,
          remark: orderForm.remark
        };
        
        // 添加到列表
        orderList.value.unshift(newOrder);
        total.value = orderList.value.length;
        
        ElMessage.success('订单创建成功');
      }
      
      editDialog.visible = false;
    }, 500);
  });
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

.table-container {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .right-buttons {
    display: flex;
    gap: 10px;
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.order-products,
.order-logs,
.selected-products {
  margin-top: 20px;
  
  .title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
    padding-left: 5px;
    border-left: 3px solid #409EFF;
  }
}

.order-summary {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  
  .summary-item {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 5px;
    
    span:first-child {
      margin-right: 10px;
    }
    
    &.total {
      font-size: 16px;
      font-weight: bold;
      color: #f56c6c;
      margin-top: 5px;
    }
  }
}

.product-search {
  margin-bottom: 15px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

@media print {
  .el-button {
    display: none;
  }
  
  .el-dialog__header,
  .el-dialog__footer {
    display: none;
  }
}
</style>