<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div class="filter-item">
        <el-form :inline="true" :model="queryParams" @keyup.enter="handleQuery">
          <el-form-item label="移库单号">
            <el-input v-model="queryParams.transferNo" placeholder="请输入移库单号" clearable />
          </el-form-item>
          <el-form-item label="来源仓库">
            <el-select v-model="queryParams.sourceWarehouseId" placeholder="请选择来源仓库" clearable>
              <el-option
                v-for="item in warehouseOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="目标仓库">
            <el-select v-model="queryParams.targetWarehouseId" placeholder="请选择目标仓库" clearable>
              <el-option
                v-for="item in warehouseOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="移库状态">
            <el-select v-model="queryParams.status" placeholder="请选择移库状态" clearable>
              <el-option label="待审核" value="pending" />
              <el-option label="已审核" value="approved" />
              <el-option label="已完成" value="completed" />
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
        <el-button type="primary" @click="handleAdd">新增移库单</el-button>
        <el-button type="success" :disabled="single" @click="handleApprove">审核</el-button>
        <el-button type="info" :disabled="single" @click="handleComplete">完成</el-button>
        <el-button type="danger" :disabled="single" @click="handleCancel">取消</el-button>
        <el-button type="warning" @click="handleExport">导出</el-button>
      </div>
    </el-card>

    <el-card class="table-container">
      <el-table
        v-loading="loading"
        :data="transferList"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="transferNo" label="移库单号" min-width="150" />
        <el-table-column prop="sourceWarehouseName" label="来源仓库" width="120" />
        <el-table-column prop="targetWarehouseName" label="目标仓库" width="120" />
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
            >完成</el-button>
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

    <!-- 查看移库单详情对话框 -->
    <el-dialog
      title="移库单详情"
      v-model="viewDialog.visible"
      width="900px"
      append-to-body
    >
      <el-descriptions title="基本信息" :column="3" border>
        <el-descriptions-item label="移库单号">{{ detailForm.transferNo }}</el-descriptions-item>
        <el-descriptions-item label="来源仓库">{{ detailForm.sourceWarehouseName }}</el-descriptions-item>
        <el-descriptions-item label="目标仓库">{{ detailForm.targetWarehouseName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailForm.status)">
            {{ getStatusLabel(detailForm.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detailForm.createBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailForm.createTime }}</el-descriptions-item>
        <el-descriptions-item label="审核人" v-if="detailForm.approveBy">{{ detailForm.approveBy }}</el-descriptions-item>
        <el-descriptions-item label="审核时间" v-if="detailForm.approveTime">{{ detailForm.approveTime }}</el-descriptions-item>
        <el-descriptions-item label="完成人" v-if="detailForm.completeBy">{{ detailForm.completeBy }}</el-descriptions-item>
        <el-descriptions-item label="完成时间" v-if="detailForm.completeTime">{{ detailForm.completeTime }}</el-descriptions-item>
        <el-descriptions-item label="取消人" v-if="detailForm.cancelBy">{{ detailForm.cancelBy }}</el-descriptions-item>
        <el-descriptions-item label="取消时间" v-if="detailForm.cancelTime">{{ detailForm.cancelTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ detailForm.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-products">
        <div class="title">移库商品</div>
        <el-table :data="detailProducts" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="code" label="商品编码" width="120" />
          <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="specification" label="规格" width="120" />
          <el-table-column prop="unit" label="单位" width="80" align="center" />
          <el-table-column prop="quantity" label="移库数量" width="100" align="center" />
          <el-table-column prop="sourceLocation" label="来源位置" width="150" show-overflow-tooltip />
          <el-table-column prop="targetLocation" label="目标位置" width="150" show-overflow-tooltip />
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

    <!-- 新增移库单对话框 -->
    <el-dialog
      title="新增移库单"
      v-model="addDialog.visible"
      width="900px"
      append-to-body
      :close-on-click-modal="false"
      :before-close="handleClose"
    >
      <el-form
        ref="transferFormRef"
        :model="transferForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="来源仓库" prop="sourceWarehouseId">
          <el-select 
            v-model="transferForm.sourceWarehouseId" 
            placeholder="请选择来源仓库" 
            style="width: 100%"
            @change="handleSourceWarehouseChange"
          >
            <el-option
              v-for="item in warehouseOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标仓库" prop="targetWarehouseId">
          <el-select 
            v-model="transferForm.targetWarehouseId" 
            placeholder="请选择目标仓库" 
            style="width: 100%"
            :disabled="!transferForm.sourceWarehouseId"
          >
            <el-option
              v-for="item in targetWarehouseOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="transferForm.remark"
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
          <el-table-column label="移库数量" width="150" align="center">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.transferQuantity"
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
          <el-table-column prop="transferQuantity" label="移库数量" width="100" align="center" />
          <el-table-column prop="location" label="来源位置" width="150" show-overflow-tooltip />
          <el-table-column label="目标位置" width="150">
            <template #default="scope">
              <el-select v-model="scope.row.targetLocation" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in targetLocations"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button type="danger" link @click="removeSelectedProduct(scope.$index)">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="submitTransferForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  transferNo: '',
  sourceWarehouseId: '',
  targetWarehouseId: '',
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

// 目标仓库选项
const targetWarehouseOptions = computed(() => {
  return warehouseOptions.value.filter(item => item.id !== transferForm.sourceWarehouseId);
});

// 目标位置选项
const targetLocations = ref([
  { value: '库区A-货架1-A01', label: '库区A-货架1-A01' },
  { value: '库区A-货架1-A02', label: '库区A-货架1-A02' },
  { value: '库区A-货架2-B01', label: '库区A-货架2-B01' },
  { value: '库区B-货架1-C01', label: '库区B-货架1-C01' },
  { value: '库区B-货架2-D01', label: '库区B-货架2-D01' }
]);

// 移库单列表数据
const transferList = ref([]);
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
  transferNo: '',
  sourceWarehouseId: '',
  sourceWarehouseName: '',
  targetWarehouseId: '',
  targetWarehouseName: '',
  productCount: 0,
  totalQuantity: 0,
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
const transferFormRef = ref();
const transferForm = reactive({
  sourceWarehouseId: '',
  targetWarehouseId: '',
  remark: ''
});

// 表单校验规则
const rules = {
  sourceWarehouseId: [{ required: true, message: '请选择来源仓库', trigger: 'change' }],
  targetWarehouseId: [{ required: true, message: '请选择目标仓库', trigger: 'change' }]
};

// 商品搜索
const productSearch = ref('');
const availableProducts = ref([]);
const selectedProducts = ref([]);

// 初始化
onMounted(() => {
  getTransferList();
});

// 获取移库单列表
const getTransferList = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    transferList.value = [
      {
        id: '1',
        transferNo: 'TF20230501001',
        sourceWarehouseId: '1',
        sourceWarehouseName: '北京仓库',
        targetWarehouseId: '2',
        targetWarehouseName: '上海仓库',
        productCount: 3,
        totalQuantity: 50,
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
        transferNo: 'TF20230502001',
        sourceWarehouseId: '2',
        sourceWarehouseName: '上海仓库',
        targetWarehouseId: '3',
        targetWarehouseName: '广州仓库',
        productCount: 2,
        totalQuantity: 30,
        status: 'approved',
        createBy: '李四',
        createTime: '2023-05-02 10:00:00',
        approveBy: '王五',
        approveTime: '2023-05-02 11:00:00'
      },
      {
        id: '3',
        transferNo: 'TF20230503001',
        sourceWarehouseId: '3',
        sourceWarehouseName: '广州仓库',
        targetWarehouseId: '4',
        targetWarehouseName: '成都仓库',
        productCount: 4,
        totalQuantity: 100,
        status: 'pending',
        createBy: '王五',
        createTime: '2023-05-03 10:00:00'
      },
      {
        id: '4',
        transferNo: 'TF20230504001',
        sourceWarehouseId: '4',
        sourceWarehouseName: '成都仓库',
        targetWarehouseId: '5',
        targetWarehouseName: '深圳仓库',
        productCount: 1,
        totalQuantity: 20,
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

// 获取状态标签
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已审核',
    completed: '已完成',
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
  getTransferList();
};

// 重置查询
const resetQuery = () => {
  queryParams.transferNo = '';
  queryParams.sourceWarehouseId = '';
  queryParams.targetWarehouseId = '';
  queryParams.status = '';
  queryParams.dateRange = [];
  handleQuery();
};

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  getTransferList();
};

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val;
  getTransferList();
};

// 选择行
const handleSelectionChange = (selection: any[]) => {
  selectedRow.value = selection.length === 1 ? selection[0] : null;
};

// 行点击
const handleRowClick = (row: any) => {
  // 实现单选效果
  transferList.value.forEach((item: any) => {
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
          sourceLocation: '北京仓库-库区A-货架1-A01',
          targetLocation: '上海仓库-库区A-货架1-A01'
        },
        {
          code: 'P0002',
          name: '华为平板',
          specification: '10.8英寸',
          unit: '台',
          quantity: 15,
          sourceLocation: '北京仓库-库区A-货架1-A02',
          targetLocation: '上海仓库-库区A-货架1-A02'
        },
        {
          code: 'P0003',
          name: '小米手环',
          specification: '标准版',
          unit: '个',
          quantity: 15,
          sourceLocation: '北京仓库-库区B-货架1-C01',
          targetLocation: '上海仓库-库区B-货架1-C01'
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
          sourceLocation: '上海仓库-库区A-货架1-A01',
          targetLocation: '广州仓库-库区A-货架1-A01'
        },
        {
          code: 'P0005',
          name: '戴尔显示器',
          specification: '24英寸',
          unit: '台',
          quantity: 20,
          sourceLocation: '上海仓库-库区B-货架1-C01',
          targetLocation: '广州仓库-库区B-货架1-C01'
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
          sourceLocation: '广州仓库-库区A-货架1-A01',
          targetLocation: '成都仓库-库区A-货架1-A01'
        },
        {
          code: 'P0007',
          name: 'OPPO手机',
          specification: '128G',
          unit: '台',
          quantity: 25,
          sourceLocation: '广州仓库-库区A-货架1-A02',
          targetLocation: '成都仓库-库区A-货架1-A02'
        },
        {
          code: 'P0008',
          name: 'VIVO手机',
          specification: '64G',
          unit: '台',
          quantity: 20,
          sourceLocation: '广州仓库-库区B-货架1-C01',
          targetLocation: '成都仓库-库区B-货架1-C01'
        },
        {
          code: 'P0009',
          name: '荣耀手机',
          specification: '128G',
          unit: '台',
          quantity: 25,
          sourceLocation: '广州仓库-库区B-货架1-C02',
          targetLocation: '成都仓库-库区B-货架1-C02'
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
          sourceLocation: '成都仓库-库区A-货架1-A01',
          targetLocation: '深圳仓库-库区A-货架1-A01'
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
          operateContent: '创建了移库单',
          operateTime: '2023-05-01 10:00:00'
        },
        {
          operateType: 'approve',
          operateBy: '李四',
          operateContent: '审核通过了移库单',
          operateTime: '2023-05-01 11:00:00'
        },
        {
          operateType: 'complete',
          operateBy: '王五',
          operateContent: '完成了移库单',
          operateTime: '2023-05-01 14:00:00'
        }
      ];
    } else if (id === '2') {
      detailLogs.value = [
        {
          operateType: 'create',
          operateBy: '李四',
          operateContent: '创建了移库单',
          operateTime: '2023-05-02 10:00:00'
        },
        {
          operateType: 'approve',
          operateBy: '王五',
          operateContent: '审核通过了移库单',
          operateTime: '2023-05-02 11:00:00'
        }
      ];
    } else if (id === '3') {
      detailLogs.value = [
        {
          operateType: 'create',
          operateBy: '王五',
          operateContent: '创建了移库单',
          operateTime: '2023-05-03 10:00:00'
        }
      ];
    } else if (id === '4') {
      detailLogs.value = [
        {
          operateType: 'create',
          operateBy: '赵六',
          operateContent: '创建了移库单',
          operateTime: '2023-05-04 10:00:00'
        },
        {
          operateType: 'cancel',
          operateBy: '赵六',
          operateContent: '取消了移库单',
          operateTime: '2023-05-04 11:00:00'
        }
      ];
    } else {
      detailLogs.value = [];
    }
  }, 200);
};

