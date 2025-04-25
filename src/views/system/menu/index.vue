<template>
  <div class="app-container">
    <el-card>
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch">
        <el-form-item label="菜单名称" prop="menuName">
          <el-input
            v-model="queryParams.menuName"
            placeholder="请输入菜单名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="菜单状态" clearable>
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
        <right-toolbar v-model:showSearch="showSearch" @refreshData="getList"></right-toolbar>
      </el-row>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="menuList"
        row-key="menuId"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="menuName" label="菜单名称" :show-overflow-tooltip="true" width="160" />
        <el-table-column prop="icon" label="图标" align="center" width="100">
          <template #default="scope">
            <el-icon v-if="scope.row.icon">
              <component :is="scope.row.icon" />
            </el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序" width="60" align="center" />
        <el-table-column prop="perms" label="权限标识" :show-overflow-tooltip="true" />
        <el-table-column prop="path" label="路由地址" :show-overflow-tooltip="true" />
        <el-table-column prop="component" label="组件路径" :show-overflow-tooltip="true" />
        <el-table-column prop="menuType" label="类型" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.menuType === 'M'">目录</el-tag>
            <el-tag type="success" v-else-if="scope.row.menuType === 'C'">菜单</el-tag>
            <el-tag type="warning" v-else-if="scope.row.menuType === 'F'">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center" width="80">
          <template #default="scope">
            <el-tag type="success" v-if="scope.row.status === '0'">正常</el-tag>
            <el-tag type="danger" v-else>停用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button
              type="text"
              icon="Plus"
              @click="handleAdd(scope.row)"
              v-if="scope.row.menuType !== 'F'"
            >新增</el-button>
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
          </template>
        </el-table-column>
      </el-table>

      <!-- 添加或修改菜单对话框 -->
      <el-dialog :title="title" v-model="open" width="680px" append-to-body>
        <el-form ref="menuForm" :model="form" :rules="rules" label-width="100px">
          <el-row>
            <el-col :span="24">
              <el-form-item label="上级菜单">
                <el-tree-select
                  v-model="form.parentId"
                  :data="menuOptions"
                  :props="{ label: 'menuName', value: 'menuId', children: 'children' }"
                  value-key="menuId"
                  placeholder="选择上级菜单"
                  check-strictly
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="菜单类型" prop="menuType">
                <el-radio-group v-model="form.menuType">
                  <el-radio label="M">目录</el-radio>
                  <el-radio label="C">菜单</el-radio>
                  <el-radio label="F">按钮</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="菜单名称" prop="menuName">
                <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="显示排序" prop="orderNum">
                <el-input-number v-model="form.orderNum" :min="0" :max="999" controls-position="right" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="form.menuType !== 'F'">
            <el-col :span="12">
              <el-form-item label="路由地址" prop="path">
                <el-input v-model="form.path" placeholder="请输入路由地址" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="菜单图标" prop="icon" v-if="form.menuType !== 'F'">
                <el-popover
                  placement="bottom-start"
                  trigger="click"
                  width="460"
                >
                  <template #reference>
                    <el-input v-model="form.icon" placeholder="点击选择图标" readonly>
                      <template #prefix>
                        <el-icon v-if="form.icon">
                          <component :is="form.icon" />
                        </el-icon>
                      </template>
                    </el-input>
                  </template>
                  <div class="icon-selector">
                    <div class="icon-item" v-for="(item, index) in iconList" :key="index" @click="selectIcon(item)">
                      <el-icon>
                        <component :is="item" />
                      </el-icon>
                      <span>{{ item }}</span>
                    </div>
                  </div>
                </el-popover>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="form.menuType === 'C'">
            <el-col :span="12">
              <el-form-item label="组件路径" prop="component">
                <el-input v-model="form.component" placeholder="请输入组件路径" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="权限标识" prop="perms">
                <el-input v-model="form.perms" placeholder="请输入权限标识" maxlength="50" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="form.menuType === 'F'">
            <el-col :span="12">
              <el-form-item label="权限标识" prop="perms">
                <el-input v-model="form.perms" placeholder="请输入权限标识" maxlength="50" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="form.menuType !== 'F'">
            <el-col :span="12">
              <el-form-item label="是否外链">
                <el-radio-group v-model="form.isFrame">
                  <el-radio label="0">是</el-radio>
                  <el-radio label="1">否</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="菜单状态">
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
          <el-row v-if="form.menuType === 'C'">
            <el-col :span="12">
              <el-form-item label="是否缓存">
                <el-radio-group v-model="form.isCache">
                  <el-radio label="0">缓存</el-radio>
                  <el-radio label="1">不缓存</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="显示状态">
                <el-radio-group v-model="form.visible">
                  <el-radio label="0">显示</el-radio>
                  <el-radio label="1">隐藏</el-radio>
                </el-radio-group>
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
import { Search, Plus, Edit, Delete, Refresh } from '@element-plus/icons-vue';

// 查询参数
const queryParams = reactive({
  menuName: '',
  status: ''
});

// 表格数据
const loading = ref(false);
const menuList = ref([]);
const showSearch = ref(true);
const title = ref('');
const open = ref(false);

// 表单参数
const form = reactive({
  menuId: undefined,
  parentId: 0,
  menuName: '',
  orderNum: 0,
  path: '',
  component: '',
  perms: '',
  icon: '',
  menuType: 'M',
  isFrame: '1',
  isCache: '0',
  visible: '0',
  status: '0'
});

