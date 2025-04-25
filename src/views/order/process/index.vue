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

    <!-- 订单列表 -->
    <el-card class="table-container">
      <template #header>
        <div class="card-header">
          <span>待处理订单</span>
          <div class="right-buttons">
            <el-button type="primary" icon="Printer" @click="handleBatchPrint">批量打印</el-button>
            <el-button type="success" icon="Van" :disabled="multiple" @click="handleBatchShip">批量发货</el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="orderList"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="订单编号" prop="orderNo" width="180" />
        <el-table-column label="客户名称" prop="customerName" min-width="120" show-overflow-tooltip />
        <el-table-column label="联系电话" prop="phone" width="120" show-overflow-tooltip />
        <el-table-column label="订单金额" prop="totalAmount" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="支付方式" prop="paymentMethod" width="100" />
        <el-table-column label="支付时间" prop="payTime" width="160" />
        <el-table-column label="下单时间" prop="createTime" width="160" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="text" icon="View" @click="handleView(scope.row)">查看</el-button>
            <el-button type="text" icon="Printer" @click="handlePrint(scope.row)">打印</el-button>
            <el-button type="text" icon="Van" @click="handleShip(scope.row)">发货</el-button>
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
          <el-tag type="success">已付款</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ orderDetail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ orderDetail.phone }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ orderDetail.address }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ orderDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ orderDetail.paymentMethod }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ orderDetail.payTime }}</el-descriptions-item>
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

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="viewDialog.visible = false">关闭</el-button>
          <el-button type="primary" @click="handlePrint(orderDetail)">打印订单</el-button>
          <el-button type="success" @click="handleShip(orderDetail)">发货</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 发货对话框 -->
    <el-dialog title="订单发货" v-model="shipDialog.visible" width="500px" append-to-body>
      <el-form ref="shipFormRef" :model="shipForm" :rules="shipRules" label-width="100px">
        <el-form-item label="订单编号">
          <span>{{ shipForm.orderNo }}</span>
        </el-form-item>
        <el-form-item label="客户名称">
          <span>{{ shipForm.customerName }}</span>
        </el-form-item>
        <el-form-item label="物流公司" prop="logisticsCompany">
          <el-select v-model="shipForm.logisticsCompany" placeholder="请选择物流公司" style="width: 100%">
            <el-option label="顺丰速运" value="SF" />
            <el-option label="中通快递" value="ZTO" />
            <el-option label="圆通速递" value="YTO" />
            <el-option label="韵达快递" value="YD" />
            <el-option label="申通快递" value="STO" />
            <el-option label="京东物流" value="JD" />
            <el-option label="邮政EMS" value="EMS" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号" prop="trackingNo">
          <el-input v-model="shipForm.trackingNo" placeholder="请输入物流单号" />
        </el-form-item>
        <el-form-item label="发货备注" prop="remark">
          <el-input
            v-model="shipForm.remark"
            type="textarea"
            placeholder="请输入发货备注"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="shipDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitShipForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量发货对话框 -->
    <el-dialog title="批量发货" v-model="batchShipDialog.visible" width="800px" append-to-body>
      <el-form ref="batchShipFormRef" :model="batchShipForm" :rules="batchShipRules" label-width="100px">
        <el-form-item label="物流公司" prop="logisticsCompany">
          <el-select v-model="batchShipForm.logisticsCompany" placeholder="请选择物流公司" style="width: 300px">
            <el-option label="顺丰速运" value="SF" />
            <el-option label="中通快递" value="ZTO" />
            <el-option label="圆通速递" value="YTO" />
            <el-option label="韵达快递" value="YD" />
            <el-option label="申通快递" value="STO" />
            <el-option label="京东物流" value="JD" />
            <el-option label="邮政EMS" value="EMS" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="selectedOrders" border>
        <el-table-column label="订单编号" prop="orderNo" width="180" />
        <el-table-column label="客户名称" prop="customerName" min-width="120" show-overflow-tooltip />
        <el-table-column label="物流单号" width="200">
          <template #default="scope">
            <el-input v-model="scope.row.trackingNo" placeholder="请输入物流单号" />
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchShipDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitBatchShipForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, View, Printer, Van, Refresh } from '@element-plus/icons-vue';

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  customerName: '',
  dateRange: []
});

// 订单列表数据
const orderList = ref([]);
const total = ref(0);
const loading = ref(false);
const selectedRows = ref([]);
const multiple = computed(() => selectedRows.value.length === 0);

// 查看对话框
const viewDialog = reactive({
  visible: false
});

// 发货对话框
const shipDialog = reactive({
  visible: false
});

// 批量发货对话框
const batchShipDialog = reactive({
  visible: false
});

// 订单详情
const orderDetail = reactive({
  id: '',
  orderNo: '',
  customerName: '',
  phone: '',
  address: '',
  status: 'paid',
  paymentMethod: '',
  createTime: '',
  payTime: '',
  productAmount: 0,
  shippingFee: 0,
  discountAmount: 0,
  totalAmount: 0,
  remark: '',
  products: []
});

// 发货表单
const shipFormRef = ref();
const shipForm = reactive({
  id: '',
  orderNo: '',
  customerName: '',
  logisticsCompany: '',
  trackingNo: '',
  remark: ''
});

// 批量发货表单
const batchShipFormRef = ref();
const batchShipForm = reactive({
  logisticsCompany: ''
});

// 已选择的订单（用于批量发货）
const selectedOrders = ref([]);

