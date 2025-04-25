<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>发货管理</span>
          <div class="header-buttons">
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon>新增发货
            </el-button>
            <el-button type="danger" :disabled="multiple" @click="handleBatchDelete">
              <el-icon><Delete /></el-icon>批量删除
            </el-button>
            <el-button type="success" @click="handleExport">
              <el-icon><Download /></el-icon>导出数据
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="queryParams" ref="queryForm" inline>
        <el-form-item label="发货单号" prop="shipmentNo">
          <el-input v-model="queryParams.shipmentNo" placeholder="请输入发货单号" clearable />
        </el-form-item>
        <el-form-item label="物流公司" prop="logisticsCompany">
          <el-select v-model="queryParams.logisticsCompany" placeholder="请选择物流公司" clearable>
            <el-option
              v-for="item in logisticsOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="shipmentList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="shipmentNo" label="发货单号" width="180" />
        <el-table-column prop="orderNo" label="关联订单" width="180" />
        <el-table-column prop="logisticsCompany" label="物流公司" width="120" />
        <el-table-column prop="trackingNo" label="物流单号" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="openDetailDialog(scope.row)">
              <el-icon><View /></el-icon>详情
            </el-button>
            <el-button size="small" type="warning" link @click="openEditDialog(scope.row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">
              <el-icon><Delete /></el-icon>删除
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

    <!-- 详情弹窗 -->
    <el-dialog title="发货单详情" v-model="detailDialog.visible" width="600px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="发货单号">{{ detailDialog.data.shipmentNo }}</el-descriptions-item>
        <el-descriptions-item label="关联订单">{{ detailDialog.data.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="物流公司">{{ getLogisticsLabel(detailDialog.data.logisticsCompany) }}</el-descriptions-item>
        <el-descriptions-item label="物流单号">{{ detailDialog.data.trackingNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTag(detailDialog.data.status)">
            {{ getStatusLabel(detailDialog.data.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailDialog.data.createTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑/新增弹窗 -->
    <el-dialog :title="editDialog.isEdit ? '编辑发货单' : '新增发货单'" v-model="editDialog.visible" width="500px" append-to-body>
      <el-form ref="editFormRef" :model="editDialog.form" :rules="editRules" label-width="100px">
        <el-form-item label="发货单号" prop="shipmentNo">
          <el-input v-model="editDialog.form.shipmentNo" :disabled="editDialog.isEdit" />
        </el-form-item>
        <el-form-item label="关联订单" prop="orderNo">
          <el-input v-model="editDialog.form.orderNo" />
        </el-form-item>
        <el-form-item label="物流公司" prop="logisticsCompany">
          <el-select v-model="editDialog.form.logisticsCompany" placeholder="请选择物流公司">
            <el-option
              v-for="item in logisticsOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号" prop="trackingNo">
          <el-input v-model="editDialog.form.trackingNo" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="editDialog.form.status" placeholder="请选择状态">
            <el-option label="待发货" value="pending" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="canceled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Download, Refresh, View, Edit, Delete } from '@element-plus/icons-vue'

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  shipmentNo: '',
  logisticsCompany: ''
})

// 物流公司选项
const logisticsOptions = ref([
  { value: 'SF', label: '顺丰速运' },
  { value: 'STO', label: '申通快递' },
  { value: 'YTO', label: '圆通速递' },
  { value: 'ZTO', label: '中通快递' },
  { value: 'YD', label: '韵达快递' }
])

// 发货单列表数据
const shipmentList = ref([
  {
    id: '1',
    shipmentNo: 'FH20230501001',
    orderNo: 'DD20230501001',
    logisticsCompany: 'SF',
    trackingNo: 'SF123456789',
    status: 'completed',
    createTime: '2023-05-01 10:30:00'
  },
  {
    id: '2',
    shipmentNo: 'FH20230502001',
    orderNo: 'DD20230502001',
    logisticsCompany: 'YTO',
    trackingNo: 'YT987654321',
    status: 'shipped',
    createTime: '2023-05-02 14:15:00'
  }
])
const total = ref(2)
const loading = ref(false)
const selectedRows = ref([])
const multiple = computed(() => selectedRows.value.length === 0)

// 详情弹窗
const detailDialog = reactive({
  visible: false,
  data: {}
})

// 编辑/新增弹窗
const editDialog = reactive({
  visible: false,
  isEdit: false,
  form: {
    shipmentNo: '',
    orderNo: '',
    logisticsCompany: '',
    trackingNo: '',
    status: 'pending'
  }
})
const editFormRef = ref()
const editRules = {
  shipmentNo: [{ required: true, message: '请输入发货单号', trigger: 'blur' }],
  orderNo: [{ required: true, message: '请输入关联订单', trigger: 'blur' }],
  logisticsCompany: [{ required: true, message: '请选择物流公司', trigger: 'change' }],
  trackingNo: [{ required: true, message: '请输入物流单号', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 状态标签
const getStatusTag = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    shipped: 'info',
    completed: 'success',
    canceled: 'danger'
  }
  return statusMap[status] || ''
}
const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    pending: '待发货',
    shipped: '已发货',
    completed: '已完成',
    canceled: '已取消'
  }
  return labelMap[status] || status
}
const getLogisticsLabel = (val: string) => {
  const found = logisticsOptions.value.find(item => item.value === val)
  return found ? found.label : val
}

// 查询
const handleQuery = () => {
  // TODO: 调用API获取数据
  ElMessage.success('查询成功（模拟）')
}

// 重置
const resetQuery = () => {
  queryParams.shipmentNo = ''
  queryParams.logisticsCompany = ''
  handleQuery()
}

// 分页
const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  handleQuery()
}
const handleCurrentChange = (page: number) => {
  queryParams.pageNum = page
  handleQuery()
}

// 选择行
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

// 新增
const openAddDialog = () => {
  editDialog.isEdit = false
  editDialog.form = {
    shipmentNo: '',
    orderNo: '',
    logisticsCompany: '',
    trackingNo: '',
    status: 'pending'
  }
  editDialog.visible = true
}

// 编辑
const openEditDialog = (row: any) => {
  editDialog.isEdit = true
  editDialog.form = { ...row }
  editDialog.visible = true
}

// 详情
const openDetailDialog = (row: any) => {
  detailDialog.data = { ...row }
  detailDialog.visible = true
}

// 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认要删除发货单 ${row.shipmentNo} 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // TODO: 删除逻辑
    ElMessage.success('删除成功（模拟）')
  })
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) return
  ElMessageBox.confirm(`确认要删除选中的${selectedRows.value.length}条发货单吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // TODO: 批量删除逻辑
    ElMessage.success('批量删除成功（模拟）')
  })
}

// 导出
const handleExport = () => {
  ElMessage.success('导出成功（模拟）')
}

// 保存编辑/新增
const submitEdit = () => {
  editFormRef.value?.validate((valid: boolean) => {
    if (!valid) return
    if (editDialog.isEdit) {
      // TODO: 编辑保存逻辑
      ElMessage.success('编辑成功（模拟）')
    } else {
      // TODO: 新增保存逻辑
      ElMessage.success('新增成功（模拟）')
    }
    editDialog.visible = false
    handleQuery()
  })
}

onMounted(() => {
  handleQuery()
})
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-buttons {
  display: flex;
  gap: 10px;
}
.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>