// 表单校验规则
const rules = {
  menuName: [
    { required: true, message: '菜单名称不能为空', trigger: 'blur' }
  ],
  orderNum: [
    { required: true, message: '菜单顺序不能为空', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '路由地址不能为空', trigger: 'blur' }
  ]
};

// 状态数据字典
const statusOptions = ref([
  { value: '0', label: '正常' },
  { value: '1', label: '停用' }
]);

// 菜单树选项
const menuOptions = ref([]);

// 图标列表
const iconList = ref([
  'Edit', 'Share', 'Delete', 'Search', 'Setting', 'User', 
  'Menu', 'Location', 'Document', 'Bell', 'List', 'Message',
  'Lock', 'Unlock', 'Refresh', 'Star', 'Download', 'Upload',
  'View', 'Hide', 'Link', 'Calendar', 'Picture', 'Folder',
  'Home', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'
]);

// 模拟菜单数据
const mockMenuList = [
  {
    menuId: 1,
    menuName: '系统管理',
    icon: 'Setting',
    orderNum: 1,
    perms: '',
    path: '/system',
    component: '',
    menuType: 'M',
    status: '0',
    createTime: '2023-01-01 00:00:00',
    children: [
      {
        menuId: 2,
        menuName: '用户管理',
        icon: 'User',
        orderNum: 1,
        perms: 'system:user:list',
        path: 'user',
        component: 'system/user/index',
        menuType: 'C',
        status: '0',
        createTime: '2023-01-01 00:00:00',
        children: [
          {
            menuId: 7,
            menuName: '用户查询',
            icon: '',
            orderNum: 1,
            perms: 'system:user:query',
            path: '',
            component: '',
            menuType: 'F',
            status: '0',
            createTime: '2023-01-01 00:00:00'
          },
          {
            menuId: 8,
            menuName: '用户新增',
            icon: '',
            orderNum: 2,
            perms: 'system:user:add',
            path: '',
            component: '',
            menuType: 'F',
            status: '0',
            createTime: '2023-01-01 00:00:00'
          }
        ]
      },
      {
        menuId: 3,
        menuName: '角色管理',
        icon: 'List',
        orderNum: 2,
        perms: 'system:role:list',
        path: 'role',
        component: 'system/role/index',
        menuType: 'C',
        status: '0',
        createTime: '2023-01-01 00:00:00'
      },
      {
        menuId: 4,
        menuName: '菜单管理',
        icon: 'Menu',
        orderNum: 3,
        perms: 'system:menu:list',
        path: 'menu',
        component: 'system/menu/index',
        menuType: 'C',
        status: '0',
        createTime: '2023-01-01 00:00:00'
      }
    ]
  },
  {
    menuId: 5,
    menuName: '系统监控',
    icon: 'View',
    orderNum: 2,
    perms: '',
    path: '/monitor',
    component: '',
    menuType: 'M',
    status: '0',
    createTime: '2023-01-01 00:00:00',
    children: [
      {
        menuId: 6,
        menuName: '在线用户',
        icon: 'User',
        orderNum: 1,
        perms: 'monitor:online:list',
        path: 'online',
        component: 'monitor/online/index',
        menuType: 'C',
        status: '0',
        createTime: '2023-01-01 00:00:00'
      }
    ]
  }
];

// 获取菜单列表
const getList = () => {
  loading.value = true;
  // 这里应该调用API获取数据，现在使用模拟数据
  setTimeout(() => {
    menuList.value = mockMenuList;
    menuOptions.value = [{ menuId: 0, menuName: '主目录', children: mockMenuList }];
    loading.value = false;
  }, 500);
};

// 搜索按钮操作
const handleQuery = () => {
  getList();
};

// 重置按钮操作
const resetQuery = () => {
  queryParams.menuName = '';
  queryParams.status = '';
  handleQuery();
};

// 新增按钮操作
const handleAdd = (row?: any) => {
  reset();
  if (row) {
    form.parentId = row.menuId;
  }
  open.value = true;
  title.value = '添加菜单';
};

// 修改按钮操作
const handleUpdate = (row: any) => {
  reset();
  form.menuId = row.menuId;
  form.parentId = row.parentId || 0;
  form.menuName = row.menuName;
  form.orderNum = row.orderNum;
  form.path = row.path;
  form.component = row.component;
  form.perms = row.perms;
  form.icon = row.icon;
  form.menuType = row.menuType;
  form.isFrame = row.isFrame || '1';
  form.isCache = row.isCache || '0';
  form.visible = row.visible || '0';
  form.status = row.status;
  open.value = true;
  title.value = '修改菜单';
};

// 删除按钮操作
const handleDelete = (row: any) => {
  ElMessageBox.confirm('是否确认删除名称为"' + row.menuName + '"的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 这里应该调用删除API
    ElMessage.success('删除成功');
    getList();
  }).catch(() => {});
};

// 选择图标
const selectIcon = (icon: string) => {
  form.icon = icon;
};

// 表单重置
const reset = () => {
  form.menuId = undefined;
  form.parentId = 0;
  form.menuName = '';
  form.orderNum = 0;
  form.path = '';
  form.component = '';
  form.perms = '';
  form.icon = '';
  form.menuType = 'M';
  form.isFrame = '1';
  form.isCache = '0';
  form.visible = '0';
  form.status = '0';
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
  
  .icon-selector {
    display: flex;
    flex-wrap: wrap;
    
    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 80px;
      height: 80px;
      margin: 5px;
      padding: 10px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.3s;
      
      &:hover {
        background-color: #f5f7fa;
      }
      
      .el-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }
      
      span {
        font-size: 12px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        width: 100%;
        text-align: center;
      }
    }
  }
}
</style>