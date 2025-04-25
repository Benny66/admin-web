<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>库存报表</span>
          <div class="header-buttons">
            <el-button type="primary" plain @click="exportReport">
              <el-icon><Download /></el-icon>导出报表
            </el-button>
            <el-button type="primary" plain @click="printReport">
              <el-icon><Printer /></el-icon>打印报表
            </el-button>
          </div>
        </div>
      </template>

      <!-- 查询条件 -->
      <el-form :model="queryParams" inline>
        <el-form-item label="仓库">
          <el-select v-model="queryParams.warehouse" placeholder="请选择仓库">
            <el-option
              v-for="item in warehouseOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品分类">
          <el-cascader
            v-model="queryParams.category"
            :options="categoryOptions"
            placeholder="请选择商品分类"
          />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 库存数据展示 -->
      <el-row :gutter="20" class="mb-20">
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">总库存量</div>
              <div class="data-value">{{ summaryData.totalQuantity }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">库存商品数</div>
              <div class="data-value">{{ summaryData.productCount }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">库存预警数</div>
              <div class="data-value warning">{{ summaryData.warningCount }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">库存周转率</div>
              <div class="data-value">{{ summaryData.turnoverRate }}%</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 库存趋势图表 -->
      <el-card class="mb-20">
        <div ref="trendChart" style="height: 400px;"></div>
      </el-card>

      <!-- 库存明细表格 -->
      <el-table
        v-loading="loading"
        :data="inventoryList"
        border
        style="width: 100%"
      >
        <el-table-column prop="productCode" label="商品编码" width="120" />
        <el-table-column prop="productName" label="商品名称" width="150" />
        <el-table-column prop="categoryName" label="商品分类" width="120" />
        <el-table-column prop="warehouseName" label="所在仓库" width="120" />
        <el-table-column prop="location" label="库位" width="120" />
        <el-table-column prop="currentStock" label="当前库存" width="100" />
        <el-table-column prop="minStock" label="最低库存" width="100" />
        <el-table-column prop="maxStock" label="最高库存" width="100" />
        <el-table-column label="库存状态" width="100">
          <template #default="scope">
            <el-tag :type="getStockStatusTag(scope.row.stockStatus)">
              {{ scope.row.stockStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastInDate" label="最后入库" width="120" />
        <el-table-column prop="lastOutDate" label="最后出库" width="120" />
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import * as echarts from 'echarts'
import { Download, Printer } from '@element-plus/icons-vue'

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  warehouse: '',
  category: [],
  dateRange: []
})

// 仓库选项
const warehouseOptions = ref([
  { id: '1', name: '北京仓库' },
  { id: '2', name: '上海仓库' },
  { id: '3', name: '广州仓库' },
  { id: '4', name: '成都仓库' },
  { id: '5', name: '深圳仓库' }
])

// 分类选项
const categoryOptions = ref([
  {
    value: '1',
    label: '电子产品',
    children: [
      { value: '11', label: '手机' },
      { value: '12', label: '电脑' },
      { value: '13', label: '配件' }
    ]
  },
  {
    value: '2',
    label: '服装',
    children: [
      { value: '21', label: '男装' },
      { value: '22', label: '女装' },
      { value: '23', label: '童装' }
    ]
  }
])

// 汇总数据
const summaryData = reactive({
  totalQuantity: 1568,
  productCount: 126,
  warningCount: 18,
  turnoverRate: 85.6
})

// 库存列表数据
const inventoryList = ref([])
const total = ref(0)
const loading = ref(false)
const trendChart = ref(null)

// 获取库存报表数据
const getInventoryReport = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    inventoryList.value = [
      {
        productCode: 'P10001',
        productName: 'iPhone 13',
        categoryName: '手机',
        warehouseName: '北京仓库',
        location: 'A区-1排-01',
        currentStock: 56,
        minStock: 10,
        maxStock: 100,
        stockStatus: 'normal',
        lastInDate: '2023-06-15',
        lastOutDate: '2023-06-10'
      },
      // 更多模拟数据...
    ]
    total.value = 50
    loading.value = false
  }, 500)
}

// 初始化趋势图表
const initTrendChart = () => {
  if (!trendChart.value) return
  
  const chart = echarts.init(trendChart.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['入库量', '出库量', '库存量']
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '入库量',
        type: 'bar',
        data: [120, 132, 101, 134, 90, 230]
      },
      {
        name: '出库量',
        type: 'bar',
        data: [110, 121, 90, 114, 80, 210]
      },
      {
        name: '库存量',
        type: 'line',
        data: [320, 332, 301, 334, 390, 430]
      }
    ]
  }
  chart.setOption(option)
}

// 获取库存状态标签样式
const getStockStatusTag = (status: string) => {
  const statusMap = {
    normal: '',
    warning: 'warning',
    danger: 'danger'
  }
  return statusMap[status] || ''
}

// 查询操作
const handleQuery = () => {
  queryParams.pageNum = 1
  getInventoryReport()
}

// 重置查询
const resetQuery = () => {
  queryParams.warehouse = ''
  queryParams.category = []
  queryParams.dateRange = []
  handleQuery()
}

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val
  getInventoryReport()
}

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val
  getInventoryReport()
}

// 导出报表
const exportReport = () => {
  // 实现导出逻辑
}

// 打印报表
const printReport = () => {
  window.print()
}

onMounted(() => {
  getInventoryReport()
  initTrendChart()
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

.data-card {
  text-align: center;
  .data-title {
    font-size: 14px;
    color: #909399;
  }
  .data-value {
    font-size: 24px;
    font-weight: bold;
    margin-top: 10px;
    &.warning {
      color: #e6a23c;
    }
  }
}

.mb-20 {
  margin-bottom: 20px;
}
</style>