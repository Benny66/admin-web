<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物流商管理</span>
          <div class="header-buttons">
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon>新增物流商
            </el-button>
            <el-button type="danger" :disabled="multiple" @click="handleBatchDelete">
              <el-icon><Delete /></el-icon>批量删除
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="queryParams" ref="queryForm" inline>
        <el-form-item label="物流商名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入物流商名称" clearable />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
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
        :data="providerList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="code" label="物流商编码" width="120" />
        <el-table-column prop="name" label="物流商名称" width="180" />
        <el-table-column prop="contact" label="联系人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '1' ? 'success' : 'danger'">
              {{ scope.row.status === '1' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="openEditDialog(scope.row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              link 
              @click="handleStatus(scope.row)"
            >
              <el-icon><Switch /></el-icon>{{ scope.row.status === '1' ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />

      <!-- 新增/编辑弹窗 -->
      <el-dialog 
        :title="editDialog.isEdit ? '编辑物流商' : '新增物流商'" 
        v-model="editDialog.visible" 
        width="500px"
        append-to-body
      >
        <el-form ref="editFormRef" :model="editDialog.form" :rules="editRules" label-width="100px">
          <el-form-item label="物流商编码" prop="code">
            <el-input v-model="editDialog.form.code" :disabled="editDialog.isEdit" />
          </el-form-item>
          <el-form-item label="物流商名称" prop="name">
            <el-input v-model="editDialog.form.name" />
          </el-form-item>
          <el-form-item label="联系人" prop="contact">
            <el-input v-model="editDialog.form.contact" />
          </el-form-item>
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="editDialog.form.phone" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="editDialog.form.status" placeholder="请选择状态">
              <el-option label="启用" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">保存</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Refresh, Edit, Switch, Delete } from '@element-plus/icons-vue'

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  status: ''
})

// 物流商列表数据
const providerList = ref([
  {
    id: '1',
    code: 'SF',
    name: '顺丰速运',
    contact: '张三',
    phone: '13800138000',
    status: '1',
    createTime: '2023-01-01 10:00:00'
  },
  {
    id: '2',
    code: 'YTO',
    name: '圆通速递',
    contact: '李四',
    phone: '13900139000',
    status: '0',
    createTime: '2023-02-01 14:30:00'
  }
])
const total = ref(2)
const loading = ref(false)
const selectedRows = ref([])
const multiple = computed(() => selectedRows.value.length === 0)

// 编辑/新增弹窗
const editDialog = reactive({
  visible: false,
  isEdit: false,
  form: {
    id: '',
    code: '',
    name: '',
    contact: '',
    phone: '',
    status: '1'
  }
})
const editFormRef = ref()
const editRules = {
  code: [{ required: true, message: '请输入物流商编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入物流商名称', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 获取物流商列表
const getList = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    loading.value = false
  }, 500)
}

// 查询操作
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

// 重置查询
const resetQuery = () => {
  queryForm.value?.resetFields()
  handleQuery()
}

// 选择行
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

// 新增物流商
const openAddDialog = () => {
  editDialog.isEdit = false
  editDialog.form = {
    id: '',
    code: '',
    name: '',
    contact: '',
    phone: '',
    status: '1'
  }
  editDialog.visible = true
}

// 编辑物流商
const openEditDialog = (row: any) => {
  editDialog.isEdit = true
  editDialog.form = { ...row }
  editDialog.visible = true
}

// 保存编辑/新增
const submitEdit = () => {
  editFormRef.value?.validate((valid: boolean) => {
    if (!valid) return
    if (editDialog.isEdit) {
      // TODO: 调用编辑API
      ElMessage.success('编辑成功')
    } else {
      // TODO: 调用新增API
      ElMessage.success('新增成功')
    }
    editDialog.visible = false
    getList()
  })
}

// 切换状态
const handleStatus = (row: any) => {
  const newStatus = row.status === '1' ? '0' : '1'
  const action = newStatus === '1' ? '启用' : '禁用'
  
  ElMessageBox.confirm(`确认要${action}物流商 ${row.name} 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // TODO: 调用状态切换API
    row.status = newStatus
    ElMessage.success(`${action}成功`)
  })
}

// 删除物流商
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认要删除物流商 ${row.name} 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // TODO: 调用删除API
    ElMessage.success('删除成功')
    getList()
  })
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) return
  
  ElMessageBox.confirm(`确认要删除选中的 ${selectedRows.value.length} 个物流商吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // TODO: 调用批量删除API
    ElMessage.success('批量删除成功')
    getList()
  })
}

onMounted(() => {
  getList()
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
</style>