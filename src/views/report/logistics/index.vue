<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物流报表</span>
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
        <el-form-item label="物流公司">
          <el-select v-model="queryParams.logisticsCompany" placeholder="请选择物流公司" clearable>
            <el-option
              v-for="item in logisticsOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
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

      <!-- 数据概览 -->
      <el-row :gutter="20" class="mb-20">
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">总发货量</div>
              <div class="data-value">{{ summaryData.totalShipments }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">平均时效</div>
              <div class="data-value">{{ summaryData.avgDeliveryTime }}小时</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">总运费</div>
              <div class="data-value">¥{{ summaryData.totalCost }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">异常率</div>
              <div class="data-value warning">{{ summaryData.abnormalRate }}%</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 数据可视化 -->
      <el-row :gutter="20" class="mb-20">
        <el-col :span="12">
          <el-card shadow="hover">
            <div ref="deliveryTrendChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover">
            <div ref="costAnalysisChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 物流明细表格 -->
      <el-table
        v-loading="loading"
        :data="logisticsList"
        border
        style="width: 100%"
      >
        <el-table-column prop="shipmentNo" label="运单号" width="180" />
        <el-table-column prop="logisticsCompany" label="物流公司" width="120" />
        <el-table-column prop="startCity" label="始发地" width="120" />
        <el-table-column prop="endCity" label="目的地" width="120" />
        <el-table-column prop="weight" label="重量(kg)" width="100" align="right" />
        <el-table-column prop="cost" label="运费(元)" width="100" align="right" />
        <el-table-column prop="deliveryTime" label="时效(小时)" width="100" align="right" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发货时间" width="180" />
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
  logisticsCompany: '',
  dateRange: []
})

// 物流公司选项
const logisticsOptions = ref([
  { value: 'SF', label: '顺丰速运' },
  { value: 'STO', label: '申通快递' },
  { value: 'YTO', label: '圆通速递' },
  { value: 'ZTO', label: '中通快递' },
  { value: 'YD', label: '韵达快递' }
])

// 汇总数据
const summaryData = reactive({
  totalShipments: 156,
  avgDeliveryTime: 24.5,
  totalCost: 12568.50,
  abnormalRate: 3.2
})

// 物流列表数据
const logisticsList = ref([])
const total = ref(0)
const loading = ref(false)
const deliveryTrendChart = ref(null)
const costAnalysisChart = ref(null)

// 初始化图表
const initCharts = () => {
  if (!deliveryTrendChart.value || !costAnalysisChart.value) return
  
  // 物流趋势图
  const trendChart = echarts.init(deliveryTrendChart.value)
  trendChart.setOption({
    title: { text: '物流趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' },
    series: [{ 
      name: '发货量',
      type: 'line',
      data: [120, 132, 101, 134, 90, 230]
    }]
  })

  // 成本分析图
  const costChart = echarts.init(costAnalysisChart.value)
  costChart.setOption({
    title: { text: '成本分析' },
    tooltip: { trigger: 'item' },
    series: [{
      name: '物流成本',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 40, name: '顺丰速运' },
        { value: 35, name: '申通快递' },
        { value: 60, name: '圆通速递' },
        { value: 15, name: '中通快递' },
        { value: 20, name: '韵达快递' }
      ]
    }]
  })
}

// 获取物流状态标签样式
const getStatusTag = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': 'warning',
    'shipped': '',
    'delivered': 'success',
    'abnormal': 'danger'
  }
  return statusMap[status] || ''
}

// 获取物流报表数据
const getLogisticsReport = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    logisticsList.value = [
      {
        shipmentNo: 'SF123456789',
        logisticsCompany: '顺丰速运',
        startCity: '北京',
        endCity: '上海',
        weight: 2.5,
        cost: 25.00,
        deliveryTime: 24,
        status: 'delivered',
        createTime: '2023-06-01 10:30:00'
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
  getLogisticsReport()
}

// 重置查询
const resetQuery = () => {
  queryParams.logisticsCompany = ''
  queryParams.dateRange = []
  handleQuery()
}

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val
  getLogisticsReport()
}

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val
  getLogisticsReport()
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
  getLogisticsReport()
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
    &.warning {
      color: #e6a23c;
    }
  }
}

.mb-20 {
  margin-bottom: 20px;
}
</style>