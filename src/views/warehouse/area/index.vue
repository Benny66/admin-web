<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div class="filter-item">
        <el-form :inline="true" :model="queryParams" @keyup.enter="handleQuery">
          <el-form-item label="库区名称">
            <el-input v-model="queryParams.name" placeholder="请输入库区名称" clearable />
          </el-form-item>
          <el-form-item label="库区编码">
            <el-input v-model="queryParams.code" placeholder="请输入库区编码" clearable />
          </el-form-item>
          <el-form-item label="所属仓库">
            <el-select v-model="queryParams.warehouseId" placeholder="请选择所属仓库" clearable>
              <el-option
                v-for="item in warehouseOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="库区类型">
            <el-select v-model="queryParams.type" placeholder="请选择库区类型" clearable>
              <el-option label="普通区" value="normal" />
              <el-option label="冷藏区" value="cold" />
              <el-option label="危险品区" value="dangerous" />
              <el-option label="特殊区" value="special" />
            </el-select>
          </el-form-item>
          <el-form-item label="库区状态">
            <el-select v-model="queryParams.status" placeholder="请选择库区状态" clearable>
              <el-option label="正常" value="normal" />
              <el-option label="维护中" value="maintenance" />
              <el-option label="已关闭" value="closed" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="operation-container">
        <el-button type="primary" @click="handleAdd">新增库区</el-button>
        <el-button type="danger" :disabled="multiple" @click="handleDelete">删除</el-button>
        <el-button type="success" @click="handleExport">导出</el-button>
      </div>
    </el-card>

    <el-card class="table-container">
      <el-table
        v-loading="loading"
        :data="areaList"
        @selection-change="handleSelectionChange"
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="code" label="库区编码" width="120" />
        <el-table-column prop="name" label="库区名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="warehouseName" label="所属仓库" width="120" />
        <el-table-column prop="type" label="库区类型" width="120">
          <template #default="scope">
            <el-tag>{{ getAreaTypeLabel(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="shelfCount" label="货架数量" width="100" align="center" />
        <el-table-column prop="capacity" label="容量(m³)" width="100" align="center" />
        <el-table-column prop="usageRate" label="使用率" width="100" align="center">
          <template #default="scope">
            <el-progress
              :percentage="scope.row.usageRate"
              :status="scope.row.usageRate > 90 ? 'exception' : scope.row.usageRate > 70 ? 'warning' : ''"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="库区状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="primary" link @click="handleDetail(scope.row)">详情</el-button>
            <el-button
              v-if="scope.row.status !== 'closed'"
              type="danger"
              link
              @click="handleChangeStatus(scope.row)"
            >
              {{ scope.row.status === 'normal' ? '维护' : '关闭' }}
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

    <!-- 添加或修改库区对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="600px"
      append-to-body
    >
      <el-form
        ref="areaFormRef"
        :model="areaForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="库区名称" prop="name">
          <el-input v-model="areaForm.name" placeholder="请输入库区名称" />
        </el-form-item>
        <el-form-item label="库区编码" prop="code">
          <el-input v-model="areaForm.code" placeholder="请输入库区编码" />
        </el-form-item>
        <el-form-item label="所属仓库" prop="warehouseId">
          <el-select v-model="areaForm.warehouseId" placeholder="请选择所属仓库" style="width: 100%">
            <el-option
              v-for="item in warehouseOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="库区类型" prop="type">
          <el-select v-model="areaForm.type" placeholder="请选择库区类型" style="width: 100%">
            <el-option label="普通区" value="normal" />
            <el-option label="冷藏区" value="cold" />
            <el-option label="危险品区" value="dangerous" />
            <el-option label="特殊区" value="special" />
          </el-select>
        </el-form-item>
        <el-form-item label="库区容量" prop="capacity">
          <el-input-number v-model="areaForm.capacity" :min="1" :max="10000" placeholder="请输入库区容量(m³)" style="width: 100%" />
        </el-form-item>
        <el-form-item label="库区状态" prop="status">
          <el-radio-group v-model="areaForm.status">
            <el-radio label="normal">正常</el-radio>
            <el-radio label="maintenance">维护中</el-radio>
            <el-radio label="closed">已关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="areaForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 库区详情对话框 -->
    <el-dialog
      title="库区详情"
      v-model="detailDialog.visible"
      width="800px"
      append-to-body
    >
      <el-descriptions title="基本信息" :column="2" border>
        <el-descriptions-item label="库区名称">{{ detailForm.name }}</el-descriptions-item>
        <el-descriptions-item label="库区编码">{{ detailForm.code }}</el-descriptions-item>
        <el-descriptions-item label="所属仓库">{{ detailForm.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="库区类型">{{ getAreaTypeLabel(detailForm.type) }}</el-descriptions-item>
        <el-descriptions-item label="库区状态">
          <el-tag :type="getStatusType(detailForm.status)">
            {{ getStatusLabel(detailForm.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="货架数量">{{ detailForm.shelfCount }}</el-descriptions-item>
        <el-descriptions-item label="库区容量">{{ detailForm.capacity }} m³</el-descriptions-item>
        <el-descriptions-item label="使用率">
          <el-progress
            :percentage="detailForm.usageRate"
            :status="detailForm.usageRate > 90 ? 'exception' : detailForm.usageRate > 70 ? 'warning' : ''"
          />
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailForm.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detailForm.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailForm.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-shelves" v-if="shelfList.length > 0">
        <div class="title">货架信息</div>
        <el-table :data="shelfList" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="code" label="货架编码" width="120" />
          <el-table-column prop="name" label="货架名称" min-width="150" />
          <el-table-column prop="type" label="货架类型" width="120">
            <template #default="scope">
              <el-tag>{{ getShelfTypeLabel(scope.row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="capacity" label="容量(m³)" width="100" align="center" />
          <el-table-column prop="usageRate" label="使用率" width="120" align="center">
            <template #default="scope">
              <el-progress
                :percentage="scope.row.usageRate"
                :status="scope.row.usageRate > 90 ? 'exception' : scope.row.usageRate > 70 ? 'warning' : ''"
              />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  code: '',
  warehouseId: '',
  type: '',
  status: ''
});

// 仓库列表数据
const areaList = ref([]);
const total = ref(0);
const loading = ref(false);
const ids = ref([]);
const multiple = ref(true);

// 仓库选项
const warehouseOptions = ref([
  { id: '1', name: '北京仓库' },
  { id: '2', name: '上海仓库' },
  { id: '3', name: '广州仓库' },
  { id: '4', name: '深圳仓库' },
  { id: '5', name: '成都仓库' }
]);

// 对话框
const dialog = reactive({
  visible: false,
  title: '添加库区'
});

// 详情对话框
const detailDialog = reactive({
  visible: false
});

// 表单对象
const areaFormRef = ref();
const areaForm = reactive({
  id: '',
  name: '',
  code: '',
  warehouseId: '',
  type: 'normal',
  capacity: 100,
  status: 'normal',
  remark: ''
});

// 详情表单
const detailForm = reactive({
  id: '',
  name: '',
  code: '',
  warehouseId: '',
  warehouseName: '',
  type: '',
  capacity: 0,
  shelfCount: 0,
  usageRate: 0,
  status: '',
  createTime: '',
  updateTime: '',
  remark: ''
});

// 货架列表
const shelfList = ref([]);

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入库区名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入库区编码', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9-]+$/, message: '编码只能包含字母、数字和连字符', trigger: 'blur' }
  ],
  warehouseId: [
    { required: true, message: '请选择所属仓库', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择库区类型', trigger: 'change' }
  ],
  capacity: [
    { required: true, message: '请输入库区容量', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择库区状态', trigger: 'change' }
  ]
};

// 初始化
onMounted(() => {
  getAreaList();
});

// 获取库区列表
const getAreaList = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    areaList.value = [
      {
        id: '1',
        code: 'WH001-A01',
        name: '北京仓库-1号库区',
        warehouseId: '1',
        warehouseName: '北京仓库',
        type: 'normal',
        capacity: 500,
        shelfCount: 10,
        usageRate: 85,
        status: 'normal',
        createTime: '2023-01-01 12:00:00',
        updateTime: '2023-01-01 12:00:00'
      },
      {
        id: '2',
        code: 'WH001-A02',
        name: '北京仓库-2号库区',
        warehouseId: '1',
        warehouseName: '北京仓库',
        type: 'cold',
        capacity: 300,
        shelfCount: 8,
        usageRate: 70,
        status: 'normal',
        createTime: '2023-01-02 12:00:00',
        updateTime: '2023-01-02 12:00:00'
      },
      {
        id: '3',
        code: 'WH002-A01',
        name: '上海仓库-1号库区',
        warehouseId: '2',
        warehouseName: '上海仓库',
        type: 'normal',
        capacity: 400,
        shelfCount: 12,
        usageRate: 60,
        status: 'normal',
        createTime: '2023-01-03 12:00:00',
        updateTime: '2023-01-03 12:00:00'
      },
      {
        id: '4',
        code: 'WH002-A02',
        name: '上海仓库-2号库区',
        warehouseId: '2',
        warehouseName: '上海仓库',
        type: 'dangerous',
        capacity: 200,
        shelfCount: 6,
        usageRate: 90,
        status: 'maintenance',
        createTime: '2023-01-04 12:00:00',
        updateTime: '2023-01-04 12:00:00'
      },
      {
        id: '5',
        code: 'WH003-A01',
        name: '广州仓库-1号库区',
        warehouseId: '3',
        warehouseName: '广州仓库',
        type: 'special',
        capacity: 350,
        shelfCount: 9,
        usageRate: 45,
        status: 'normal',
        createTime: '2023-01-05 12:00:00',
        updateTime: '2023-01-05 12:00:00'
      }
    ];
    total.value = 5;
    loading.value = false;
  }, 500);
};

// 获取库区类型标签
const getAreaTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    normal: '普通区',
    cold: '冷藏区',
    dangerous: '危险品区',
    special: '特殊区'
  };
  return typeMap[type] || type;
};

// 获取货架类型标签
const getShelfTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    standard: '标准货架',
    heavy: '重型货架',
    light: '轻型货架',
    flow: '流动货架',
    cantilever: '悬臂货架'
  };
  return typeMap[type] || type;
};

// 获取状态标签
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    normal: '正常',
    maintenance: '维护中',
    closed: '已关闭'
  };
  return statusMap[status] || status;
};

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    normal: 'success',
    maintenance: 'warning',
    closed: 'info'
  };
  return statusMap[status] || '';
};

