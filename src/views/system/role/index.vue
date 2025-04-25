<template>
  <div class="app-container">
    <el-card>
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch">
        <el-form-item label="角色名称" prop="roleName">
          <el-input
            v-model="queryParams.roleName"
            placeholder="请输入角色名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="权限字符" prop="roleKey">
          <el-input
            v-model="queryParams.roleKey"
            placeholder="请输入权限字符"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="角色状态" clearable>
            <el-option
              v-for="dict in statusOptions"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮区域 -->
      <el-row :gutter="10" class="mb-4">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
          >新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="success"
            plain
            icon="Edit"
            :disabled="single"
            @click="handleUpdate"
          >修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="multiple"
            @click="handleDelete"
          >删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
          >导出</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @refreshData="getList"></right-toolbar>
      </el-row>

      <!-- 表格区域 -->
      <el-table v-loading="loading" :data="roleList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="角色编号" prop="roleId" width="120" />
        <el-table-column label="角色名称" prop="roleName" :show-overflow-tooltip="true" />
        <el-table-column label="权限字符" prop="roleKey" :show-overflow-tooltip="true" />
        <el-table-column label="显示顺序" prop="roleSort" width="100" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ scope.row.createTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button
              type="text"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              v-if="scope.row.roleId !== 1"
            >修改</el-button>
            <el-button
              type="text"
              icon="Delete"
              @click="handleDelete(scope.row)"
              v-if="scope.row.roleId !== 1"
            >删除</el-button>
            <el-dropdown v-if="scope.row.roleId !== 1">
              <el-button type="text" icon="More">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleDataScope(scope.row)">数据权限</el-dropdown-item>
                  <el-dropdown-item @click="handleAuthUser(scope.row)">分配用户</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />

      <!-- 角色信息弹窗 -->
      <el-dialog :title="title" v-model="open" width="500px" append-to-body>
        <el-form ref="roleForm" :model="form" :rules="rules" label-width="100px">
          <el-form-item label="角色名称" prop="roleName">
            <el-input v-model="form.roleName" placeholder="请输入角色名称" />
          </el-form-item>
          <el-form-item label="权限字符" prop="roleKey">
            <el-input v-model="form.roleKey" placeholder="请输入权限字符" />
          </el-form-item>
          <el-form-item label="角色顺序" prop="roleSort">
            <el-input-number v-model="form.roleSort" :min="0" />
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="form.status">
              <el-radio
                v-for="dict in statusOptions"
                :key="dict.value"
                :label="dict.value"
              >{{ dict.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="菜单权限">
            <el-tree
              :data="menuOptions"
              show-checkbox
              ref="menuRef"
              node-key="id"
              :props="{ label: 'label', children: 'children' }"
            ></el-tree>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 分配角色数据权限对话框 -->
      <el-dialog :title="title" v-model="openDataScope" width="500px" append-to-body>
        <el-form :model="form" label-width="80px">
          <el-form-item label="角色名称">
            <el-input v-model="form.roleName" :disabled="true" />
          </el-form-item>
          <el-form-item label="权限字符">
            <el-input v-model="form.roleKey" :disabled="true" />
          </el-form-item>
          <el-form-item label="权限范围">
            <el-select v-model="form.dataScope">
              <el-option
                v-for="item in dataScopeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="数据权限" v-show="form.dataScope == 2">
            <el-tree
              :data="deptOptions"
              show-checkbox
              default-expand-all
              ref="deptRef"
              node-key="id"
              :props="{ label: 'label', children: 'children' }"
            ></el-tree>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="submitDataScope">确 定</el-button>
            <el-button @click="cancelDataScope">取 消</el-button>
          </div>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Edit, Delete, Refresh, Download, More } from '@element-plus/icons-vue';

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  roleName: '',
  roleKey: '',
  status: ''
});

// 表格数据
const loading = ref(false);
const roleList = ref([]);
const total = ref(0);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const title = ref('');
const open = ref(false);
const openDataScope = ref(false);

// 表单参数
const form = reactive({
  roleId: undefined,
  roleName: '',
  roleKey: '',
  roleSort: 0,
  status: '0',
  menuIds: [],
  deptIds: [],
  dataScope: '1',
  remark: ''
});

// 表单校验规则
const rules = {
  roleName: [
    { required: true, message: '角色名称不能为空', trigger: 'blur' }
  ],
  roleKey: [
    { required: true, message: '权限字符不能为空', trigger: 'blur' }
  ],
  roleSort: [
    { required: true, message: '角色顺序不能为空', trigger: 'blur' }
  ]
};

