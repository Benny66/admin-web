<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div class="filter-item">
        <el-form :inline="true" :model="queryParams" @keyup.enter="handleQuery">
          <el-form-item label="出库单号">
            <el-input v-model="queryParams.stockOutNo" placeholder="请输入出库单号" clearable />
          </el-form-item>
          <el-form-item label="出库类型">
            <el-select v-model="queryParams.stockOutType" placeholder="请选择出库类型" clearable>
              <el-option label="销售出库" value="sale" />
              <el-option label="退货出库" value="return" />
              <el-option label="调拨出库" value="transfer" />
              <el-option label="其他出库" value="other" />
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
          <el-form-item label="出库状态">
            <el-select v-model="queryParams.status" placeholder="请选择出库状态" clearable>
              <el-option label="待审核" value="pending" />
              <el-option label="已审核" value="approved" />
              <el-option label="已出库" value="completed" />
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
        <el-button type="primary" @click="handleAdd">新增出库单</el-button>
        <el-button type="success" :disabled="single" @click="handleApprove">审核</el-button>
        <el-button type="info" :disabled="single" @click="handleComplete">出库</el-button>
        <el-button type="danger" :disabled="single" @click="handleCancel">取消</el-button>
        <el-button type="warning" @click="handleExport">导出</el-button>
      </div>
    </el-card>

    <el-card class="table-container">
      <el-table
        v-loading="loading"
        :data="stockOutList"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="stockOutNo" label="出库单号" min-width="150" />
        <el-table-column prop="stockOutType" label="出库类型" width="100">
          <template #default="scope">
            {{ getStockOutTypeLabel(scope.row.stockOutType) }}
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
            >出库</el-button>
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

    <!-- 查看出库单详情对话框 -->
    <el-dialog
      title="出库单详情"
      v-model="viewDialog.visible"
      width="900px"
      append-to-body
    >
      <el-descriptions title="基本信息" :column="3" border>
        <el-descriptions-item label="出库单号">{{ detailForm.stockOutNo }}</el-descriptions-item>
        <el-descriptions-item label="出库类型">{{ getStockOutTypeLabel(detailForm.stockOutType) }}</el-descriptions-item>
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
        <el-descriptions-item label="出库人" v-if="detailForm.completeBy">{{ detailForm.completeBy }}</el-descriptions-item>
        <el-descriptions-item label="出库时间" v-if="detailForm.completeTime">{{ detailForm.completeTime }}</el-descriptions-item>
        <el-descriptions-item label="取消人" v-if="detailForm.cancelBy">{{ detailForm.cancelBy }}</el-descriptions-item>
        <el-descriptions-item label="取消时间" v-if="detailForm.cancelTime">{{ detailForm.cancelTime }}</el-descriptions-item>
        <el-descriptions-item label="客户" v-if="detailForm.customerName">{{ detailForm.customerName }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ detailForm.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-products">
        <div class="title">出库商品</div>
        <el-table :data="detailProducts" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="code" label="商品编码" width="120" />
          <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="specification" label="规格" width="120" />
          <el-table-column prop="unit" label="单位" width="80" align="center" />
          <el-table-column prop="quantity" label="出库数量" width="100" align="center" />
          <el-table-column prop="price" label="单价(元)" width="100" align="center" />
          <el-table-column prop="amount" label="金额(元)" width="120" align="center" />
          <el-table-column prop="sourceLocation" label="出库位置" width="150" show-overflow-tooltip />
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

    <!-- 新增出库单对话框 -->
    <el-dialog
      title="新增出库单"
      v-model="addDialog.visible"
      width="900px"
      append-to-body
      :close-on-click-modal="false"
      :before-close="handleClose"
    >
      <el-form
        ref="stockOutFormRef"
        :model="stockOutForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="出库类型" prop="stockOutType">
          <el-select 
            v-model="stockOutForm.stockOutType" 
            placeholder="请选择出库类型" 
            style="width: 100%"
          >
            <el-option label="销售出库" value="sale" />
            <el-option label="退货出库" value="return" />
            <el-option label="调拨出库" value="transfer" />
            <el-option label="其他出库" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库" prop="warehouseId">
          <el-select 
            v-model="stockOutForm.warehouseId" 
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
        <el-form-item label="客户" prop="customerName" v-if="stockOutForm.stockOutType === 'sale'">
          <el-input v-model="stockOutForm.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="stockOutForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <div class="product-selection">
        <div class="title">选择商品</div>
        <div class="search-bar">
          <el-input
            v-model="productSearch"
            placeholder="请输入商品编码或名称"
            style="width: 300px"
            clearable
          >
            <template #append>
              <el-button @click="searchProducts">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
        
        <el-table
          :data="availableProducts"
          border
          style="width: 100%"
          @selection-change="handleProductSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="code" label="商品编码" width="120" />
          <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="specification" label="规格" width="120" />
          <el-table-column prop="unit" label="单位" width="80" align="center" />
          <el-table-column prop="stock" label="可用库存" width="100" align="center" />
          <el-table-column prop="location" label="当前位置" width="150" show-overflow-tooltip />
          <el-table-column prop="price" label="单价(元)" width="100" align="center" />
          <el-table-column label="出库数量" width="150" align="center">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.outQuantity"
                :min="1"
                :max="scope.row.stock"
                :disabled="!scope.row.selected"
                @change="handleQuantityChange"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="selected-products" v-if="selectedProducts.length > 0">
        <div class="title">已选商品</div>
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
          <el-table-column prop="outQuantity" label="出库数量" width="100" align="center" />
          <el-table-column prop="price" label="单价(元)" width="100" align="center" />
          <el-table-column prop="amount" label="金额(元)" width="120" align="center" />
          <el-table-column prop="location" label="出库位置" width="150" show-overflow-tooltip />
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button type="danger" link @click="removeSelectedProduct(scope.$index)">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="total-amount">
          总金额: {{ totalAmount.toFixed(2) }} 元
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="submitStockOutForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<!-- 现有模板部分保持不变 -->

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  stockOutNo: '',
  stockOutType: '',
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

// 出库单列表数据
const stockOutList = ref([]);
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
  stockOutNo: '',
  stockOutType: '',
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
  customerName: '',
  remark: ''
});

