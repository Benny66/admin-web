<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div class="filter-item">
        <el-form :inline="true" :model="queryParams" @keyup.enter="handleQuery">
          <el-form-item label="分类名称">
            <el-input v-model="queryParams.name" placeholder="请输入分类名称" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
              <el-option label="启用" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="operation-container">
        <el-button type="primary" @click="handleAdd">新增分类</el-button>
      </div>
    </el-card>

    <el-card class="table-container">
      <el-table
        v-loading="loading"
        :data="categoryList"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === '1' ? 'success' : 'info'">
              {{ scope.row.status === '1' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="handleAdd(scope.row)">新增</el-button>
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加或修改分类对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="500px"
      append-to-body
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="上级分类">
          <el-tree-select
            v-model="categoryForm.parentId"
            :data="categoryOptions"
            :props="{ label: 'name', value: 'id' }"
            placeholder="请选择上级分类"
            check-strictly
            clearable
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="显示排序" prop="sort">
          <el-input-number v-model="categoryForm.sort" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="categoryForm.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 查询参数
const queryParams = reactive({
  name: '',
  status: ''
});

// 分类列表数据
const categoryList = ref([]);
const loading = ref(false);

// 分类选项
const categoryOptions = ref([]);

// 对话框相关
const dialog = reactive({
  visible: false,
  title: ''
});

// 表单相关
const categoryFormRef = ref();
const categoryForm = reactive({
  id: '',
  parentId: '',
  name: '',
  sort: 0,
  status: '1'
});

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入显示排序', trigger: 'blur' }]
};

// 初始化
onMounted(() => {
  getCategoryList();
});

// 获取分类列表
const getCategoryList = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    categoryList.value = [
      {
        id: '1',
        name: '电子产品',
        sort: 1,
        status: '1',
        createTime: '2023-01-01 12:00:00',
        children: [
          {
            id: '1-1',
            name: '手机',
            sort: 1,
            status: '1',
            createTime: '2023-01-01 12:30:00'
          },
          {
            id: '1-2',
            name: '电脑',
            sort: 2,
            status: '1',
            createTime: '2023-01-01 12:40:00'
          }
        ]
      },
      {
        id: '2',
        name: '服装',
        sort: 2,
        status: '1',
        createTime: '2023-01-02 12:00:00',
        children: [
          {
            id: '2-1',
            name: '男装',
            sort: 1,
            status: '1',
            createTime: '2023-01-02 12:30:00'
          },
          {
            id: '2-2',
            name: '女装',
            sort: 2,
            status: '1',
            createTime: '2023-01-02 12:40:00'
          }
        ]
      },
      {
        id: '3',
        name: '食品',
        sort: 3,
        status: '1',
        createTime: '2023-01-03 12:00:00'
      },
      {
        id: '4',
        name: '家居',
        sort: 4,
        status: '0',
        createTime: '2023-01-04 12:00:00'
      }
    ];
    loading.value = false;
    
    // 构建分类选项
    categoryOptions.value = [
      {
        id: '0',
        name: '顶级分类',
        children: JSON.parse(JSON.stringify(categoryList.value))
      }
    ];
  }, 500);
};

// 查询操作
const handleQuery = () => {
  getCategoryList();
};

// 重置查询
const resetQuery = () => {
  queryParams.name = '';
  queryParams.status = '';
  handleQuery();
};

// 新增分类
const handleAdd = (row?: any) => {
  resetForm();
  dialog.visible = true;
  dialog.title = '新增分类';
  
  if (row && row.id) {
    categoryForm.parentId = row.id;
  }
};

// 编辑分类
const handleEdit = (row: any) => {
  resetForm();
  dialog.visible = true;
  dialog.title = '编辑分类';
  
  // 模拟获取详情
  setTimeout(() => {
    Object.assign(categoryForm, {
      id: row.id,
      parentId: row.parentId || '',
      name: row.name,
      sort: row.sort,
      status: row.status
    });
  }, 100);
};

// 删除分类
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认要删除分类"${row.name}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      ElMessage.success('删除成功');
      getCategoryList();
    }, 200);
  }).catch(() => {});
};

// 重置表单
const resetForm = () => {
  categoryForm.id = '';
  categoryForm.parentId = '';
  categoryForm.name = '';
  categoryForm.sort = 0;
  categoryForm.status = '1';
};

// 提交表单
const submitForm = () => {
  categoryFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success(categoryForm.id ? '修改成功' : '新增成功');
        dialog.visible = false;
        getCategoryList();
      }, 300);
    }
  });
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
}
</style>