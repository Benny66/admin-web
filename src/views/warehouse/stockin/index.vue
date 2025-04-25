<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div class="filter-item">
        <el-form :inline="true" :model="queryParams" @keyup.enter="handleQuery">
          <el-form-item label="入库单号">
            <el-input v-model="queryParams.stockInNo" placeholder="请输入入库单号" clearable />
          </el-form-item>
          <el-form-item label="入库类型">
            <el-select v-model="queryParams.stockInType" placeholder="请选择入库类型" clearable>
              <el-option label="采购入库" value="purchase" />
              <el-option label="退货入库" value="return" />
              <el-option label="调拨入库" value="transfer" />
              <el-option label="其他入库" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="仓库">
            <el-select v-model="queryParams.warehouseId" placeholder="请选择仓库" clearable>
              <el-option
                v-for="item in warehouseOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="入库状态">
            <el-select v-model="queryParams.status" placeholder="请选择入库状态" clearable>
              <el-option label="待审核" value="pending" />
              <el-option label="已审核" value="approved" />
              <el-option label="已入库" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="queryParams.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="operation-container">
        <el-button type="primary" @click="handleAdd">新增入库单</el-button>
        <el-button type="success" :disabled="single" @click="handleApprove">审核</el-button>
        <el-button type="info" :disabled="single" @click="handleComplete">入库</el-button>
        <el-button type="danger" :disabled="single" @click="handleCancel">取消</el-button>
        <el-button type="warning" @click="handleExport">导出</el-button>
      </div>
    </el-card>

    <el-card class="table-container">
      <el-table
        v-loading="loading"
        :data="stockInList"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="stockInNo" label="入库单号" min-width="150" />
        <el-table-column prop="stockInType" label="入库类型" width="100">
          <template #default="scope">
            {{ getStockInTypeLabel(scope.row.stockInType) }}
          </template>
        </el-table-column>
        <el-table-column prop="warehouseName" label="仓库" width="120" />
        <el-table-column prop="productCount" label="商品种类" width="100" align="center" />
        <el-table-column prop="totalQuantity" label="总数量" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createBy" label="创建人" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="primary" link @click.stop="handleView(scope.row)">查看</el-button>
            <el-button 
              v-if="scope.row.status === 'pending'" 
              type="success" 
              link 
              @click.stop="handleApprove(scope.row)"
            >审核</el-button>
            <el-button 
              v-if="scope.row.status === 'approved'" 
              type="info" 
              link 
              @click.stop="handleComplete(scope.row)"
            >入库</el-button>
            <el-button 
              v-if="['pending', 'approved'].includes(scope.row.status)" 
              type="danger" 
              link 
              @click.stop="handleCancel(scope.row)"
            >取消</el-button>
          </template>
        </el-table-column>
      </el-table>
      
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

    <!-- 查看入库单详情对话框 -->
    <el-dialog
      title="入库单详情"
      v-model="viewDialog.visible"
      width="900px"
      append-to-body
    >
      <el-descriptions title="基本信息" :column="3" border>
        <el-descriptions-item label="入库单号">{{ detailForm.stockInNo }}</el-descriptions-item>
        <el-descriptions-item label="入库类型">{{ getStockInTypeLabel(detailForm.stockInType) }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detailForm.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailForm.status)">
            {{ getStatusLabel(detailForm.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detailForm.createBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailForm.createTime }}</el-descriptions-item>
        <el-descriptions-item label="审核人" v-if="detailForm.approveBy">{{ detailForm.approveBy }}</el-descriptions-item>
        <el-descriptions-item label="审核时间" v-if="detailForm.approveTime">{{ detailForm.approveTime }}</el-descriptions-item>
        <el-descriptions-item label="入库人" v-if="detailForm.completeBy">{{ detailForm.completeBy }}</el-descriptions-item>
        <el-descriptions-item label="入库时间" v-if="detailForm.completeTime">{{ detailForm.completeTime }}</el-descriptions-item>
        <el-descriptions-item label="取消人" v-if="detailForm.cancelBy">{{ detailForm.cancelBy }}</el-descriptions-item>
        <el-descriptions-item label="取消时间" v-if="detailForm.cancelTime">{{ detailForm.cancelTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ detailForm.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-products">
        <div class="title">入库商品</div>
        <el-table :data="detailProducts" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="code" label="商品编码" width="120" />
          <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="specification" label="规格" width="120" />
          <el-table-column prop="unit" label="单位" width="80" align="center" />
          <el-table-column prop="quantity" label="入库数量" width="100" align="center" />
          <el-table-column prop="price" label="单价(元)" width="100" align="center" />
          <el-table-column prop="amount" label="金额(元)" width="120" align="center" />
          <el-table-column prop="targetLocation" label="入库位置" width="150" show-overflow-tooltip />
        </el-table>
      </div>
      
      <div class="detail-logs" v-if="detailLogs.length > 0">
        <div class="title">操作日志</div>
        <el-timeline>
          <el-timeline-item
            v-for="(log, index) in detailLogs"
            :key="index"
            :timestamp="log.operateTime"
            :type="getLogType(log.operateType)"
          >
            {{ log.operateBy }} {{ log.operateContent }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <!-- 新增入库单对话框 -->
    <el-dialog
      title="新增入库单"
      v-model="addDialog.visible"
      width="900px"
      append-to-body
      :close-on-click-modal="false"
      :before-close="handleClose"
    >
      <el-form
        ref="stockInFormRef"
        :model="stockInForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="入库类型" prop="stockInType">
          <el-select 
            v-model="stockInForm.stockInType" 
            placeholder="请选择入库类型" 
            style="width: 100%"
          >
            <el-option label="采购入库" value="purchase" />
            <el-option label="退货入库" value="return" />
            <el-option label="调拨入库" value="transfer" />
            <el-option label="其他入库" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库" prop="warehouseId">
          <el-select 
            v-model="stockInForm.warehouseId" 
            placeholder="请选择仓库" 
            style="width: 100%"
            @change="handleWarehouseChange"
          >
            <el-option
              v-for="item in warehouseOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="stockInForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <div class="product-selection">
        <div class="title">添加商品</div>
        <div class="add-product-form">
          <el-form :inline="true" :model="productForm" ref="productFormRef" :rules="productRules">
            <el-form-item label="商品编码" prop="code">
              <el-input v-model="productForm.code" placeholder="请输入商品编码" />
            </el-form-item>
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="productForm.name" placeholder="请输入商品名称" />
            </el-form-item>
            <el-form-item label="规格" prop="specification">
              <el-input v-model="productForm.specification" placeholder="请输入规格" />
            </el-form-item>
            <el-form-item label="单位" prop="unit">
              <el-input v-model="productForm.unit" placeholder="请输入单位" />
            </el-form-item>
            <el-form-item label="数量" prop="quantity">
              <el-input-number v-model="productForm.quantity" :min="1" :precision="0" />
            </el-form-item>
            <el-form-item label="单价" prop="price">
              <el-input-number v-model="productForm.price" :min="0" :precision="2" />
            </el-form-item>
            <el-form-item label="入库位置" prop="targetLocation">
              <el-select v-model="productForm.targetLocation" placeholder="请选择入库位置">
                <el-option
                  v-for="item in locationOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addProduct">添加</el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <div class="selected-products" v-if="selectedProducts.length > 0">
          <div class="title">已添加商品</div>
          <el-table
            :data="selectedProducts"
            border
            style="width: 100%"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="code" label="商品编码" width="120" />
            <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="specification" label="规格" width="120" />
            <el-table-column prop="unit" label="单位" width="80" align="center" />
            <el-table-column prop="quantity" label="数量" width="80" align="center" />
            <el-table-column prop="price" label="单价(元)" width="100" align="center" />
            <el-table-column prop="amount" label="金额(元)" width="120" align="center" />
            <el-table-column prop="targetLocation" label="入库位置" width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="80" align="center">
              <template #default="scope">
                <el-button type="danger" link @click="removeProduct(scope.$index)">
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="total-amount">
            总金额: {{ totalAmount.toFixed(2) }} 元
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="submitStockInForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  stockInNo: '',
  stockInType: '',
  warehouseId: '',
  status: '',
  dateRange: []
});

// 仓库选项
const warehouseOptions = ref([
  { id: '1', name: '北京仓库' },
  { id: '2', name: '上海仓库' },
  { id: '3', name: '广州仓库' },
  { id: '4', name: '成都仓库' },
  { id: '5', name: '深圳仓库' }
]);

// 入库位置选项
const locationOptions = ref([
  { value: '库区A-货架1-A01', label: '库区A-货架1-A01' },
  { value: '库区A-货架1-A02', label: '库区A-货架1-A02' },
  { value: '库区A-货架2-B01', label: '库区A-货架2-B01' },
  { value: '库区B-货架1-C01', label: '库区B-货架1-C01' },
  { value: '库区B-货架2-D01', label: '库区B-货架2-D01' }
]);

// 入库单列表数据
const stockInList = ref([]);
const total = ref(0);
const loading = ref(false);
const selectedRow = ref<any>(null);
const single = computed(() => !selectedRow.value);

// 查看对话框
const viewDialog = reactive({
  visible: false
});

// 新增对话框
const addDialog = reactive({
  visible: false
});

// 详情表单
const detailForm = reactive({
  id: '',
  stockInNo: '',
  stockInType: '',
  warehouseId: '',
  warehouseName: '',
  productCount: 0,
  totalQuantity: 0,
  totalAmount: 0,
  status: '',
  createBy: '',
  createTime: '',
  approveBy: '',
  approveTime: '',
  completeBy: '',
  completeTime: '',
  cancelBy: '',
  cancelTime: '',
  remark: ''
});

// 详情商品列表
const detailProducts = ref([]);

// 详情日志列表
const detailLogs = ref([]);

// 新增表单
const stockInFormRef = ref();
const stockInForm = reactive({
  stockInType: 'purchase',
  warehouseId: '',
  remark: ''
});

// 商品表单
const productFormRef = ref();
const productForm = reactive({
  code: '',
  name: '',
  specification: '',
  unit: '',
  quantity: 1,
  price: 0,
  targetLocation: ''
});

// 已选商品列表
const selectedProducts = ref([]);

// 总金额
const totalAmount = computed(() => {
  return selectedProducts.value.reduce((sum, item) => sum + item.amount, 0);
});

// 表单校验规则
const rules = {
  stockInType: [{ required: true, message: '请选择入库类型', trigger: 'change' }],
  warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }]
};

