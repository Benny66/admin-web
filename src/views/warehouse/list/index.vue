<template>
    <div class="app-container">
        <el-card class="filter-container">
        <div class="filter-item">
            <el-form :inline="true" :model="queryParams" @keyup.enter="handleQuery">
            <el-form-item label="仓库名称">
                <el-input v-model="queryParams.name" placeholder="请输入仓库名称" clearable />
            </el-form-item>
            <el-form-item label="仓库编码">
                <el-input v-model="queryParams.code" placeholder="请输入仓库编码" clearable />
            </el-form-item>
            <el-form-item label="仓库类型">
                <el-select v-model="queryParams.type" placeholder="请选择仓库类型" clearable>
                <el-option label="普通仓库" value="normal" />
                <el-option label="冷藏仓库" value="cold" />
                <el-option label="危险品仓库" value="dangerous" />
                <el-option label="保税仓库" value="bonded" />
                </el-select>
            </el-form-item>
            <el-form-item label="仓库状态">
                <el-select v-model="queryParams.status" placeholder="请选择仓库状态" clearable>
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
            <el-button type="primary" @click="handleAdd">新增仓库</el-button>
            <el-button type="danger" :disabled="multiple" @click="handleDelete">删除</el-button>
            <el-button type="success" @click="handleExport">导出</el-button>
        </div>
        </el-card>

        <el-card class="table-container">
        <el-table
            v-loading="loading"
            :data="warehouseList"
            @selection-change="handleSelectionChange"
            border
            style="width: 100%"
        >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="code" label="仓库编码" width="120" />
            <el-table-column prop="name" label="仓库名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="type" label="仓库类型" width="120">
            <template #default="scope">
                <el-tag>{{ getWarehouseTypeLabel(scope.row.type) }}</el-tag>
            </template>
            </el-table-column>
            <el-table-column prop="address" label="仓库地址" min-width="200" show-overflow-tooltip />
            <el-table-column prop="manager" label="负责人" width="100" />
            <el-table-column prop="contact" label="联系电话" width="120" />
            <el-table-column prop="areaCount" label="库区数量" width="100" align="center" />
            <el-table-column prop="status" label="仓库状态" width="100" align="center">
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

        <!-- 添加或修改仓库对话框 -->
        <el-dialog
        :title="dialog.title"
        v-model="dialog.visible"
        width="600px"
        append-to-body
        >
        <el-form
            ref="warehouseFormRef"
            :model="warehouseForm"
            :rules="rules"
            label-width="100px"
        >
            <el-form-item label="仓库名称" prop="name">
            <el-input v-model="warehouseForm.name" placeholder="请输入仓库名称" />
            </el-form-item>
            <el-form-item label="仓库编码" prop="code">
            <el-input v-model="warehouseForm.code" placeholder="请输入仓库编码" />
            </el-form-item>
            <el-form-item label="仓库类型" prop="type">
            <el-select v-model="warehouseForm.type" placeholder="请选择仓库类型" style="width: 100%">
                <el-option label="普通仓库" value="normal" />
                <el-option label="冷藏仓库" value="cold" />
                <el-option label="危险品仓库" value="dangerous" />
                <el-option label="保税仓库" value="bonded" />
            </el-select>
            </el-form-item>
            <el-form-item label="仓库地址" prop="address">
            <el-input v-model="warehouseForm.address" placeholder="请输入仓库地址" />
            </el-form-item>
            <el-form-item label="负责人" prop="manager">
            <el-input v-model="warehouseForm.manager" placeholder="请输入负责人姓名" />
            </el-form-item>
            <el-form-item label="联系电话" prop="contact">
            <el-input v-model="warehouseForm.contact" placeholder="请输入联系电话" />
            </el-form-item>
            <el-form-item label="仓库状态" prop="status">
            <el-radio-group v-model="warehouseForm.status">
                <el-radio label="normal">正常</el-radio>
                <el-radio label="maintenance">维护中</el-radio>
                <el-radio label="closed">已关闭</el-radio>
            </el-radio-group>
            </el-form-item>
            <el-form-item label="备注" prop="remark">
            <el-input
                v-model="warehouseForm.remark"
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

        <!-- 仓库详情对话框 -->
        <el-dialog
        title="仓库详情"
        v-model="detailDialog.visible"
        width="800px"
        append-to-body
        >
        <el-descriptions title="基本信息" :column="2" border>
            <el-descriptions-item label="仓库名称">{{ detailForm.name }}</el-descriptions-item>
            <el-descriptions-item label="仓库编码">{{ detailForm.code }}</el-descriptions-item>
            <el-descriptions-item label="仓库类型">{{ getWarehouseTypeLabel(detailForm.type) }}</el-descriptions-item>
            <el-descriptions-item label="仓库状态">
            <el-tag :type="getStatusType(detailForm.status)">
                {{ getStatusLabel(detailForm.status) }}
            </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="仓库地址" :span="2">{{ detailForm.address }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ detailForm.manager }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ detailForm.contact }}</el-descriptions-item>
            <el-descriptions-item label="库区数量">{{ detailForm.areaCount }}</el-descriptions-item>
            <el-descriptions-item label="货架数量">{{ detailForm.shelfCount }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ detailForm.createTime }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ detailForm.updateTime }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ detailForm.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-areas" v-if="areaList.length > 0">
            <div class="title">库区信息</div>
            <el-table :data="areaList" border style="width: 100%">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="code" label="库区编码" width="120" />
            <el-table-column prop="name" label="库区名称" min-width="150" />
            <el-table-column prop="type" label="库区类型" width="120">
                <template #default="scope">
                <el-tag>{{ getAreaTypeLabel(scope.row.type) }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="shelfCount" label="货架数量" width="100" align="center" />
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
  type: '',
  status: ''
});