// 查询操作
const handleQuery = () => {
  queryParams.pageNum = 1;
  getAreaList();
};

// 重置查询
const resetQuery = () => {
  queryParams.name = '';
  queryParams.code = '';
  queryParams.warehouseId = '';
  queryParams.type = '';
  queryParams.status = '';
  handleQuery();
};

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  getAreaList();
};

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val;
  getAreaList();
};

// 多选框选中数据
const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map(item => item.id);
  multiple.value = !selection.length;
};

// 新增库区
const handleAdd = () => {
  dialog.title = '添加库区';
  dialog.visible = true;
  
  // 重置表单
  areaForm.id = '';
  areaForm.name = '';
  areaForm.code = '';
  areaForm.warehouseId = '';
  areaForm.type = 'normal';
  areaForm.capacity = 100;
  areaForm.status = 'normal';
  areaForm.remark = '';
};

// 编辑库区
const handleEdit = (row: any) => {
  dialog.title = '编辑库区';
  dialog.visible = true;
  
  // 填充表单
  areaForm.id = row.id;
  areaForm.name = row.name;
  areaForm.code = row.code;
  areaForm.warehouseId = row.warehouseId;
  areaForm.type = row.type;
  areaForm.capacity = row.capacity;
  areaForm.status = row.status;
  areaForm.remark = row.remark || '';
};