// 商品表单校验规则
const productRules = {
  code: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  targetLocation: [{ required: true, message: '请选择入库位置', trigger: 'change' }]
};

// 初始化
onMounted(() => {
  getStockInList();
});

// 获取入库单列表
const getStockInList = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    stockInList.value = [
      {
        id: '1',
        stockInNo: 'RK20230501001',
        stockInType: 'purchase',
        warehouseId: '1',
        warehouseName: '北京仓库',
        productCount: 3,
        totalQuantity: 50,
        totalAmount: 25000,
        status: 'completed',
        createBy: '张三',
        createTime: '2023-05-01 10:00:00',
        approveBy: '李四',
        approveTime: '2023-05-01 11:00:00',
        completeBy: '王五',
        completeTime: '2023-05-01 14:00:00'
      },
      {
        id: '2',
        stockInNo: 'RK20230502001',
        stockInType: 'return',
        warehouseId: '2',
        warehouseName: '上海仓库',
        productCount: 2,
        totalQuantity: 30,
        totalAmount: 15000,
        status: 'approved',
        createBy: '李四',
        createTime: '2023-05-02 10:00:00',
        approveBy: '王五',
        approveTime: '2023-05-02 11:00:00'
      },
      {
        id: '3',
        stockInNo: 'RK20230503001',
        stockInType: 'transfer',
        warehouseId: '3',
        warehouseName: '广州仓库',
        productCount: 4,
        totalQuantity: 100,
        totalAmount: 50000,
        status: 'pending',
        createBy: '王五',
        createTime: '2023-05-03 10:00:00'
      },
      {
        id: '4',
        stockInNo: 'RK20230504001',
        stockInType: 'other',
        warehouseId: '4',
        warehouseName: '成都仓库',
        productCount: 1,
        totalQuantity: 20,
        totalAmount: 10000,
        status: 'cancelled',
        createBy: '赵六',
        createTime: '2023-05-04 10:00:00',
        cancelBy: '赵六',
        cancelTime: '2023-05-04 11:00:00'
      }
    ];
    total.value = 4;
    loading.value = false;
  }, 500);
};

