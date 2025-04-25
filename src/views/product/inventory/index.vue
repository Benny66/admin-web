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
          <el-form-item label="库存状态">
            <el-select v-model="queryParams.stockStatus" placeholder="请选择库存状态" clearable>
              <el-option label="正常" value="normal" />
              <el-option label="预警" value="warning" />
              <el-option label="缺货" value="shortage" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="operation-container">
        <el-button type="primary" @click="handleInventoryAdjust">库存调整</el-button>
        <el-button type="success" @click="handleExport">导出库存</el-button>
      </div>
    </el-card>

    <el-card class="table-container">
      <el-table
        v-loading="loading"
        :data="inventoryList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="code" label="商品编码" width="120" />
        <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="商品分类" width="120" />
        <el-table-column prop="warehouseName" label="所在仓库" width="120" />
        <el-table-column prop="stock" label="当前库存" width="100" align="center" />
        <el-table-column prop="minStock" label="最低库存" width="100" align="center" />
        <el-table-column prop="maxStock" label="最高库存" width="100" align="center" />
        <el-table-column prop="stockStatus" label="库存状态" width="100" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.stockStatus === 'normal' ? 'success' : scope.row.stockStatus === 'warning' ? 'warning' : 'danger'"
            >
              {{ scope.row.stockStatus === 'normal' ? '正常' : scope.row.stockStatus === 'warning' ? '预警' : '缺货' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="160" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="handleStockDetail(scope.row)">库存明细</el-button>
            <el-button type="primary" link @click="handleStockAdjust(scope.row)">调整库存</el-button>
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

    <!-- 库存调整对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="500px"
      append-to-body
    >
      <el-form
        ref="stockFormRef"
        :model="stockForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="商品名称">
          <span>{{ stockForm.name }}</span>
        </el-form-item>
        <el-form-item label="商品编码">
          <span>{{ stockForm.code }}</span>
        </el-form-item>
        <el-form-item label="当前库存">
          <span>{{ stockForm.stock }}</span>
        </el-form-item>
        <el-form-item label="调整类型" prop="adjustType">
          <el-radio-group v-model="stockForm.adjustType">
            <el-radio label="add">增加</el-radio>
            <el-radio label="subtract">减少</el-radio>
            <el-radio label="set">设置为</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整数量" prop="adjustQuantity">
          <el-input-number
            v-model="stockForm.adjustQuantity"
            :min="1"
            :max="10000"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-select v-model="stockForm.reason" placeholder="请选择调整原因">
            <el-option label="盘点调整" value="inventory" />
            <el-option label="损坏报废" value="damage" />
            <el-option label="系统校正" value="correction" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="stockForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitStockAdjust">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 库存明细对话框 -->
    <el-dialog
      title="库存明细"
      v-model="detailDialog.visible"
      width="800px"
      append-to-body
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="商品名称">{{ detailForm.name }}</el-descriptions-item>
        <el-descriptions-item label="商品编码">{{ detailForm.code }}</el-descriptions-item>
        <el-descriptions-item label="商品分类">{{ detailForm.categoryName }}</el-descriptions-item>
        <el-descriptions-item label="所在仓库">{{ detailForm.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ detailForm.stock }}</el-descriptions-item>
        <el-descriptions-item label="库存状态">
          <el-tag
            :type="detailForm.stockStatus === 'normal' ? 'success' : detailForm.stockStatus === 'warning' ? 'warning' : 'danger'"
          >
            {{ detailForm.stockStatus === 'normal' ? '正常' : detailForm.stockStatus === 'warning' ? '预警' : '缺货' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最低库存">{{ detailForm.minStock }}</el-descriptions-item>
        <el-descriptions-item label="最高库存">{{ detailForm.maxStock }}</el-descriptions-item>
      </el-descriptions>

      <div class="stock-history">
        <div class="title">库存变更记录</div>
        <el-table :data="stockHistoryList" border style="width: 100%">
          <el-table-column prop="operateTime" label="操作时间" width="160" />
          <el-table-column prop="operateType" label="操作类型" width="100">
            <template #default="scope">
              <el-tag
                :type="scope.row.operateType === 'add' ? 'success' : scope.row.operateType === 'subtract' ? 'danger' : 'primary'"
              >
                {{ scope.row.operateType === 'add' ? '入库' : scope.row.operateType === 'subtract' ? '出库' : '调整' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量变更" width="100" />
          <el-table-column prop="beforeStock" label="变更前库存" width="100" />
          <el-table-column prop="afterStock" label="变更后库存" width="100" />
          <el-table-column prop="reason" label="变更原因" min-width="120" />
          <el-table-column prop="operator" label="操作人" width="100" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  code: '',
  categoryId: '',
  stockStatus: ''
});

// 库存列表数据
const inventoryList = ref([]);
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
  title: '库存调整'
});

const detailDialog = reactive({
  visible: false
});

// 表单相关
const stockFormRef = ref();
const stockForm = reactive({
  id: '',
  name: '',
  code: '',
  stock: 0,
  adjustType: 'add',
  adjustQuantity: 1,
  reason: '',
  remark: ''
});

// 详情表单
const detailForm = reactive({
  id: '',
  name: '',
  code: '',
  categoryName: '',
  warehouseName: '',
  stock: 0,
  minStock: 0,
  maxStock: 0,
  stockStatus: 'normal'
});

// 库存历史记录
const stockHistoryList = ref([]);

// 表单校验规则
const rules = {
  adjustType: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
  adjustQuantity: [{ required: true, message: '请输入调整数量', trigger: 'blur' }],
  reason: [{ required: true, message: '请选择调整原因', trigger: 'change' }]
};

// 初始化
onMounted(() => {
  getInventoryList();
});

// 获取库存列表
const getInventoryList = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    inventoryList.value = [
      {
        id: '1',
        code: 'P001',
        name: '笔记本电脑',
        categoryId: '1',
        categoryName: '电子产品',
        warehouseName: '北京仓库',
        stock: 100,
        minStock: 20,
        maxStock: 200,
        stockStatus: 'normal',
        updateTime: '2023-01-01 12:00:00'
      },
      {
        id: '2',
        code: 'P002',
        name: '智能手机',
        categoryId: '1',
        categoryName: '电子产品',
        warehouseName: '上海仓库',
        stock: 15,
        minStock: 20,
        maxStock: 200,
        stockStatus: 'warning',
        updateTime: '2023-01-02 12:00:00'
      },
      {
        id: '3',
        code: 'P003',
        name: '男士T恤',
        categoryId: '2',
        categoryName: '服装',
        warehouseName: '广州仓库',
        stock: 500,
        minStock: 100,
        maxStock: 1000,
        stockStatus: 'normal',
        updateTime: '2023-01-03 12:00:00'
      },
      {
        id: '4',
        code: 'P004',
        name: '巧克力',
        categoryId: '3',
        categoryName: '食品',
        warehouseName: '成都仓库',
        stock: 0,
        minStock: 50,
        maxStock: 500,
        stockStatus: 'shortage',
        updateTime: '2023-01-04 12:00:00'
      },
      {
        id: '5',
        code: 'P005',
        name: '床上四件套',
        categoryId: '4',
        categoryName: '家居',
        warehouseName: '北京仓库',
        stock: 50,
        minStock: 20,
        maxStock: 100,
        stockStatus: 'normal',
        updateTime: '2023-01-05 12:00:00'
      }
    ];
    total.value = 5;
    loading.value = false;
  }, 500);
};