// 查看详情
const handleDetail = (row: any) => {
  detailDialog.visible = true;
  
  // 填充详情表单
  Object.assign(detailForm, {
    id: row.id,
    name: row.name,
    code: row.code,
    warehouseId: row.warehouseId,
    warehouseName: row.warehouseName,
    type: row.type,
    capacity: row.capacity,
    shelfCount: row.shelfCount,
    usageRate: row.usageRate,
    status: row.status,
    createTime: row.createTime,
    updateTime: row.updateTime,
    remark: row.remark || ''
  });
  
  // 模拟获取货架列表
  shelfList.value = [];
  for (let i = 1; i <= row.shelfCount; i++) {
    const shelfType = i % 5 === 0 ? 'cantilever' : i % 4 === 0 ? 'flow' : i % 3 === 0 ? 'heavy' : i % 2 === 0 ? 'light' : 'standard';
    const usageRate = Math.floor(Math.random() * 100);
    shelfList.value.push({
      id: `${row.id}-${i}`,
      code: `${row.code}-S${i.toString().padStart(2, '0')}`,
      name: `${row.name}-${i}号货架`,
      type: shelfType,
      capacity: Math.floor(row.capacity / row.shelfCount),
      usageRate: usageRate,
      status: usageRate > 90 ? 'maintenance' : 'normal'
    });
  }
};