// 详情商品列表
const detailProducts = ref([]);

// 详情日志列表
const detailLogs = ref([]);

// 新增表单
const stockOutFormRef = ref();
const stockOutForm = reactive({
  stockOutType: 'sale',
  warehouseId: '',
  customerName: '',
  remark: ''
});

// 商品搜索
const productSearch = ref('');

// 可选商品列表
const availableProducts = ref([]);

// 已选商品列表
const selectedProducts = ref([]);

// 总金额
const totalAmount = computed(() => {
  return selectedProducts.value.reduce((sum, item) => sum + item.amount, 0);
});

// 表单校验规则
const rules = {
  stockOutType: [{ required: true, message: '请选择出库类型', trigger: 'change' }],
  warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
  customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }]
};

// 初始化
onMounted(() => {
  getStockOutList();
});

// 获取出库单列表
const getStockOutList = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    stockOutList.value = [
      {
        id: '1',
        stockOutNo: 'CK20230501001',
        stockOutType: 'sale',
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
        completeTime: '2023-05-01 14:00:00',
        customerName: '北京科技有限公司'
      },
      {
        id: '2',
        stockOutNo: 'CK20230502001',
        stockOutType: 'return',
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
        stockOutNo: 'CK20230503001',
        stockOutType: 'transfer',
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
        stockOutNo: 'CK20230504001',
        stockOutType: 'other',
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

// 获取出库类型标签
const getStockOutTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    sale: '销售出库',
    return: '退货出库',
    transfer: '调拨出库',
    other: '其他出库'
  };
  return typeMap[type] || type;
};

// 获取状态标签
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已审核',
    completed: '已出库',
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
  getStockOutList();
};

// 重置查询
const resetQuery = () => {
  queryParams.stockOutNo = '';
  queryParams.stockOutType = '';
  queryParams.warehouseId = '';
  queryParams.status = '';
  queryParams.dateRange = [];
  handleQuery();
};

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  getStockOutList();
};

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val;
  getStockOutList();
};

// 选择行
const handleSelectionChange = (selection: any[]) => {
  selectedRow.value = selection.length === 1 ? selection[0] : null;
};