// 表单校验规则
const shipRules = {
  logisticsCompany: [{ required: true, message: '请选择物流公司', trigger: 'change' }],
  trackingNo: [{ required: true, message: '请输入物流单号', trigger: 'blur' }]
};

const batchShipRules = {
  logisticsCompany: [{ required: true, message: '请选择物流公司', trigger: 'change' }]
};

// 初始化
onMounted(() => {
  getOrderList();
});

// 获取订单列表
const getOrderList = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    orderList.value = [
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
        id: '6',
        orderNo: 'DD20230506001',
        customerName: '孙八',
        phone: '13400134001',
        address: '杭州市西湖区某某路6号',
        status: 'paid',
        paymentMethod: '微信支付',
        createTime: '2023-05-06 08:30:00',
        payTime: '2023-05-06 08:35:15',
        productAmount: 3200,
        shippingFee: 0,
        discountAmount: 150,
        totalAmount: 3050,
        remark: ''
      },
      {
        id: '7',
        orderNo: 'DD20230507001',
        customerName: '周九',
        phone: '13300133001',
        address: '南京市鼓楼区某某街7号',
        status: 'paid',
        paymentMethod: '支付宝',
        createTime: '2023-05-07 16:45:00',
        payTime: '2023-05-07 16:50:30',
        productAmount: 1500,
        shippingFee: 10,
        discountAmount: 0,
        totalAmount: 1510,
        remark: '请使用泡沫包装'
      }
    ];
    total.value = 3;
    loading.value = false;
  }, 500);
};

// 获取订单商品
const getOrderProducts = (id: string) => {
  // 模拟API调用
  setTimeout(() => {
    if (id === '3') {
      orderDetail.products = [
        {
          code: 'P0004',
          name: '联想笔记本',
          specification: '14英寸',
          price: 4000,
          quantity: 1
        }
      ];
    } else if (id === '6') {
      orderDetail.products = [
        {
          code: 'P0002',
          name: '华为平板',
          specification: '10.8英寸',
          price: 3000,
          quantity: 1
        },
        {
          code: 'P0003',
          name: '小米手环',
          specification: '标准版',
          price: 200,
          quantity: 1
        }
      ];
    } else if (id === '7') {
      orderDetail.products = [
        {
          code: 'P0005',
          name: '戴尔显示器',
          specification: '24英寸',
          price: 1200,
          quantity: 1
        },
        {
          code: 'P0003',
          name: '小米手环',
          specification: '标准版',
          price: 200,
          quantity: 1
        },
        {
          code: 'P0003',
          name: '小米手环',
          specification: '标准版',
          price: 200,
          quantity: 1
        }
      ];
    } else {
      orderDetail.products = [];
    }
  }, 300);
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

// 查看详情
const handleView = (row: any) => {
  viewDialog.visible = true;
  
  // 填充详情表单
  Object.assign(orderDetail, row);
  
  // 获取订单商品
  getOrderProducts(row.id);
};

// 打印订单
const handlePrint = (row: any) => {
  ElMessage.success(`打印订单：${row.orderNo}`);
  window.print();
};

// 批量打印
const handleBatchPrint = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要打印的订单');
    return;
  }
  
  const orderNos = selectedRows.value.map((order: any) => order.orderNo).join('、');
  ElMessage.success(`批量打印订单：${orderNos}`);
  window.print();
};

// 发货
const handleShip = (row: any) => {
  shipDialog.visible = true;
  
  // 填充发货表单
  shipForm.id = row.id;
  shipForm.orderNo = row.orderNo;
  shipForm.customerName = row.customerName;
  shipForm.logisticsCompany = '';
  shipForm.trackingNo = '';
  shipForm.remark = '';
};

// 批量发货
const handleBatchShip = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要发货的订单');
    return;
  }
  
  batchShipDialog.visible = true;
  batchShipForm.logisticsCompany = '';
  
  // 填充已选订单
  selectedOrders.value = selectedRows.value.map((order: any) => ({
    id: order.id,
    orderNo: order.orderNo,
    customerName: order.customerName,
    trackingNo: ''
  }));
};

// 提交发货表单
const submitShipForm = () => {
  shipFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    
    // 模拟API调用
    setTimeout(() => {
      // 更新订单状态
      const index = orderList.value.findIndex((item: any) => item.id === shipForm.id);
      if (index !== -1) {
        // 从列表中移除
        orderList.value.splice(index, 1);
        total.value = orderList.value.length;
      }
      
      ElMessage.success(`订单 ${shipForm.orderNo} 发货成功`);
      shipDialog.visible = false;
    }, 500);
  });
};

// 提交批量发货表单
const submitBatchShipForm = () => {
  batchShipFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    
    // 检查是否所有订单都填写了物流单号
    const invalidOrders = selectedOrders.value.filter(order => !order.trackingNo);
    if (invalidOrders.length > 0) {
      ElMessage.warning('请为所有订单填写物流单号');
      return;
    }
    
    // 模拟API调用
    setTimeout(() => {
      // 更新订单状态
      const orderIds = selectedOrders.value.map(order => order.id);
      
      // 从列表中移除已发货的订单
      orderList.value = orderList.value.filter((item: any) => !orderIds.includes(item.id));
      total.value = orderList.value.length;
      
      // 清空选中
      selectedRows.value = [];
      
      ElMessage.success('批量发货成功');
      batchShipDialog.visible = false;
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

.order-products {
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