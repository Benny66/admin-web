<template>
  <div class="app-container">
    <el-card class="filter-container">
      <div class="filter-item">
        <el-form :inline="true" :model="queryParams" @keyup.enter="handleQuery">
          <el-form-item label="商品名称">
            <el-input v-model="queryParams.name" placeholder="请输入商品名称" clearable />
          </el-form-item>
          <el-form-item label="商品编码">
            <el-input v-model="queryParams.code" placeholder="请输入商品编码" clearable />
          </el-form-item>
          <el-form-item label="商品分类">
            <el-select v-model="queryParams.categoryId" placeholder="请选择商品分类" clearable>
              <el-option
                v-for="item in categoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
              <el-option label="上架" value="1" />
              <el-option label="下架" value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="operation-container">
        <el-button type="primary" @click="handleAdd">新增商品</el-button>
        <el-button type="success" @click="handleExport">导出</el-button>
      </div>
    </el-card>

    <el-card class="table-container">
      <el-table
        v-loading="loading"
        :data="productList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="code" label="商品编码" width="120" />
        <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="商品分类" width="120" />
        <el-table-column prop="price" label="售价" width="100">
          <template #default="scope">
            ¥{{ scope.row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === '1' ? 'success' : 'info'">
              {{ scope.row.status === '1' ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="primary" link @click="handleDetail(scope.row)">详情</el-button>
            <el-button
              type="primary"
              link
              :class="{ 'text-danger': scope.row.status === '1' }"
              @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.status === '1' ? '下架' : '上架' }}
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

    <!-- 添加或修改商品对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="800px"
      append-to-body
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="rules"
        label-width="100px"
      >
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="商品名称" prop="name">
                  <el-input v-model="productForm.name" placeholder="请输入商品名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品编码" prop="code">
                  <el-input v-model="productForm.code" placeholder="请输入商品编码" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品分类" prop="categoryId">
                  <el-select v-model="productForm.categoryId" placeholder="请选择商品分类">
                    <el-option
                      v-for="item in categoryOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品价格" prop="price">
                  <el-input-number
                    v-model="productForm.price"
                    :precision="2"
                    :min="0"
                    :step="0.01"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品重量" prop="weight">
                  <el-input-number
                    v-model="productForm.weight"
                    :precision="2"
                    :min="0"
                    :step="0.01"
                    style="width: 100%"
                  >
                    <template #suffix>kg</template>
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品状态" prop="status">
                  <el-radio-group v-model="productForm.status">
                    <el-radio label="1">上架</el-radio>
                    <el-radio label="0">下架</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
          <el-tab-pane label="商品详情" name="detail">
            <el-form-item label="商品图片">
              <el-upload
                action="#"
                list-type="picture-card"
                :auto-upload="false"
                :file-list="fileList"
                :on-preview="handlePictureCardPreview"
                :on-remove="handleRemove"
                :on-change="handleFileChange"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <el-dialog v-model="dialogImageVisible" title="预览图片">
                <img w-full :src="dialogImageUrl" alt="Preview Image" />
              </el-dialog>
            </el-form-item>
            <el-form-item label="商品描述" prop="description">
              <el-input
                v-model="productForm.description"
                type="textarea"
                :rows="4"
                placeholder="请输入商品描述"
              />
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="规格参数" name="spec">
            <el-form-item label="规格参数">
              <el-button type="primary" @click="addSpecItem">添加规格</el-button>
              <el-table :data="productForm.specifications" border style="margin-top: 10px">
                <el-table-column label="规格名称" prop="name">
                  <template #default="scope">
                    <el-input v-model="scope.row.name" placeholder="规格名称" />
                  </template>
                </el-table-column>
                <el-table-column label="规格值" prop="value">
                  <template #default="scope">
                    <el-input v-model="scope.row.value" placeholder="规格值" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="scope">
                    <el-button type="danger" link @click="removeSpecItem(scope.$index)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
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
import { Plus } from '@element-plus/icons-vue';

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  code: '',
  categoryId: '',
  status: ''
});

// 商品列表数据
const productList = ref([]);
const total = ref(0);
const loading = ref(false);

// 分类选项
const categoryOptions = ref([
  { value: '1', label: '电子产品' },
  { value: '2', label: '服装' },
  { value: '3', label: '食品' },
  { value: '4', label: '家居' }
]);

// 对话框相关
const dialog = reactive({
  visible: false,
  title: ''
});

// 表单相关
const productFormRef = ref();
const activeTab = ref('basic');
const productForm = reactive({
  id: '',
  name: '',
  code: '',
  categoryId: '',
  price: 0,
  weight: 0,
  status: '1',
  description: '',
  specifications: []
});

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入商品价格', trigger: 'blur' }]
};