// 获取入库类型标签
const getStockInTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    purchase: '采购入库',
    return: '退货入库',
    transfer: '调拨入库',
    other: '其他入库'
  };
  return typeMap[type] || type;
};

// 获取状态标签
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已审核',
    completed: '已入库',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
};

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    completed: 'info',
    cancelled: 'danger'
  };
  return statusMap[status] || '';
};

// 获取日志类型
const getLogType = (type: string) => {
  const typeMap: Record<string, string> = {
    create: 'primary',
    approve: 'success',
    complete: 'info',
    cancel: 'danger'
  };
  return typeMap[type] || '';
};

// 查询操作
const handleQuery = () => {
  queryParams.pageNum = 1;
  getStockInList();
};

// 重置查询
const resetQuery = () => {
  queryParams.stockInNo = '';
  queryParams.stockInType = '';
  queryParams.warehouseId = '';
  queryParams.status = '';
  queryParams.dateRange = [];
  handleQuery();
};

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  getStockInList();
};

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val;
  getStockInList();
};

// 选择行
const handleSelectionChange = (selection: any[]) => {
  selectedRow.value = selection.length === 1 ? selection[0] : null;
};

// 行点击
const handleRowClick = (row: any) => {
  // 实现单选效果
  stockInList.value.forEach((item: any) => {
    item.selected = false;
  });
  row.selected = true;
  selectedRow.value = row;
};