// 查询操作
const handleQuery = () => {
  queryParams.pageNum = 1;
  getInventoryList();
};

// 重置查询
const resetQuery = () => {
  queryParams.name = '';
  queryParams.code = '';
  queryParams.categoryId = '';
  queryParams.stockStatus = '';
  handleQuery();
};

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  getInventoryList();
};

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val;
  getInventoryList();
};

// 批量库存调整
const handleInventoryAdjust = () => {
  ElMessage.info('批量库存调整功能开发中');
};

// 导出库存
const handleExport = () => {
  ElMessage.success('导出成功');
};

// 查看库存明细
const handleStockDetail = (row: any) => {
  detailDialog.visible = true;
  Object.assign(detailForm, row);
  
  // 模拟获取库存历史记录
  stockHistoryList.value = [
    {
      operateTime: '2023-01-05 10:00:00',
      operateType: 'add',
      quantity: 20,
      beforeStock: 30,
      afterStock: 50,
      reason: '采购入库',
      operator: '张三'
    },
    {
      operateTime: '2023-01-04 14:30:00',
      operateType: 'subtract',
      quantity: 10,
      beforeStock: 40,
      afterStock: 30,
      reason: '销售出库',
      operator: '李四'
    },
    {
      operateTime: '2023-01-03 09:15:00',
      operateType: 'set',
      quantity: 40,
      beforeStock: 35,
      afterStock: 40,
      reason: '盘点调整',
      operator: '王五'
    }
  ];
};

// 调整库存
const handleStockAdjust = (row: any) => {
  resetStockForm();
  dialog.visible = true;
  
  Object.assign(stockForm, {
    id: row.id,
    name: row.name,
    code: row.code,
    stock: row.stock
  });
};

// 重置库存表单
const resetStockForm = () => {
  stockForm.id = '';
  stockForm.name = '';
  stockForm.code = '';
  stockForm.stock = 0;
  stockForm.adjustType = 'add';
  stockForm.adjustQuantity = 1;
  stockForm.reason = '';
  stockForm.remark = '';
};

// 提交库存调整
const submitStockAdjust = () => {
  stockFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success('库存调整成功');
        dialog.visible = false;
        getInventoryList();
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
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
  
  .stock-history {
    margin-top: 20px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  }
}
</style>