// 图片上传相关
const fileList = ref([]);
const dialogImageUrl = ref('');
const dialogImageVisible = ref(false);

// 初始化
onMounted(() => {
  getProductList();
});

// 获取商品列表
const getProductList = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    productList.value = [
      {
        id: '1',
        code: 'P001',
        name: '笔记本电脑',
        categoryId: '1',
        categoryName: '电子产品',
        price: 5999,
        stock: 100,
        status: '1',
        createTime: '2023-01-01 12:00:00'
      },
      {
        id: '2',
        code: 'P002',
        name: '智能手机',
        categoryId: '1',
        categoryName: '电子产品',
        price: 3999,
        stock: 200,
        status: '1',
        createTime: '2023-01-02 12:00:00'
      },
      {
        id: '3',
        code: 'P003',
        name: '男士T恤',
        categoryId: '2',
        categoryName: '服装',
        price: 99,
        stock: 500,
        status: '1',
        createTime: '2023-01-03 12:00:00'
      },
      {
        id: '4',
        code: 'P004',
        name: '巧克力',
        categoryId: '3',
        categoryName: '食品',
        price: 29.9,
        stock: 1000,
        status: '0',
        createTime: '2023-01-04 12:00:00'
      },
      {
        id: '5',
        code: 'P005',
        name: '床上四件套',
        categoryId: '4',
        categoryName: '家居',
        price: 299,
        stock: 50,
        status: '1',
        createTime: '2023-01-05 12:00:00'
      }
    ];
    total.value = 5;
    loading.value = false;
  }, 500);
};

// 查询操作
const handleQuery = () => {
  queryParams.pageNum = 1;
  getProductList();
};

// 重置查询
const resetQuery = () => {
  queryParams.name = '';
  queryParams.code = '';
  queryParams.categoryId = '';
  queryParams.status = '';
  handleQuery();
};

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  getProductList();
};

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val;
  getProductList();
};

// 新增商品
const handleAdd = () => {
  resetForm();
  dialog.visible = true;
  dialog.title = '新增商品';
};

// 编辑商品
const handleEdit = (row: any) => {
  resetForm();
  dialog.visible = true;
  dialog.title = '编辑商品';
  // 模拟获取详情
  setTimeout(() => {
    Object.assign(productForm, {
      id: row.id,
      name: row.name,
      code: row.code,
      categoryId: row.categoryId,
      price: row.price,
      weight: 1.5,
      status: row.status,
      description: '这是一段商品描述',
      specifications: [
        { name: '品牌', value: '示例品牌' },
        { name: '型号', value: '示例型号' }
      ]
    });
    fileList.value = [
      {
        name: '商品图片',
        url: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'
      }
    ];
  }, 100);
};

// 查看商品详情
const handleDetail = (row: any) => {
  // 实际项目中可以跳转到详情页或弹出详情对话框
  ElMessage.info(`查看商品: ${row.name}`);
};

// 修改商品状态
const handleStatusChange = (row: any) => {
  const text = row.status === '1' ? '下架' : '上架';
  ElMessageBox.confirm(`确认要${text}商品"${row.name}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      row.status = row.status === '1' ? '0' : '1';
      ElMessage.success(`${text}成功`);
    }, 200);
  }).catch(() => {});
};

// 导出商品
const handleExport = () => {
  ElMessage.success('导出成功');
};

// 重置表单
const resetForm = () => {
  productForm.id = '';
  productForm.name = '';
  productForm.code = '';
  productForm.categoryId = '';
  productForm.price = 0;
  productForm.weight = 0;
  productForm.status = '1';
  productForm.description = '';
  productForm.specifications = [];
  fileList.value = [];
  activeTab.value = 'basic';
};

// 提交表单
const submitForm = () => {
  productFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success(productForm.id ? '修改成功' : '新增成功');
        dialog.visible = false;
        getProductList();
      }, 300);
    }
  });
};

// 图片上传相关方法
const handleRemove = (file: any) => {
  const index = fileList.value.indexOf(file);
  if (index !== -1) {
    fileList.value.splice(index, 1);
  }
};

const handlePictureCardPreview = (file: any) => {
  dialogImageUrl.value = file.url;
  dialogImageVisible.value = true;
};

const handleFileChange = (file: any) => {
  fileList.value.push(file);
};

// 规格参数相关方法
const addSpecItem = () => {
  productForm.specifications.push({
    name: '',
    value: ''
  });
};

const removeSpecItem = (index: number) => {
  productForm.specifications.splice(index, 1);
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
  
  .text-danger {
    color: #F56C6C;
  }
}
</style>