<template>
  <div class="app-container">
    <el-card>
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch">
        <el-form-item label="用户名称" prop="username">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input
            v-model="queryParams.phone"
            placeholder="请输入手机号码"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="用户状态" clearable>
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
      <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="用户编号" align="center" prop="userId" />
        <el-table-column label="用户名称" align="center" prop="username" :show-overflow-tooltip="true" />
        <el-table-column label="用户昵称" align="center" prop="nickName" :show-overflow-tooltip="true" />
        <el-table-column label="部门" align="center" prop="deptName" :show-overflow-tooltip="true" />
        <el-table-column label="手机号码" align="center" prop="phone" width="120" />
        <el-table-column label="状态" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
        <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button
              type="text"
              icon="Edit"
              @click="handleUpdate(scope.row)"
            >修改</el-button>
            <el-button
              type="text"
              icon="Delete"
              @click="handleDelete(scope.row)"
            >删除</el-button>
            <el-dropdown>
              <el-button type="text" icon="More">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleResetPwd(scope.row)">重置密码</el-dropdown-item>
                  <el-dropdown-item @click="handleAuthRole(scope.row)">分配角色</el-dropdown-item>
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

      <!-- 用户信息弹窗 -->
      <el-dialog :title="title" v-model="open" width="600px" append-to-body>
        <el-form ref="userForm" :model="form" :rules="rules" label-width="80px">
          <el-row>
            <el-col :span="12">
              <el-form-item label="用户名称" prop="username">
                <el-input v-model="form.username" placeholder="请输入用户名称" :disabled="form.userId !== undefined" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="用户昵称" prop="nickName">
                <el-input v-model="form.nickName" placeholder="请输入用户昵称" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="部门" prop="deptId">
                <el-tree-select
                  v-model="form.deptId"
                  :data="deptOptions"
                  :props="{ label: 'deptName', value: 'deptId' }"
                  placeholder="请选择部门"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号码" prop="phone">
                <el-input v-model="form.phone" placeholder="请输入手机号码" maxlength="11" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别">
                <el-select v-model="form.sex">
                  <el-option label="男" value="0" />
                  <el-option label="女" value="1" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="状态">
                <el-radio-group v-model="form.status">
                  <el-radio
                    v-for="dict in statusOptions"
                    :key="dict.value"
                    :label="dict.value"
                  >{{ dict.label }}</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="form.userId === undefined">
            <el-col :span="24">
              <el-form-item label="密码" prop="password">
                <el-input v-model="form.password" placeholder="请输入密码" type="password" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-form-item label="角色">
                <el-select v-model="form.roleIds" multiple placeholder="请选择角色">
                  <el-option
                    v-for="item in roleOptions"
                    :key="item.roleId"
                    :label="item.roleName"
                    :value="item.roleId"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
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
  username: '',
  phone: '',
  status: ''
});

// 表格数据
const loading = ref(false);
const userList = ref([]);
const total = ref(0);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const title = ref('');
const open = ref(false);

// 表单参数
const form = reactive({
  userId: undefined,
  username: '',
  nickName: '',
  password: '',
  phone: '',
  email: '',
  sex: '0',
  status: '0',
  remark: '',
  deptId: undefined,
  roleIds: []
});

// 表单校验规则
const rules = {
  username: [
    { required: true, message: '用户名称不能为空', trigger: 'blur' }
  ],
  nickName: [
    { required: true, message: '用户昵称不能为空', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '用户密码不能为空', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

// 状态数据字典
const statusOptions = ref([
  { value: '0', label: '正常' },
  { value: '1', label: '停用' }
]);

// 部门数据
const deptOptions = ref([
  { deptId: 1, deptName: '总公司', children: [
    { deptId: 2, deptName: '研发部' },
    { deptId: 3, deptName: '市场部' },
    { deptId: 4, deptName: '财务部' }
  ]}
]);

// 角色数据
const roleOptions = ref([
  { roleId: 1, roleName: '管理员' },
  { roleId: 2, roleName: '普通用户' }
]);

// 模拟用户数据
const mockUserList = [
  {
    userId: 1,
    username: 'admin',
    nickName: '管理员',
    deptName: '研发部',
    phone: '13800138000',
    status: '0',
    createTime: '2023-01-01 00:00:00'
  },
  {
    userId: 2,
    username: 'test',
    nickName: '测试用户',
    deptName: '市场部',
    phone: '13800138001',
    status: '0',
    createTime: '2023-01-02 00:00:00'
  }
];

// 获取用户列表
const getList = () => {
  loading.value = true;
  // 这里应该调用API获取数据，现在使用模拟数据
  setTimeout(() => {
    userList.value = mockUserList;
    total.value = mockUserList.length;
    loading.value = false;
  }, 500);
};

// 表格多选框选中数据
const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map(item => item.userId);
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
  queryParams.username = '';
  queryParams.phone = '';
  queryParams.status = '';
  handleQuery();
};

// 新增按钮操作
const handleAdd = () => {
  reset();
  open.value = true;
  title.value = '添加用户';
};

// 修改按钮操作
const handleUpdate = (row?: any) => {
  reset();
  if (row) {
    form.userId = row.userId;
    form.username = row.username;
    form.nickName = row.nickName;
    form.phone = row.phone;
    form.status = row.status;
  }
  open.value = true;
  title.value = '修改用户';
};

// 删除按钮操作
const handleDelete = (row?: any) => {
  const userIds = row?.userId || ids.value;
  ElMessageBox.confirm('是否确认删除所选用户?', '警告', {
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

// 用户状态修改
const handleStatusChange = (row: any) => {
  // 这里应该调用修改状态API
  ElMessage.success(`修改${row.username}状态成功`);
};

// 重置密码按钮操作
const handleResetPwd = (row: any) => {
  ElMessageBox.prompt('请输入新密码', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'password',
    inputValidator: (value) => {
      if (!value) {
        return '密码不能为空';
      }
      return true;
    }
  }).then(({ value }) => {
    // 这里应该调用重置密码API
    ElMessage.success(`重置${row.username}密码成功`);
  }).catch(() => {});
};

// 分配角色按钮操作
const handleAuthRole = (row: any) => {
  ElMessage.info(`为用户${row.username}分配角色`);
};

// 表单重置
const reset = () => {
  form.userId = undefined;
  form.username = '';
  form.nickName = '';
  form.password = '';
  form.phone = '';
  form.email = '';
  form.sex = '0';
  form.status = '0';
  form.remark = '';
  form.deptId = undefined;
  form.roleIds = [];
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