// 状态数据字典
const statusOptions = ref([
  { value: '0', label: '正常' },
  { value: '1', label: '停用' }
]);

// 数据范围选项
const dataScopeOptions = ref([
  { value: '1', label: '全部数据权限' },
  { value: '2', label: '自定义数据权限' },
  { value: '3', label: '本部门数据权限' },
  { value: '4', label: '本部门及以下数据权限' },
  { value: '5', label: '仅本人数据权限' }
]);

// 菜单树选项
const menuOptions = ref([
  {
    id: 1,
    label: '系统管理',
    children: [
      { id: 2, label: '用户管理' },
      { id: 3, label: '角色管理' },
      { id: 4, label: '菜单管理' }
    ]
  },
  {
    id: 5,
    label: '系统监控',
    children: [
      { id: 6, label: '在线用户' },
      { id: 7, label: '定时任务' },
      { id: 8, label: '服务监控' }
    ]
  }
]);

// 部门树选项
const deptOptions = ref([
  {
    id: 1,
    label: '总公司',
    children: [
      { id: 2, label: '研发部' },
      { id: 3, label: '市场部' },
      { id: 4, label: '财务部' }
    ]
  }
]);

// 模拟角色数据
const mockRoleList = [
  {
    roleId: 1,
    roleName: '超级管理员',
    roleKey: 'admin',
    roleSort: 1,
    status: '0',
    createTime: '2023-01-01 00:00:00'
  },
  {
    roleId: 2,
    roleName: '普通角色',
    roleKey: 'common',
    roleSort: 2,
    status: '0',
    createTime: '2023-01-02 00:00:00'
  }
];

// 引用
const menuRef = ref();
const deptRef = ref();

// 获取角色列表
const getList = () => {
  loading.value = true;
  // 这里应该调用API获取数据，现在使用模拟数据
  setTimeout(() => {
    roleList.value = mockRoleList;
    total.value = mockRoleList.length;
    loading.value = false;
  }, 500);
};

// 表格多选框选中数据
const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map(item => item.roleId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

// 搜索按钮操作
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

// 重置按钮操作
const resetQuery = () => {
  queryParams.roleName = '';
  queryParams.roleKey = '';
  queryParams.status = '';
  handleQuery();
};

// 新增按钮操作
const handleAdd = () => {
  reset();
  open.value = true;
  title.value = '添加角色';
};

// 修改按钮操作
const handleUpdate = (row?: any) => {
  reset();
  if (row) {
    form.roleId = row.roleId;
    form.roleName = row.roleName;
    form.roleKey = row.roleKey;
    form.roleSort = row.roleSort;
    form.status = row.status;
  }
  open.value = true;
  title.value = '修改角色';
};

// 删除按钮操作
const handleDelete = (row?: any) => {
  const roleIds = row?.roleId || ids.value;
  ElMessageBox.confirm('是否确认删除所选角色?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 这里应该调用删除API
    ElMessage.success('删除成功');
    getList();
  }).catch(() => {});
};

// 导出按钮操作
const handleExport = () => {
  ElMessage.success('导出成功');
};

// 角色状态修改
const handleStatusChange = (row: any) => {
  // 这里应该调用修改状态API
  ElMessage.success(`修改${row.roleName}状态成功`);
};

// 数据权限按钮操作
const handleDataScope = (row: any) => {
  reset();
  form.roleId = row.roleId;
  form.roleName = row.roleName;
  form.roleKey = row.roleKey;
  openDataScope.value = true;
  title.value = '分配数据权限';
};

// 分配用户按钮操作
const handleAuthUser = (row: any) => {
  ElMessage.info(`为角色${row.roleName}分配用户`);
};

// 表单重置
const reset = () => {
  form.roleId = undefined;
  form.roleName = '';
  form.roleKey = '';
  form.roleSort = 0;
  form.status = '0';
  form.menuIds = [];
  form.deptIds = [];
  form.dataScope = '1';
  form.remark = '';
};

// 表单提交
const submitForm = () => {
  // 这里应该调用保存API
  ElMessage.success('操作成功');
  open.value = false;
  getList();
};

// 取消按钮
const cancel = () => {
  open.value = false;
  reset();
};

// 提交数据权限
const submitDataScope = () => {
  // 这里应该调用保存数据权限API
  ElMessage.success('设置成功');
  openDataScope.value = false;
  getList();
};

// 取消数据权限
const cancelDataScope = () => {
  openDataScope.value = false;
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
  
  .mb-4 {
    margin-bottom: 16px;
  }
  
  .dialog-footer {
    text-align: center;
  }
}
</style>