// 行点击
const handleRowClick = (row: any) => {
  // 实现单选效果
  stockOutList.value.forEach((item: any) => {
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
          sourceLocation: '北京仓库-库区A-货架1-A01'
        },
        {
          code: 'P0002',
          name: '华为平板',
          specification: '10.8英寸',
          unit: '台',
          quantity: 15,
          price: 3000,
          amount: 45000,
          sourceLocation: '北京仓库-库区A-货架1-A02'
        },
        {
          code: 'P0003',
          name: '小米手环',
          specification: '标准版',
          unit: '个',
          quantity: 15,
          price: 200,
          amount: 3000,
          sourceLocation: '北京仓库-库区B-货架1-C01'
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
          sourceLocation: '上海仓库-库区A-货架1-A01'
        },
        {
          code: 'P0005',
          name: '戴尔显示器',
          specification: '24英寸',
          unit: '台',
          quantity: 20,
          price: 1200,
          amount: 24000,
          sourceLocation: '上海仓库-库区B-货架1-C01'
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
          sourceLocation: '广州仓库-库区A-货架1-A01'
        },
        {
          code: 'P0007',
          name: 'OPPO手机',
          specification: '128G',
          unit: '台',
          quantity: 25,
          price: 3000,
          amount: 75000,
          sourceLocation: '广州仓库-库区A-货架1-A02'
        },
        {
          code: 'P0008',
          name: 'VIVO手机',
          specification: '64G',
          unit: '台',
          quantity: 20,
          price: 2500,
          amount: 50000,
          sourceLocation: '广州仓库-库区B-货架1-C01'
        },
        {
          code: 'P0009',
          name: '荣耀手机',
          specification: '128G',
          unit: '台',
          quantity: 25,
          price: 2800,
          amount: 70000,
          sourceLocation: '广州仓库-库区B-货架1-C02'
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
          sourceLocation: '成都仓库-库区A-货架1-A01'
        }
      ];
    } else {
      detailProducts.value = [];
    }
  }, 200);
};

// 获取操作日志
const getDetailLogs = (id: string) => {
  // 模拟API调用
  setTimeout(() => {
    if (id === '1') {
      detailLogs.value = [
        {
          operateType: 'create',
          operateBy: '张三',
          operateContent: '创建了出库单',
          operateTime: '2023-05-01 10:00:00'
        },
        {
          operateType: 'approve',
          operateBy: '李四',
          operateContent: '审核通过了出库单',
          operateTime: '2023-05-01 11:00:00'
        },
        {
          operateType: 'complete',
          operateBy: '王五',
          operateContent: '完成了出库操作',
          operateTime: '2023-05-01 14:00:00'
        }
      ];
    } else if (id === '2') {
      detailLogs.value = [
        {
          operateType: 'create',
          operateBy: '李四',
          operateContent: '创建了出库单',
          operateTime: '2023-05-02 10:00:00'
        },
        {
          operateType: 'approve',
          operateBy: '王五',
          operateContent: '审核通过了出库单',
          operateTime: '2023-05-02 11:00:00'
        }
      ];
    } else if (id === '3') {
      detailLogs.value = [
        {
          operateType: 'create',
          operateBy: '王五',
          operateContent: '创建了出库单',
          operateTime: '2023-05-03 10:00:00'
        }
      ];
    } else if (id === '4') {
      detailLogs.value = [
        {
          operateType: 'create',
          operateBy: '赵六',
          operateContent: '创建了出库单',
          operateTime: '2023-05-04 10:00:00'
        },
        {
          operateType: 'cancel',
          operateBy: '赵六',
          operateContent: '取消了出库单',
          operateTime: '2023-05-04 11:00:00'
        }
      ];
    } else {
      detailLogs.value = [];
    }
  }, 200);
};

// 新增出库单
const handleAdd = () => {
  addDialog.visible = true;
  
  // 重置表单
  stockOutForm.stockOutType = 'sale';
  stockOutForm.warehouseId = '';
  stockOutForm.customerName = '';
  stockOutForm.remark = '';
  
  // 清空已选商品
  selectedProducts.value = [];
  availableProducts.value = [];
  productSearch.value = '';
};

// 仓库变更
const handleWarehouseChange = () => {
  // 清空已选商品
  selectedProducts.value = [];
  
  // 加载仓库商品
  if (stockOutForm.warehouseId) {
    loadWarehouseProducts(stockOutForm.warehouseId);
  } else {
    availableProducts.value = [];
  }
};

