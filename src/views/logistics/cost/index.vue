<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物流费用</span>
          <div class="header-buttons">
            <el-button type="primary" @click="handleExport">
              <el-icon><Download /></el-icon>导出数据
            </el-button>
            <el-button type="warning" @click="handleAnalyze">
              <el-icon><DataAnalysis /></el-icon>费用分析
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="queryParams" ref="queryForm" inline>
        <el-form-item label="日期范围" prop="dateRange">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="物流公司" prop="logisticsCompany">
          <el-select v-model="queryParams.logisticsCompany" placeholder="请选择物流公司" clearable>
            <el-option
              v-for="item in logisticsOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="costList"
        border
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="logisticsCompany" label="物流公司" width="120" />
        <el-table-column prop="shipmentCount" label="发货量" width="100" align="center" />
        <el-table-column prop="totalWeight" label="总重量(kg)" width="120" align="right" />
        <el-table-column prop="totalAmount" label="总金额(元)" width="120" align="right" />
        <el-table-column prop="avgCost" label="均单价(元)" width="120" align="right" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleDetail(scope.row)">
              <el-icon><View /></el-icon>详情
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
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog title="物流费用详情" v-model="detailDialog.visible" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日期">{{ detailDialog.data.date }}</el-descriptions-item>
        <el-descriptions-item label="物流公司">{{ detailDialog.data.logisticsCompany }}</el-descriptions-item>
        <el-descriptions-item label="发货量">{{ detailDialog.data.shipmentCount }}</el-descriptions-item>
        <el-descriptions-item label="总重量(kg)">{{ detailDialog.data.totalWeight }}</el-descriptions-item>
        <el-descriptions-item label="总金额(元)">{{ detailDialog.data.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="均单价(元)">{{ detailDialog.data.avgCost }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 费用分析弹窗 -->
    <el-dialog title="费用分析" v-model="analyzeDialog.visible" width="800px">
      <div style="height: 400px">
        <!-- 这里可以添加图表组件 -->
        <div v-if="analyzeDialog.data.length > 0">
          <el-table :data="analyzeDialog.data" border>
            <el-table-column prop="date" label="日期" />
            <el-table-column prop="company" label="物流公司" />
            <el-table-column prop="amount" label="金额(元)" />
          </el-table>
        </div>
        <el-empty v-else description="暂无分析数据" />
      </div>
      <template #footer>
        <el-button @click="analyzeDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Search, Download, Refresh, View, DataAnalysis } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 弹窗状态
const detailDialog = reactive({
  visible: false,
  data: {} as any
})

const analyzeDialog = reactive({
  visible: false,
  data: [] as any[]
})

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  dateRange: [],
  logisticsCompany: ''
})

// 物流公司选项
const logisticsOptions = ref([
  { value: 'SF', label: '顺丰速运' },
  { value: 'STO', label: '申通快递' },
  { value: 'YTO', label: '圆通速递' },
  { value: 'ZTO', label: '中通快递' },
  { value: 'YD', label: '韵达快递' }
])

// 费用列表数据
const costList = ref([
  {
    date: '2023-05-01',
    logisticsCompany: 'SF',
    shipmentCount: 15,
    totalWeight: 45.6,
    totalAmount: 1250.5,
    avgCost: 83.37
  },
  {
    date: '2023-05-02',
    logisticsCompany: 'YTO',
    shipmentCount: 28,
    totalWeight: 78.2,
    totalAmount: 980.0,
    avgCost: 35.0
  }
])
const total = ref(2)
const loading = ref(false)

// 获取汇总数据
const getSummaries = (param: any) => {
  const { columns, data } = param
  const sums: string[] = []
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (['shipmentCount', 'totalWeight', 'totalAmount'].includes(column.property)) {
      const values = data.map((item: any) => Number(item[column.property]))
      if (!values.every((value: number) => isNaN(value))) {
        sums[index] = values.reduce((prev: number, curr: number) => {
          const value = Number(curr)
          if (!isNaN(value)) {
            return prev + curr
          } else {
            return prev
          }
        }, 0).toFixed(2)
      } else {
        sums[index] = 'N/A'
      }
    } else if (column.property === 'avgCost') {
      const totalAmount = data.reduce((sum: number, item: any) => sum + Number(item.totalAmount), 0)
      const shipmentCount = data.reduce((sum: number, item: any) => sum + Number(item.shipmentCount), 0)
      sums[index] = (totalAmount / shipmentCount).toFixed(2)
    } else {
      sums[index] = ''
    }
  })
  return sums
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

// 获取费用列表
const getList = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    loading.value = false
  }, 500)
}

// 查看详情
const handleDetail = (row: any) => {
  detailDialog.data = row
  detailDialog.visible = true
}

// 费用分析
const handleAnalyze = () => {
  // 这里可以添加分析逻辑
  analyzeDialog.data = costList.value.map(item => ({
    date: item.date,
    company: item.logisticsCompany,
    amount: item.totalAmount
  }))
  analyzeDialog.visible = true
}

// 导出CSV
const handleExport = () => {
  const headers = ['日期', '物流公司', '发货量', '总重量(kg)', '总金额(元)', '均单价(元)']
  const csvContent = [
    headers.join(','),
    ...costList.value.map(item => 
      [item.date, item.logisticsCompany, item.shipmentCount, item.totalWeight, item.totalAmount, item.avgCost].join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `物流费用_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}
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