// 仓库列表数据
const warehouseList = ref([]);
const total = ref(0);
const loading = ref(false);
const ids = ref<string[]>([]);
const multiple = ref(true);

// 对话框相关
const dialog = reactive({
  visible: false,
  title: '添加仓库'
});

const detailDialog = reactive({
  visible: false
});

// 表单相关
const warehouseFormRef = ref();
const warehouseForm = reactive({
  id: '',
  name: '',
  code: '',
  type: 'normal',
  address: '',
  manager: '',
  contact: '',
  status: 'normal',
  remark: ''
});

// 详情表单
const detailForm = reactive({
  id: '',
  name: '',
  code: '',
  type: '',
  address: '',
  manager: '',
  contact: '',
  areaCount: 0,
  shelfCount: 0,
  status: '',
  createTime: '',
  updateTime: '',
  remark: ''
});

// 库区列表
const areaList = ref([]);

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入仓库编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择仓库类型', trigger: 'change' }],
  address: [{ required: true, message: '请输入仓库地址', trigger: 'blur' }],
  manager: [{ required: true, message: '请输入负责人姓名', trigger: 'blur' }],
  contact: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择仓库状态', trigger: 'change' }]
};

// 初始化
onMounted(() => {
  getWarehouseList();
});

// 获取仓库列表
const getWarehouseList = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    warehouseList.value = [
      {
        id: '1',
        code: 'WH001',
        name: '北京仓库',
        type: 'normal',
        address: '北京市朝阳区xx路xx号',
        manager: '张三',
        contact: '13800138001',
        areaCount: 5,
        status: 'normal',
        createTime: '2023-01-01 12:00:00',
        updateTime: '2023-01-01 12:00:00'
      },
      {
        id: '2',
        code: 'WH002',
        name: '上海仓库',
        type: 'cold',
        address: '上海市浦东新区xx路xx号',
        manager: '李四',
        contact: '13800138002',
        areaCount: 4,
        status: 'normal',
        createTime: '2023-01-02 12:00:00',
        updateTime: '2023-01-02 12:00:00'
      },
      {
        id: '3',
        code: 'WH003',
        name: '广州仓库',
        type: 'normal',
        address: '广州市天河区xx路xx号',
        manager: '王五',
        contact: '13800138003',
        areaCount: 3,
        status: 'maintenance',
        createTime: '2023-01-03 12:00:00',
        updateTime: '2023-01-03 12:00:00'
      },
      {
        id: '4',
        code: 'WH004',
        name: '成都仓库',
        type: 'dangerous',
        address: '成都市武侯区xx路xx号',
        manager: '赵六',
        contact: '13800138004',
        areaCount: 2,
        status: 'normal',
        createTime: '2023-01-04 12:00:00',
        updateTime: '2023-01-04 12:00:00'
      },
      {
        id: '5',
        code: 'WH005',
        name: '深圳仓库',
        type: 'bonded',
        address: '深圳市南山区xx路xx号',
        manager: '钱七',
        contact: '13800138005',
        areaCount: 1,
        status: 'closed',
        createTime: '2023-01-05 12:00:00',
        updateTime: '2023-01-05 12:00:00'
      }
    ];
    total.value = 5;
    loading.value = false;
  }, 500);
};

// 获取仓库类型标签
const getWarehouseTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    normal: '普通仓库',
    cold: '冷藏仓库',
    dangerous: '危险品仓库',
    bonded: '保税仓库'
  };
  return typeMap[type] || type;
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
  getWarehouseList();
};