// 加载仓库商品
const loadWarehouseProducts = (warehouseId: string) => {
  // 模拟API调用
  setTimeout(() => {
    const warehouseName = warehouseOptions.value.find(item => item.id === warehouseId)?.name || '';
    
    if (warehouseId === '1') {
      availableProducts.value = [
        {
          id: '1',
          code: 'P0001',
          name: '苹果手机',
          specification: '128G',
          unit: '台',
          stock: 50,
          price: 5000,
          location: `${warehouseName}-库区A-货架1-A01`,
          outQuantity: 1,
          selected: false
        },
        {
          id: '2',
          code: 'P0002',
          name: '华为平板',
          specification: '10.8英寸',
          unit: '台',
          stock: 30,
          price: 3000,
          location: `${warehouseName}-库区A-货架1-A02`,
          outQuantity: 1,
          selected: false
        },
        {
          id: '3',
          code: 'P0003',
          name: '小米手环',
          specification: '标准版',
          unit: '个',
          stock: 100,
          price: 200,
          location: `${warehouseName}-库区B-货架1-C01`,
          outQuantity: 1,
          selected: false
        }
      ];
    } else if (warehouseId === '2') {
      availableProducts.value = [
        {
          id: '4',
          code: 'P0004',
          name: '联想笔记本',
          specification: '14英寸',
          unit: '台',
          stock: 20,
          price: 4000,
          location: `${warehouseName}-库区A-货架1-A01`,
          outQuantity: 1,
          selected: false
        },
        {
          id: '5',
          code: 'P0005',
          name: '戴尔显示器',
          specification: '24英寸',
          unit: '台',
          stock: 40,
          price: 1200,
          location: `${warehouseName}-库区B-货架1-C01`,
          outQuantity: 1,
          selected: false
        }
      ];
    } else if (warehouseId === '3') {
      availableProducts.value = [
        {
          id: '6',
          code: 'P0006',
          name: '三星手机',
          specification: '256G',
          unit: '台',
          stock: 60,
          price: 6000,
          location: `${warehouseName}-库区A-货架1-A01`,
          outQuantity: 1,
          selected: false
        },
        {
          id: '7',
          code: 'P0007',
          name: 'OPPO手机',
          specification: '128G',
          unit: '台',
          stock: 50,
          price: 3000,
          location: `${warehouseName}-库区A-货架1-A02`,
          outQuantity: 1,
          selected: false
        },
        {
          id: '8',
          code: 'P0008',
          name: 'VIVO手机',
          specification: '64G',
          unit: '台',
          stock: 40,
          price: 2500,
          location: `${warehouseName}-库区B-货架1-C01`,
          outQuantity: 1,
          selected: false
        },
        {
          id: '9',
          code: 'P0009',
          name: '荣耀手机',
          specification: '128G',
          unit: '台',
          stock: 45,
          price: 2800,
          location: `${warehouseName}-库区B-货架1-C02`,
          outQuantity: 1,
          selected: false
        }
      ];
    } else if (warehouseId === '4') {
      availableProducts.value = [
        {
          id: '10',
          code: 'P0010',
          name: '华硕笔记本',
          specification: '15.6英寸',
          unit: '台',
          stock: 30,
          price: 5000,
          location: `${warehouseName}-库区A-货架1-A01`,
          outQuantity: 1,
          selected: false
        }
      ];
    } else if (warehouseId === '5') {
      availableProducts.value = [
        {
          id: '11',
          code: 'P0011',
          name: '惠普打印机',
          specification: '激光',
          unit: '台',
          stock: 25,
          price: 2000,
          location: `${warehouseName}-库区A-货架1-A01`,
          outQuantity: 1,
          selected: false
        },
        {
          id: '12',
          code: 'P0012',
          name: '佳能相机',
          specification: '单反',
          unit: '台',
          stock: 15,
          price: 8000,
          location: `${warehouseName}-库区B-货架1-C01`,
          outQuantity: 1,
          selected: false
        }
      ];
    } else {
      availableProducts.value = [];
    }
  }, 300);
};

// 搜索商品
const searchProducts = () => {
  if (!stockOutForm.warehouseId) {
    ElMessage.warning('请先选择仓库');
    return;
  }
  
  // 模拟搜索
  if (productSearch.value) {
    const keyword = productSearch.value.toLowerCase();
    availableProducts.value = availableProducts.value.filter(item => 
      item.code.toLowerCase().includes(keyword) || 
      item.name.toLowerCase().includes(keyword)
    );
  } else {
    // 如果搜索关键字为空，重新加载所有商品
    loadWarehouseProducts(stockOutForm.warehouseId);
  }
};

// 商品选择变更
const handleProductSelectionChange = (selection: any[]) => {
  // 更新选中状态
  availableProducts.value.forEach(item => {
    item.selected = selection.some(selected => selected.id === item.id);
  });
  
  // 更新已选商品列表
  selectedProducts.value = availableProducts.value
    .filter(item => item.selected)
    .map(item => ({
      ...item,
      amount: item.outQuantity * item.price
    }));
};

