<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>运营报表</span>
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
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="指标类型">
          <el-select v-model="queryParams.metric" placeholder="请选择指标" clearable>
            <el-option label="销售额" value="sales" />
            <el-option label="订单量" value="orders" />
            <el-option label="用户数" value="users" />
            <el-option label="转化率" value="conversion" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据概览 -->
      <el-row :gutter="20" class="mb-20">
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">总销售额</div>
              <div class="data-value">¥{{ summaryData.totalSales }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">总订单量</div>
              <div class="data-value">{{ summaryData.totalOrders }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">新增用户</div>
              <div class="data-value">{{ summaryData.newUsers }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">转化率</div>
              <div class="data-value">{{ summaryData.conversionRate }}%</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 数据可视化 -->
      <el-row :gutter="20" class="mb-20">
        <el-col :span="12">
          <el-card shadow="hover">
            <div ref="trendChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover">
            <div ref="metricChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 明细表格 -->
      <el-table
        v-loading="loading"
        :data="operationList"
        border
        style="width: 100%"
      >
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="sales" label="销售额(元)" width="120" align="right" />
        <el-table-column prop="orders" label="订单量" width="100" align="right" />
        <el-table-column prop="newUsers" label="新增用户" width="100" align="right" />
        <el-table-column prop="conversionRate" label="转化率(%)" width="120" align="right" />
        <el-table-column prop="avgOrderValue" label="客单价(元)" width="120" align="right" />
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
  dateRange: [],
  metric: ''
})

// 汇总数据
const summaryData = reactive({
  totalSales: 125680.50,
  totalOrders: 156,
  newUsers: 85,
  conversionRate: 32.5
})

// 运营列表数据
const operationList = ref([])
const total = ref(0)
const loading = ref(false)
const trendChart = ref(null)
const metricChart = ref(null)

// 初始化图表
const initCharts = () => {
  if (!trendChart.value || !metricChart.value) return
  
  // 趋势图
  const trend = echarts.init(trendChart.value)
  trend.setOption({
    title: { text: '运营趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' },
    series: [{ 
      name: '销售额',
      type: 'line',
      data: [12000, 13200, 10100, 13400, 9000, 23000]
    }]
  })

  // 指标图
  const metric = echarts.init(metricChart.value)
  metric.setOption({
    title: { text: '指标分布' },
    tooltip: { trigger: 'item' },
    series: [{
      name: '指标分布',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 40, name: '销售额' },
        { value: 35, name: '订单量' },
        { value: 25, name: '用户数' }
      ]
    }]
  })
}

// 获取运营报表数据
const getOperationReport = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    operationList.value = [
      {
        date: '2023-06-01',
        sales: 8990.00,
        orders: 56,
        newUsers: 32,
        conversionRate: 28.5,
        avgOrderValue: 160.54
      },
      // 更多模拟数据...
    ]
    total.value = 50
    loading.value = false
  }, 500)
}

// 查询操作
const handleQuery = () => {
  queryParams.pageNum = 1
  getOperationReport()
}

// 重置查询
const resetQuery = () => {
  queryParams.dateRange = []
  queryParams.metric = ''
  handleQuery()
}

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val
  getOperationReport()
}

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val
  getOperationReport()
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
  getOperationReport()
  initCharts()
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
  }
}

.mb-20 {
  margin-bottom: 20px;
}
</style>