// 查看详情
const handleView = (row: any) => {
  viewDialog.visible = true;
  
  // 填充详情表单
  Object.assign(detailForm, row);
  
  // 获取详情商品列表
  getDetailProducts(row.id);
  
  // 获取操作日志
  getDetailLogs(row.id);
};

// 获取详情商品列表
const getDetailProducts = (id: string) => {
  // 模拟API调用
  setTimeout(() => {
    if (id === '1') {
      detailProducts.value = [
        {
          code: 'P0001',
          name: '苹果手机',
          specification: '128G',
          unit: '台',
          quantity: 20,
          price: 5000,
          amount: 100000,
          targetLocation: '北京仓库-库区A-货架1-A01'
        },
        {
          code: 'P0002',
          name: '华为平板',
          specification: '10.8英寸',
          unit: '台',
          quantity: 15,
          price: 3000,
          amount: 45000,
          targetLocation: '北京仓库-库区A-货架1-A02'
        },
        {
          code: 'P0003',
          name: '小米手环',
          specification: '标准版',
          unit: '个',
          quantity: 15,
          price: 200,
          amount: 3000,
          targetLocation: '北京仓库-库区B-货架1-C01'
        }
      ];
    } else if (id === '2') {
      detailProducts.value = [
        {
          code: 'P0004',
          name: '联想笔记本',
          specification: '14英寸',
          unit: '台',
          quantity: 10,
          price: 4000,
          amount: 40000,
          targetLocation: '上海仓库-库区A-货架1-A01'
        },
        {
          code: 'P0005',
          name: '戴尔显示器',
          specification: '24英寸',
          unit: '台',
          quantity: 20,
          price: 1200,
          amount: 24000,
          targetLocation: '上海仓库-库区B-货架1-C01'
        }
      ];
    } else if (id === '3') {
      detailProducts.value = [
        {
          code: 'P0006',
          name: '三星手机',
          specification: '256G',
          unit: '台',
          quantity: 30,
          price: 6000,
          amount: 180000,
          targetLocation: '广州仓库-库区A-货架1-A01'
        },
        {
          code: 'P0007',
          name: 'OPPO手机',
          specification: '128G',
          unit: '台',
          quantity: 25,
          price: 3000,
          amount: 75000,
          targetLocation: '广州仓库-库区A-货架1-A02'
        },
        {
          code: 'P0008',
          name: 'VIVO手机',
          specification: '64G',
          unit: '台',
          quantity: 20,
          price: 2500,
          amount: 50000,
          targetLocation: '广州仓库-库区B-货架1-C01'
        },
        {
          code: 'P0009',
          name: '荣耀手机',
          specification: '128G',
          unit: '台',
          quantity: 25,
          price: 2800,
          amount: 70000,
          targetLocation: '广州仓库-库区B-货架1-C02'
        }
      ];
    } else if (id === '4') {
      detailProducts.value = [
        {
          code: 'P0010',
          name: '华硕笔记本',
          specification: '15.6英寸',
          unit: '台',
          quantity: 20,
          price: 5000,
          amount: 100000,
          targetLocation: '成都仓库-库区A-货架1-A01'
        }
      ];
    } else {
      detailProducts.value = [];
    }
  }, 200);
};