// 重置查询
const resetQuery = () => {
  queryParams.name = '';
  queryParams.code = '';
  queryParams.type = '';
  queryParams.status = '';
  handleQuery();
};

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  getWarehouseList();
};

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val;
  getWarehouseList();
};

// 多选框选中数据
const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map(item => item.id);
  multiple.value = !selection.length;
};

// 新增仓库
const handleAdd = () => {
  dialog.title = '添加仓库';
  dialog.visible = true;
  
  // 重置表单
  warehouseForm.id = '';
  warehouseForm.name = '';
  warehouseForm.code = '';
  warehouseForm.type = 'normal';
  warehouseForm.address = '';
  warehouseForm.manager = '';
  warehouseForm.contact = '';
  warehouseForm.status = 'normal';
  warehouseForm.remark = '';
};

// 编辑仓库
const handleEdit = (row: any) => {
  dialog.title = '编辑仓库';
  dialog.visible = true;
  
  // 填充表单
  warehouseForm.id = row.id;
  warehouseForm.name = row.name;
  warehouseForm.code = row.code;
  warehouseForm.type = row.type;
  warehouseForm.address = row.address;
  warehouseForm.manager = row.manager;
  warehouseForm.contact = row.contact;
  warehouseForm.status = row.status;
  warehouseForm.remark = row.remark || '';
};

// 查看详情
const handleDetail = (row: any) => {
  detailDialog.visible = true;
  
  // 填充详情表单
  Object.assign(detailForm, {
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type,
    address: row.address,
    manager: row.manager,
    contact: row.contact,
    areaCount: row.areaCount,
    shelfCount: row.areaCount * 8, // 假设每个库区平均有8个货架
    status: row.status,
    createTime: row.createTime,
    updateTime: row.updateTime,
    remark: row.remark || ''
  });
  
  // 模拟获取库区列表
  areaList.value = [];
  for (let i = 1; i <= row.areaCount; i++) {
    areaList.value.push({
      id: `${row.id}-${i}`,
      code: `${row.code}-A${i.toString().padStart(2, '0')}`,
      name: `${row.name}-${i}号库区`,
      type: i % 4 === 0 ? 'cold' : i % 3 === 0 ? 'dangerous' : i % 2 === 0 ? 'special' : 'normal',
      shelfCount: 8,
      status: 'normal'
    });
  }
};

// 修改仓库状态
const handleChangeStatus = (row: any) => {
  const statusText = row.status === 'normal' ? '维护中' : '关闭';
  const newStatus = row.status === 'normal' ? 'maintenance' : 'closed';
  
  ElMessageBox.confirm(`确认要将仓库"${row.name}"状态修改为${statusText}吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新本地数据
      const index = warehouseList.value.findIndex(item => item.id === row.id);
      if (index !== -1) {
        warehouseList.value[index].status = newStatus;
      }
      ElMessage.success(`状态修改成功`);
    }, 200);
  }).catch(() => {});
};

// 删除仓库
const handleDelete = () => {
  const warehouseIds = ids.value.length ? ids.value : [warehouseList.value[0].id];
  const warehouseNames = warehouseIds.map(id => {
    const warehouse = warehouseList.value.find(item => item.id === id);
    return warehouse ? warehouse.name : '';
  }).join('、');
  
  ElMessageBox.confirm(`确认要删除仓库"${warehouseNames}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      // 更新本地数据
      warehouseList.value = warehouseList.value.filter(item => !warehouseIds.includes(item.id));
      total.value = warehouseList.value.length;
      ElMessage.success('删除成功');
    }, 200);
  }).catch(() => {});
};

// 提交表单
const submitForm = () => {
  warehouseFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        if (warehouseForm.id) {
          // 编辑
          const index = warehouseList.value.findIndex(item => item.id === warehouseForm.id);
          if (index !== -1) {
            warehouseList.value[index] = { ...warehouseList.value[index], ...warehouseForm };
          }
          ElMessage.success('修改成功');
        } else {
          // 新增
          const newWarehouse = {
            ...warehouseForm,
            id: (warehouseList.value.length + 1).toString(),
            areaCount: 0,
            createTime: new Date().toLocaleString(),
            updateTime: new Date().toLocaleString()
          };
          warehouseList.value.unshift(newWarehouse);
          total.value = warehouseList.value.length;
          ElMessage.success('添加成功');
        }
        dialog.visible = false;
      }, 200);
    }
  });
};

// 导出仓库
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
  
  .detail-areas {
    margin-top: 20px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  }
}
</style>