// 数量变更
const handleQuantityChange = () => {
  // 同步已选商品的数量和金额
  selectedProducts.value.forEach(selected => {
    const available = availableProducts.value.find(item => item.id === selected.id);
    if (available) {
      selected.outQuantity = available.outQuantity;
      selected.amount = available.outQuantity * selected.price;
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

// 关闭对话框
const handleClose = () => {
  addDialog.visible = false;
};

// 提交表单
const submitStockOutForm = () => {
  stockOutFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    
    if (selectedProducts.value.length === 0) {
      ElMessage.warning('请至少选择一个商品');
      return;
    }
    
    // 模拟API调用
    setTimeout(() => {
      // 生成出库单号
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const stockOutNo = `CK${year}${month}${day}${random}`;
      
      // 计算商品总数和总金额
      const totalQuantity = selectedProducts.value.reduce((sum, item) => sum + item.outQuantity, 0);
      const totalAmount = selectedProducts.value.reduce((sum, item) => sum + item.amount, 0);
      
      // 构建新的出库单
      const newStockOut = {
        id: (stockOutList.value.length + 1).toString(),
        stockOutNo,
        stockOutType: stockOutForm.stockOutType,
        warehouseId: stockOutForm.warehouseId,
        warehouseName: warehouseOptions.value.find(item => item.id === stockOutForm.warehouseId)?.name || '',
        productCount: selectedProducts.value.length,
        totalQuantity,
        totalAmount,
        status: 'pending',
        createBy: '当前用户',
        createTime: `${year}-${month}-${day} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
        customerName: stockOutForm.customerName,
        remark: stockOutForm.remark
      };
      
      // 添加到列表
      stockOutList.value.unshift(newStockOut);
      total.value = stockOutList.value.length;
      
      ElMessage.success('出库单创建成功');
      addDialog.visible = false;
    }, 500);
  });
};

// 审核出库单
const handleApprove = (row?: any) => {
  const stockOut = row || selectedRow.value;
  if (!stockOut) {
    ElMessage.warning('请选择要审核的出库单');
    return;
  }
  
  if (stockOut.status !== 'pending') {
    ElMessage.warning('只能审核待审核状态的出库单');
    return;
  }
  
  ElMessageBox.confirm(`确认要审核出库单"${stockOut.stockOutNo}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新状态
      const index = stockOutList.value.findIndex(item => item.id === stockOut.id);
      if (index !== -1) {
        const now = new Date();
        stockOutList.value[index].status = 'approved';
        stockOutList.value[index].approveBy = '当前用户';
        stockOutList.value[index].approveTime = now.toLocaleString();
      }
      
      ElMessage.success('审核成功');
    }, 300);
  }).catch(() => {});
};

// 完成出库
const handleComplete = (row?: any) => {
  const stockOut = row || selectedRow.value;
  if (!stockOut) {
    ElMessage.warning('请选择要出库的出库单');
    return;
  }
  
  if (stockOut.status !== 'approved') {
    ElMessage.warning('只能完成已审核状态的出库单');
    return;
  }
  
  ElMessageBox.confirm(`确认要完成出库单"${stockOut.stockOutNo}"的出库操作吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新状态
      const index = stockOutList.value.findIndex(item => item.id === stockOut.id);
      if (index !== -1) {
        const now = new Date();
        stockOutList.value[index].status = 'completed';
        stockOutList.value[index].completeBy = '当前用户';
        stockOutList.value[index].completeTime = now.toLocaleString();
      }
      
      ElMessage.success('出库操作已完成');
    }, 300);
  }).catch(() => {});
};

// 取消出库单
const handleCancel = (row?: any) => {
  const stockOut = row || selectedRow.value;
  if (!stockOut) {
    ElMessage.warning('请选择要取消的出库单');
    return;
  }
  
  if (!['pending', 'approved'].includes(stockOut.status)) {
    ElMessage.warning('只能取消待审核或已审核状态的出库单');
    return;
  }
  
  ElMessageBox.confirm(`确认要取消出库单"${stockOut.stockOutNo}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新状态
      const index = stockOutList.value.findIndex(item => item.id === stockOut.id);
      if (index !== -1) {
        const now = new Date();
        stockOutList.value[index].status = 'cancelled';
        stockOutList.value[index].cancelBy = '当前用户';
        stockOutList.value[index].cancelTime = now.toLocaleString();
      }
      
      ElMessage.success('出库单已取消');
    }, 300);
  }).catch(() => {});
};

// 导出出库单
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
  
  .detail-products,
  .detail-logs,
  .product-selection,
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
  
  .detail-logs {
    margin-top: 30px;
  }
  
  .search-bar {
    margin-bottom: 15px;
  }
  
  .total-amount {
    margin-top: 15px;
    text-align: right;
    font-size: 16px;
    font-weight: bold;
    color: #f56c6c;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
  }
  
  :deep(.el-table .selected-row) {
    background-color: #f0f9eb;
  }
}
</style>