// 获取操作日志
// 获取操作日志
const getDetailLogs = (id: string) => {
  // 模拟API调用
  setTimeout(() => {
    if (id === '1') {
      detailLogs.value = [
        {
          operateType: 'create',
          operateBy: '张三',
          operateContent: '创建了入库单',
          operateTime: '2023-05-01 10:00:00'
        },
        {
          operateType: 'approve',
          operateBy: '李四',
          operateContent: '审核通过了入库单',
          operateTime: '2023-05-01 11:00:00'
        },
        {
          operateType: 'complete',
          operateBy: '王五',
          operateContent: '完成了入库操作',
          operateTime: '2023-05-01 14:00:00'
        }
      ];
    } else if (id === '2') {
      detailLogs.value = [
        {
          operateType: 'create',
          operateBy: '李四',
          operateContent: '创建了入库单',
          operateTime: '2023-05-02 10:00:00'
        },
        {
          operateType: 'approve',
          operateBy: '王五',
          operateContent: '审核通过了入库单',
          operateTime: '2023-05-02 11:00:00'
        }
      ];
    } else if (id === '3') {
      detailLogs.value = [
        {
          operateType: 'create',
          operateBy: '王五',
          operateContent: '创建了入库单',
          operateTime: '2023-05-03 10:00:00'
        }
      ];
    } else if (id === '4') {
      detailLogs.value = [
        {
          operateType: 'create',
          operateBy: '赵六',
          operateContent: '创建了入库单',
          operateTime: '2023-05-04 10:00:00'
        },
        {
          operateType: 'cancel',
          operateBy: '赵六',
          operateContent: '取消了入库单',
          operateTime: '2023-05-04 11:00:00'
        }
      ];
    } else {
      detailLogs.value = [];
    }
  }, 200);
};

// 新增入库单
const handleAdd = () => {
  addDialog.visible = true;
  
  // 重置表单
  stockInForm.stockInType = 'purchase';
  stockInForm.warehouseId = '';
  stockInForm.remark = '';
  
  // 清空已选商品
  selectedProducts.value = [];
  
  // 重置商品表单
  resetProductForm();
};

// 仓库变更
const handleWarehouseChange = () => {
  // 可以在这里加载仓库相关的位置信息
  // 这里简单模拟不同仓库的位置选项
  const warehouseId = stockInForm.warehouseId;
  if (warehouseId) {
    const warehouseName = warehouseOptions.value.find(item => item.id === warehouseId)?.name || '';
    locationOptions.value = [
      { value: `${warehouseName}-库区A-货架1-A01`, label: `${warehouseName}-库区A-货架1-A01` },
      { value: `${warehouseName}-库区A-货架1-A02`, label: `${warehouseName}-库区A-货架1-A02` },
      { value: `${warehouseName}-库区A-货架2-B01`, label: `${warehouseName}-库区A-货架2-B01` },
      { value: `${warehouseName}-库区B-货架1-C01`, label: `${warehouseName}-库区B-货架1-C01` },
      { value: `${warehouseName}-库区B-货架2-D01`, label: `${warehouseName}-库区B-货架2-D01` }
    ];
  } else {
    locationOptions.value = [];
  }
};

// 重置商品表单
const resetProductForm = () => {
  productForm.code = '';
  productForm.name = '';
  productForm.specification = '';
  productForm.unit = '';
  productForm.quantity = 1;
  productForm.price = 0;
  productForm.targetLocation = '';
  
  if (productFormRef.value) {
    productFormRef.value.resetFields();
  }
};

// 添加商品
const addProduct = () => {
  productFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    
    // 计算金额
    const amount = productForm.quantity * productForm.price;
    
    // 添加到已选商品列表
    selectedProducts.value.push({
      code: productForm.code,
      name: productForm.name,
      specification: productForm.specification,
      unit: productForm.unit,
      quantity: productForm.quantity,
      price: productForm.price,
      amount: amount,
      targetLocation: productForm.targetLocation
    });
    
    // 重置商品表单
    resetProductForm();
    
    ElMessage.success('商品添加成功');
  });
};

// 移除商品
const removeProduct = (index: number) => {
  selectedProducts.value.splice(index, 1);
};

// 关闭对话框
const handleClose = () => {
  addDialog.visible = false;
};