// 新增移库单
const handleAdd = () => {
  addDialog.visible = true;
  
  // 重置表单
  transferForm.sourceWarehouseId = '';
  transferForm.targetWarehouseId = '';
  transferForm.remark = '';
  
  // 清空已选商品
  selectedProducts.value = [];
  availableProducts.value = [];
  productSearch.value = '';
};

// 来源仓库变更
const handleSourceWarehouseChange = (warehouseId: string) => {
  transferForm.targetWarehouseId = '';
  
  // 清空已选商品
  selectedProducts.value = [];
  availableProducts.value = [];
  productSearch.value = '';
  
  // 如果选择了仓库，加载该仓库的商品
  if (warehouseId) {
    loadWarehouseProducts(warehouseId);
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
          location: `${warehouseName}-库区A-货架1-A01`,
          transferQuantity: 1,
          selected: false
        },
        {
          id: '2',
          code: 'P0002',
          name: '华为平板',
          specification: '10.8英寸',
          unit: '台',
          stock: 30,
          location: `${warehouseName}-库区A-货架1-A02`,
          transferQuantity: 1,
          selected: false
        },
        {
          id: '3',
          code: 'P0003',
          name: '小米手环',
          specification: '标准版',
          unit: '个',
          stock: 100,
          location: `${warehouseName}-库区B-货架1-C01`,
          transferQuantity: 1,
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
          location: `${warehouseName}-库区A-货架1-A01`,
          transferQuantity: 1,
          selected: false
        },
        {
          id: '5',
          code: 'P0005',
          name: '戴尔显示器',
          specification: '24英寸',
          unit: '台',
          stock: 40,
          location: `${warehouseName}-库区B-货架1-C01`,
          transferQuantity: 1,
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
          location: `${warehouseName}-库区A-货架1-A01`,
          transferQuantity: 1,
          selected: false
        },
        {
          id: '7',
          code: 'P0007',
          name: 'OPPO手机',
          specification: '128G',
          unit: '台',
          stock: 50,
          location: `${warehouseName}-库区A-货架1-A02`,
          transferQuantity: 1,
          selected: false
        },
        {
          id: '8',
          code: 'P0008',
          name: 'VIVO手机',
          specification: '64G',
          unit: '台',
          stock: 40,
          location: `${warehouseName}-库区B-货架1-C01`,
          transferQuantity: 1,
          selected: false
        },
        {
          id: '9',
          code: 'P0009',
          name: '荣耀手机',
          specification: '128G',
          unit: '台',
          stock: 45,
          location: `${warehouseName}-库区B-货架1-C02`,
          transferQuantity: 1,
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
          location: `${warehouseName}-库区A-货架1-A01`,
          transferQuantity: 1,
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
          location: `${warehouseName}-库区A-货架1-A01`,
          transferQuantity: 1,
          selected: false
        },
        {
          id: '12',
          code: 'P0012',
          name: '佳能相机',
          specification: '单反',
          unit: '台',
          stock: 15,
          location: `${warehouseName}-库区B-货架1-C01`,
          transferQuantity: 1,
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
  if (!transferForm.sourceWarehouseId) {
    ElMessage.warning('请先选择来源仓库');
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
    loadWarehouseProducts(transferForm.sourceWarehouseId);
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
      targetLocation: ''
    }));
};