// 修改库区状态
const handleChangeStatus = (row: any) => {
  const statusText = row.status === 'normal' ? '维护中' : '关闭';
  const newStatus = row.status === 'normal' ? 'maintenance' : 'closed';
  
  ElMessageBox.confirm(`确认要将库区"${row.name}"状态修改为${statusText}吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新本地数据
      const index = areaList.value.findIndex(item => item.id === row.id);
      if (index !== -1) {
        areaList.value[index].status = newStatus;
      }
      ElMessage.success(`状态修改成功`);
    }, 200);
  }).catch(() => {});
};

// 删除库区
const handleDelete = () => {
  const areaIds = ids.value.length ? ids.value : [areaList.value[0].id];
  const areaNames = areaIds.map(id => {
    const area = areaList.value.find(item => item.id === id);
    return area ? area.name : '';
  }).join('、');
  
  ElMessageBox.confirm(`确认要删除库区"${areaNames}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新本地数据
      areaList.value = areaList.value.filter(item => !areaIds.includes(item.id));
      total.value = areaList.value.length;
      ElMessage.success('删除成功');
    }, 200);
  }).catch(() => {});
};

// 提交表单
const submitForm = () => {
  areaFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        if (areaForm.id) {
          // 编辑
          const index = areaList.value.findIndex(item => item.id === areaForm.id);
          if (index !== -1) {
            const warehouseName = warehouseOptions.value.find(item => item.id === areaForm.warehouseId)?.name || '';
            areaList.value[index] = { 
              ...areaList.value[index], 
              ...areaForm,
              warehouseName,
              updateTime: new Date().toLocaleString()
            };
          }
          ElMessage.success('修改成功');
        } else {
          // 新增
          const warehouseName = warehouseOptions.value.find(item => item.id === areaForm.warehouseId)?.name || '';
          const newArea = {
            ...areaForm,
            id: (areaList.value.length + 1).toString(),
            warehouseName,
            shelfCount: 0,
            usageRate: 0,
            createTime: new Date().toLocaleString(),
            updateTime: new Date().toLocaleString()
          };
          areaList.value.unshift(newArea);
          total.value = areaList.value.length;
          ElMessage.success('添加成功');
        }
        dialog.visible = false;
      }, 200);
    }
  });
};

// 导出库区
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
  
  .detail-shelves {
    margin-top: 20px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  }
}
</style>