// 提交表单
const submitStockInForm = () => {
  stockInFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    
    if (selectedProducts.value.length === 0) {
      ElMessage.warning('请至少添加一个商品');
      return;
    }
    
    // 模拟API调用
    setTimeout(() => {
      // 生成入库单号
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const stockInNo = `RK${year}${month}${day}${random}`;
      
      // 计算商品总数和总金额
      const totalQuantity = selectedProducts.value.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = selectedProducts.value.reduce((sum, item) => sum + item.amount, 0);
      
      // 构建新的入库单
      const newStockIn = {
        id: (stockInList.value.length + 1).toString(),
        stockInNo,
        stockInType: stockInForm.stockInType,
        warehouseId: stockInForm.warehouseId,
        warehouseName: warehouseOptions.value.find(item => item.id === stockInForm.warehouseId)?.name || '',
        productCount: selectedProducts.value.length,
        totalQuantity,
        totalAmount,
        status: 'pending',
        createBy: '当前用户',
        createTime: `${year}-${month}-${day} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
        remark: stockInForm.remark
      };
      
      // 添加到列表
      stockInList.value.unshift(newStockIn);
      total.value = stockInList.value.length;
      
      ElMessage.success('入库单创建成功');
      addDialog.visible = false;
    }, 500);
  });
};

// 审核入库单
const handleApprove = (row?: any) => {
  const stockIn = row || selectedRow.value;
  if (!stockIn) {
    ElMessage.warning('请选择要审核的入库单');
    return;
  }
  
  if (stockIn.status !== 'pending') {
    ElMessage.warning('只能审核待审核状态的入库单');
    return;
  }
  
  ElMessageBox.confirm(`确认要审核入库单"${stockIn.stockInNo}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新状态
      const index = stockInList.value.findIndex(item => item.id === stockIn.id);
      if (index !== -1) {
        const now = new Date();
        stockInList.value[index].status = 'approved';
        stockInList.value[index].approveBy = '当前用户';
        stockInList.value[index].approveTime = now.toLocaleString();
      }
      
      ElMessage.success('审核成功');
    }, 300);
  }).catch(() => {});
};

// 完成入库
const handleComplete = (row?: any) => {
  const stockIn = row || selectedRow.value;
  if (!stockIn) {
    ElMessage.warning('请选择要入库的入库单');
    return;
  }
  
  if (stockIn.status !== 'approved') {
    ElMessage.warning('只能完成已审核状态的入库单');
    return;
  }
  
  ElMessageBox.confirm(`确认要完成入库单"${stockIn.stockInNo}"的入库操作吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新状态
      const index = stockInList.value.findIndex(item => item.id === stockIn.id);
      if (index !== -1) {
        const now = new Date();
        stockInList.value[index].status = 'completed';
        stockInList.value[index].completeBy = '当前用户';
        stockInList.value[index].completeTime = now.toLocaleString();
      }
      
      ElMessage.success('入库操作已完成');
    }, 300);
  }).catch(() => {});
};

// 取消入库单
const handleCancel = (row?: any) => {
  const stockIn = row || selectedRow.value;
  if (!stockIn) {
    ElMessage.warning('请选择要取消的入库单');
    return;
  }
  
  if (!['pending', 'approved'].includes(stockIn.status)) {
    ElMessage.warning('只能取消待审核或已审核状态的入库单');
    return;
  }
  
  ElMessageBox.confirm(`确认要取消入库单"${stockIn.stockInNo}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新状态
      const index = stockInList.value.findIndex(item => item.id === stockIn.id);
      if (index !== -1) {
        const now = new Date();
        stockInList.value[index].status = 'cancelled';
        stockInList.value[index].cancelBy = '当前用户';
        stockInList.value[index].cancelTime = now.toLocaleString();
      }
      
      ElMessage.success('入库单已取消');
    }, 300);
  }).catch(() => {});
};

// 导出入库单
const handleExport = () => {
  ElMessage.success('导出成功');
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
  
  .filter-container {
    margin-bottom: 20px;
    
    .filter-item {
      margin-bottom: 10px;
    }
    
    .operation-container {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
  }
  
  .table-container {
    margin-bottom: 20px;
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
  
  .detail-products {
    margin-top: 20px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  }
  
  .detail-logs {
    margin-top: 20px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  }
  
  .product-selection {
    margin-top: 20px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .add-product-form {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f8f8;
      border-radius: 4px;
    }
  }
  
  .selected-products {
    margin-top: 20px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .total-amount {
      margin-top: 10px;
      text-align: right;
      font-size: 16px;
      font-weight: bold;
      color: #f56c6c;
    }
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
  }
}
</style>