// 数量变更
const handleQuantityChange = () => {
  // 同步已选商品的数量
  selectedProducts.value.forEach(selected => {
    const available = availableProducts.value.find(item => item.id === selected.id);
    if (available) {
      selected.transferQuantity = available.transferQuantity;
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
const submitTransferForm = () => {
  transferFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    
    if (selectedProducts.value.length === 0) {
      ElMessage.warning('请至少选择一个商品');
      return;
    }
    
    // 检查是否所有商品都选择了目标位置
    const missingLocation = selectedProducts.value.some(item => !item.targetLocation);
    if (missingLocation) {
      ElMessage.warning('请为所有商品选择目标位置');
      return;
    }
    
    // 模拟API调用
    setTimeout(() => {
      // 生成移库单号
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const transferNo = `TF${year}${month}${day}${random}`;
      
      // 计算商品总数
      const totalQuantity = selectedProducts.value.reduce((sum, item) => sum + item.transferQuantity, 0);
      
      // 构建新的移库单
      const newTransfer = {
        id: (transferList.value.length + 1).toString(),
        transferNo,
        sourceWarehouseId: transferForm.sourceWarehouseId,
        sourceWarehouseName: warehouseOptions.value.find(item => item.id === transferForm.sourceWarehouseId)?.name || '',
        targetWarehouseId: transferForm.targetWarehouseId,
        targetWarehouseName: warehouseOptions.value.find(item => item.id === transferForm.targetWarehouseId)?.name || '',
        productCount: selectedProducts.value.length,
        totalQuantity,
        status: 'pending',
        createBy: '当前用户',
        createTime: `${year}-${month}-${day} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
        remark: transferForm.remark
      };
      
      // 添加到列表
      transferList.value.unshift(newTransfer);
      total.value = transferList.value.length;
      
      ElMessage.success('移库单创建成功');
      addDialog.visible = false;
    }, 500);
  });
};

// 审核移库单
const handleApprove = (row?: any) => {
  const transfer = row || selectedRow.value;
  if (!transfer) {
    ElMessage.warning('请选择要审核的移库单');
    return;
  }
  
  if (transfer.status !== 'pending') {
    ElMessage.warning('只能审核待审核状态的移库单');
    return;
  }
  
  ElMessageBox.confirm(`确认要审核移库单"${transfer.transferNo}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新状态
      const index = transferList.value.findIndex(item => item.id === transfer.id);
      if (index !== -1) {
        const now = new Date();
        transferList.value[index].status = 'approved';
        transferList.value[index].approveBy = '当前用户';
        transferList.value[index].approveTime = now.toLocaleString();
      }
      
      ElMessage.success('审核成功');
    }, 300);
  }).catch(() => {});
};

// 完成移库单
const handleComplete = (row?: any) => {
  const transfer = row || selectedRow.value;
  if (!transfer) {
    ElMessage.warning('请选择要完成的移库单');
    return;
  }
  
  if (transfer.status !== 'approved') {
    ElMessage.warning('只能完成已审核状态的移库单');
    return;
  }
  
  ElMessageBox.confirm(`确认要完成移库单"${transfer.transferNo}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新状态
      const index = transferList.value.findIndex(item => item.id === transfer.id);
      if (index !== -1) {
        const now = new Date();
        transferList.value[index].status = 'completed';
        transferList.value[index].completeBy = '当前用户';
        transferList.value[index].completeTime = now.toLocaleString();
      }
      
      ElMessage.success('移库单已完成');
    }, 300);
  }).catch(() => {});
};

// 取消移库单
const handleCancel = (row?: any) => {
  const transfer = row || selectedRow.value;
  if (!transfer) {
    ElMessage.warning('请选择要取消的移库单');
    return;
  }
  
  if (!['pending', 'approved'].includes(transfer.status)) {
    ElMessage.warning('只能取消待审核或已审核状态的移库单');
    return;
  }
  
  ElMessageBox.confirm(`确认要取消移库单"${transfer.transferNo}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新状态
      const index = transferList.value.findIndex(item => item.id === transfer.id);
      if (index !== -1) {
        const now = new Date();
        transferList.value[index].status = 'cancelled';
        transferList.value[index].cancelBy = '当前用户';
        transferList.value[index].cancelTime = now.toLocaleString();
      }
      
      ElMessage.success('移库单已取消');
    }, 300);
  }).catch(() => {});
};

// 导出移库单
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
    
    .search-bar {
      margin-bottom: 10px;
    }
  }
  
  .selected-products {
    margin-top: 20px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
  }
}
</style>