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
            <el-form-item label="入库状态">
              <el-select v-model="queryParams.status" placeholder="请选择入库状态" clearable>
                <el-option label="待审核" value="pending" />
                <el-option label="已审核" value="approved" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
            <el-form-item label="入库时间">
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
          <el-button type="primary" @click="handleAdd">新增入库</el-button>
          <el-button type="success" @click="handleExport">导出</el-button>
        </div>
      </el-card>
  
      <el-card class="table-container">
        <el-table
          v-loading="loading"
          :data="stockInList"
          border
          style="width: 100%"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="stockInNo" label="入库单号" min-width="150" />
          <el-table-column prop="stockInType" label="入库类型" width="100">
            <template #default="scope">
              <el-tag>{{ getStockInTypeLabel(scope.row.stockInType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="warehouseName" label="入库仓库" width="120" />
          <el-table-column prop="totalQuantity" label="入库数量" width="100" align="center" />
          <el-table-column prop="totalAmount" label="入库金额" width="120">
            <template #default="scope">
              ¥{{ scope.row.totalAmount.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="入库状态" width="100" align="center">
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
  
      <!-- 入库单详情对话框 -->
      <el-dialog
        title="入库单详情"
        v-model="detailDialog.visible"
        width="900px"
        append-to-body
      >
        <el-descriptions title="基本信息" :column="3" border>
          <el-descriptions-item label="入库单号">{{ detailForm.stockInNo }}</el-descriptions-item>
          <el-descriptions-item label="入库类型">{{ getStockInTypeLabel(detailForm.stockInType) }}</el-descriptions-item>
          <el-descriptions-item label="入库状态">
            <el-tag :type="getStatusType(detailForm.status)">
              {{ getStatusLabel(detailForm.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="入库仓库">{{ detailForm.warehouseName }}</el-descriptions-item>
          <el-descriptions-item label="关联单号">{{ detailForm.relatedOrderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ detailForm.supplierName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ detailForm.createBy }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailForm.createTime }}</el-descriptions-item>
          <el-descriptions-item label="审核人">{{ detailForm.approveBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间" :span="2">{{ detailForm.approveTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ detailForm.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
  
        <div class="detail-items">
          <div class="title">入库商品明细</div>
          <el-table :data="detailItems" border style="width: 100%">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="code" label="商品编码" width="120" />
            <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="categoryName" label="商品分类" width="120" />
            <el-table-column prop="quantity" label="入库数量" width="100" align="center" />
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
            <span class="total-quantity">入库数量：{{ detailForm.totalQuantity }} 件</span>
            <span class="total-amount">入库金额：¥{{ detailForm.totalAmount?.toFixed(2) }}</span>
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
    stockInNo: '',
    stockInType: '',
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
  
  // 入库列表数据
  const stockInList = ref([]);
  const total = ref(0);
  const loading = ref(false);
  
  // 详情对话框
  const detailDialog = reactive({
    visible: false
  });
  
  // 详情表单
  const detailForm = reactive({
    id: '',
    stockInNo: '',
    stockInType: '',
    warehouseName: '',
    relatedOrderNo: '',
    supplierName: '',
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
          stockInNo: 'RK202301010001',
          stockInType: 'purchase',
          warehouseName: '北京仓库',
          totalQuantity: 100,
          totalAmount: 50000,
          status: 'completed',
          createBy: '张三',
          createTime: '2023-01-01 12:00:00'
        },
        {
          id: '2',
          stockInNo: 'RK202301020001',
          stockInType: 'return',
          warehouseName: '上海仓库',
          totalQuantity: 5,
          totalAmount: 2500,
          status: 'approved',
          createBy: '李四',
          createTime: '2023-01-02 12:00:00'
        },
        {
          id: '3',
          stockInNo: 'RK202301030001',
          stockInType: 'purchase',
          warehouseName: '广州仓库',
          totalQuantity: 50,
          totalAmount: 10000,
          status: 'pending',
          createBy: '王五',
          createTime: '2023-01-03 12:00:00'
        },
        {
          id: '4',
          stockInNo: 'RK202301040001',
          stockInType: 'other',
          warehouseName: '成都仓库',
          totalQuantity: 20,
          totalAmount: 5000,
          status: 'cancelled',
          createBy: '赵六',
          createTime: '2023-01-04 12:00:00'
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
      completed: 'success',
      cancelled: 'info'
    };
    return statusMap[status] || '';
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
    queryParams.status = '';
    queryParams.beginTime = '';
    queryParams.endTime = '';
    dateRange.value = [];
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
  
  // 新增入库单
  const handleAdd = () => {
    ElMessage.info('新增入库单功能开发中');
  };
  
  // 查看详情
  const handleDetail = (row: any) => {
    detailDialog.visible = true;
    
    // 模拟获取详情
    setTimeout(() => {
      Object.assign(detailForm, {
        id: row.id,
        stockInNo: row.stockInNo,
        stockInType: row.stockInType,
        warehouseName: row.warehouseName,
        relatedOrderNo: row.stockInType === 'purchase' ? 'CG202301010001' : '',
        supplierName: row.stockInType === 'purchase' ? '示例供应商' : '',
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
          quantity: 50,
          price: 5999,
          amount: 299950,
          remark: ''
        },
        {
          code: 'P002',
          name: '智能手机',
          categoryName: '电子产品',
          quantity: 50,
          price: 3999,
          amount: 199950,
          remark: ''
        }
      ];
      
      // 模拟获取操作日志
      operationLogs.value = [
        {
          operateTime: '2023-01-01 12:00:00',
          operateType: 'create',
          operateContent: '创建入库单',
          operator: row.createBy
        }
      ];
      
      if (row.status !== 'pending') {
        operationLogs.value.push({
          operateTime: '2023-01-01 14:00:00',
          operateType: 'approve',
          operateContent: '审核入库单',
          operator: '审核人'
        });
      }
      
      if (row.status === 'completed') {
        operationLogs.value.push({
          operateTime: '2023-01-01 16:00:00',
          operateType: 'complete',
          operateContent: '完成入库',
          operator: '仓库管理员'
        });
      }
      
      if (row.status === 'cancelled') {
        operationLogs.value.push({
          operateTime: '2023-01-01 15:00:00',
          operateType: 'cancel',
          operateContent: '取消入库单',
          operator: row.createBy
        });
      }
    }, 300);
  };
  
  // 编辑入库单
  const handleEdit = (row: any) => {
    ElMessage.info(`编辑入库单：${row.stockInNo}`);
  };
  
  // 审核入库单
  const handleApprove = (row: any) => {
    ElMessageBox.confirm(`确认要审核入库单"${row.stockInNo}"吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success('审核成功');
        getStockInList();
      }, 200);
    }).catch(() => {});
  };
  
  // 取消入库单
  const handleCancel = (row: any) => {
    ElMessageBox.confirm(`确认要取消入库单"${row.stockInNo}"吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success('取消成功');
        getStockInList();
      }, 200);
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