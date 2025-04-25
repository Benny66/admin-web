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
            <el-form-item label="出库状态">
              <el-select v-model="queryParams.status" placeholder="请选择出库状态" clearable>
                <el-option label="待审核" value="pending" />
                <el-option label="已审核" value="approved" />
                <el-option label="已出库" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
            <el-form-item label="出库时间">
              <el-date-picker
                v-model="dateRange"
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
          <el-button type="primary" @click="handleAdd">新增出库</el-button>
          <el-button type="success" @click="handleExport">导出</el-button>
        </div>
      </el-card>
  
      <el-card class="table-container">
        <el-table
          v-loading="loading"
          :data="stockOutList"
          border
          style="width: 100%"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="stockOutNo" label="出库单号" min-width="150" />
          <el-table-column prop="stockOutType" label="出库类型" width="100">
            <template #default="scope">
              <el-tag>{{ getStockOutTypeLabel(scope.row.stockOutType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="warehouseName" label="出库仓库" width="120" />
          <el-table-column prop="totalQuantity" label="出库数量" width="100" align="center" />
          <el-table-column prop="totalAmount" label="出库金额" width="120">
            <template #default="scope">
              ¥{{ scope.row.totalAmount.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="出库状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createBy" label="创建人" width="100" />
          <el-table-column prop="createTime" label="创建时间" width="160" />
          <el-table-column label="操作" width="220" align="center">
            <template #default="scope">
              <el-button type="primary" link @click="handleDetail(scope.row)">详情</el-button>
              <el-button
                v-if="scope.row.status === 'pending'"
                type="primary"
                link
                @click="handleEdit(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="scope.row.status === 'pending'"
                type="primary"
                link
                @click="handleApprove(scope.row)"
              >
                审核
              </el-button>
              <el-button
                v-if="scope.row.status === 'pending'"
                type="danger"
                link
                @click="handleCancel(scope.row)"
              >
                取消
              </el-button>
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
  
      <!-- 出库单详情对话框 -->
      <el-dialog
        title="出库单详情"
        v-model="detailDialog.visible"
        width="900px"
        append-to-body
      >
        <el-descriptions title="基本信息" :column="3" border>
          <el-descriptions-item label="出库单号">{{ detailForm.stockOutNo }}</el-descriptions-item>
          <el-descriptions-item label="出库类型">{{ getStockOutTypeLabel(detailForm.stockOutType) }}</el-descriptions-item>
          <el-descriptions-item label="出库状态">
            <el-tag :type="getStatusType(detailForm.status)">
              {{ getStatusLabel(detailForm.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="出库仓库">{{ detailForm.warehouseName }}</el-descriptions-item>
          <el-descriptions-item label="关联订单">{{ detailForm.relatedOrderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收货方">{{ detailForm.receiverName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ detailForm.createBy }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailForm.createTime }}</el-descriptions-item>
          <el-descriptions-item label="审核人">{{ detailForm.approveBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间" :span="2">{{ detailForm.approveTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ detailForm.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
  
        <div class="detail-items">
          <div class="title">出库商品明细</div>
          <el-table :data="detailItems" border style="width: 100%">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="code" label="商品编码" width="120" />
            <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="categoryName" label="商品分类" width="120" />
            <el-table-column prop="quantity" label="出库数量" width="100" align="center" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="scope">
                ¥{{ scope.row.price.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="scope">
                ¥{{ scope.row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
          </el-table>
          <div class="total-info">
            <span>合计：</span>
            <span class="total-quantity">出库数量：{{ detailForm.totalQuantity }} 件</span>
            <span class="total-amount">出库金额：¥{{ detailForm.totalAmount?.toFixed(2) }}</span>
          </div>
        </div>
  
        <div class="detail-log" v-if="operationLogs.length > 0">
          <div class="title">操作日志</div>
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in operationLogs"
              :key="index"
              :timestamp="log.operateTime"
              :type="log.operateType === 'create' ? 'primary' : log.operateType === 'approve' ? 'success' : 'danger'"
            >
              {{ log.operateContent }}（操作人：{{ log.operator }}）
            </el-timeline-item>
          </el-timeline>
        </div>
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
  stockOutNo: '',
  stockOutType: '',
  status: '',
  beginTime: '',
  endTime: ''
});

// 日期范围
const dateRange = ref([]);

// 监听日期范围变化
const watchDateRange = computed(() => {
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.beginTime = dateRange.value[0];
    queryParams.endTime = dateRange.value[1];
  } else {
    queryParams.beginTime = '';
    queryParams.endTime = '';
  }
  return dateRange.value;
});

// 出库列表数据
const stockOutList = ref([]);
const total = ref(0);
const loading = ref(false);

// 详情对话框
const detailDialog = reactive({
  visible: false
});

// 详情表单
const detailForm = reactive({
  id: '',
  stockOutNo: '',
  stockOutType: '',
  warehouseName: '',
  relatedOrderNo: '',
  receiverName: '',
  totalQuantity: 0,
  totalAmount: 0,
  status: '',
  createBy: '',
  createTime: '',
  approveBy: '',
  approveTime: '',
  remark: ''
});

// 详情商品列表
const detailItems = ref([]);

// 操作日志
const operationLogs = ref([]);

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
        stockOutNo: 'CK202301010001',
        stockOutType: 'sale',
        warehouseName: '北京仓库',
        totalQuantity: 50,
        totalAmount: 25000,
        status: 'completed',
        createBy: '张三',
        createTime: '2023-01-01 12:00:00'
      },
      {
        id: '2',
        stockOutNo: 'CK202301020001',
        stockOutType: 'return',
        warehouseName: '上海仓库',
        totalQuantity: 2,
        totalAmount: 1000,
        status: 'approved',
        createBy: '李四',
        createTime: '2023-01-02 12:00:00'
      },
      {
        id: '3',
        stockOutNo: 'CK202301030001',
        stockOutType: 'sale',
        warehouseName: '广州仓库',
        totalQuantity: 20,
        totalAmount: 5000,
        status: 'pending',
        createBy: '王五',
        createTime: '2023-01-03 12:00:00'
      },
      {
        id: '4',
        stockOutNo: 'CK202301040001',
        stockOutType: 'other',
        warehouseName: '成都仓库',
        totalQuantity: 10,
        totalAmount: 2000,
        status: 'cancelled',
        createBy: '赵六',
        createTime: '2023-01-04 12:00:00'
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
    completed: 'success',
    cancelled: 'info'
  };
  return statusMap[status] || '';
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
  queryParams.status = '';
  queryParams.beginTime = '';
  queryParams.endTime = '';
  dateRange.value = [];
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

// 新增出库单
const handleAdd = () => {
  ElMessage.info('新增出库单功能开发中');
};

// 查看详情
const handleDetail = (row: any) => {
  detailDialog.visible = true;
  
  // 模拟获取详情
  setTimeout(() => {
    Object.assign(detailForm, {
      id: row.id,
      stockOutNo: row.stockOutNo,
      stockOutType: row.stockOutType,
      warehouseName: row.warehouseName,
      relatedOrderNo: row.stockOutType === 'sale' ? 'DD202301010001' : '',
      receiverName: row.stockOutType === 'sale' ? '张三客户' : '',
      totalQuantity: row.totalQuantity,
      totalAmount: row.totalAmount,
      status: row.status,
      createBy: row.createBy,
      createTime: row.createTime,
      approveBy: row.status !== 'pending' ? '审核人' : '',
      approveTime: row.status !== 'pending' ? '2023-01-01 14:00:00' : '',
      remark: '这是一条备注信息'
    });
    
    // 模拟获取明细
    detailItems.value = [
      {
        code: 'P001',
        name: '笔记本电脑',
        categoryName: '电子产品',
        quantity: 20,
        price: 5999,
        amount: 119980,
        remark: ''
      },
      {
        code: 'P002',
        name: '智能手机',
        categoryName: '电子产品',
        quantity: 30,
        price: 3999,
        amount: 119970,
        remark: ''
      }
    ];
    
    // 模拟获取操作日志
    operationLogs.value = [
      {
        operateTime: '2023-01-01 12:00:00',
        operateType: 'create',
        operateContent: '创建出库单',
        operator: row.createBy
      }
    ];
    
    if (row.status !== 'pending') {
      operationLogs.value.push({
        operateTime: '2023-01-01 14:00:00',
        operateType: 'approve',
        operateContent: '审核出库单',
        operator: '审核人'
      });
    }
    
    if (row.status === 'completed') {
      operationLogs.value.push({
        operateTime: '2023-01-01 16:00:00',
        operateType: 'complete',
        operateContent: '完成出库',
        operator: '仓库管理员'
      });
    }
    
    if (row.status === 'cancelled') {
      operationLogs.value.push({
        operateTime: '2023-01-01 15:00:00',
        operateType: 'cancel',
        operateContent: '取消出库单',
        operator: row.createBy
      });
    }
  }, 300);
};

// 编辑出库单
const handleEdit = (row: any) => {
  ElMessage.info(`编辑出库单：${row.stockOutNo}`);
};

// 审核出库单
const handleApprove = (row: any) => {
  ElMessageBox.confirm(`确认要审核出库单"${row.stockOutNo}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      ElMessage.success('审核成功');
      getStockOutList();
    }, 200);
  }).catch(() => {});
};

// 取消出库单
const handleCancel = (row: any) => {
  ElMessageBox.confirm(`确认要取消出库单"${row.stockOutNo}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      ElMessage.success('取消成功');
      getStockOutList();
    }, 200);
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
  }
  
  .operation-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-start;
  }
  
  .table-container {
    margin-bottom: 20px;
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
  
  .detail-items {
    margin-top: 20px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .total-info {
      margin-top: 10px;
      text-align: right;
      font-weight: bold;
      
      .total-quantity {
        margin-right: 20px;
      }
    }
  }
  
  .detail-log {
    margin-top: 20px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  }
}
</style>