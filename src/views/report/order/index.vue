<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单报表</span>
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
        <el-form-item label="订单状态">
          <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable>
            <el-option label="待付款" value="1" />
            <el-option label="待发货" value="2" />
            <el-option label="已发货" value="3" />
            <el-option label="已完成" value="4" />
            <el-option label="已取消" value="5" />
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
              <div class="data-title">订单总数</div>
              <div class="data-value">{{ summaryData.totalOrders }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">订单金额</div>
              <div class="data-value">¥{{ summaryData.totalAmount }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">异常订单</div>
              <div class="data-value warning">{{ summaryData.abnormalOrders }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="data-card">
              <div class="data-title">平均客单价</div>
              <div class="data-value">¥{{ summaryData.avgPrice }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 数据可视化 -->
      <el-row :gutter="20" class="mb-20">
        <el-col :span="12">
          <el-card shadow="hover">
            <div ref="orderTrendChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover">
            <div ref="orderStatusChart" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 订单明细表格 -->
      <el-table
        v-loading="loading"
        :data="orderList"
        border
        style="width: 100%"
      >
        <el-table-column prop="orderNo" label="订单编号" width="180" />
        <el-table-column prop="createTime" label="下单时间" width="180" />
        <el-table-column prop="customerName" label="客户名称" width="120" />
        <el-table-column prop="amount" label="订单金额" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.amount }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="scope">
            <el-tag :type="getOrderStatusTag(scope.row.status)">
              {{ getOrderStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="120" />
        <el-table-column prop="warning" label="预警状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.warning" type="danger">
              {{ scope.row.warning }}
            </el-tag>
          </template>
        </el-table-column>
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
  status: '',
  dateRange: []
})

// 汇总数据
const summaryData = reactive({
  totalOrders: 156,
  totalAmount: 125680.50,
  abnormalOrders: 8,
  avgPrice: 805.64
})

// 订单列表数据
const orderList = ref([])
const total = ref(0)
const loading = ref(false)
const orderTrendChart = ref(null)
const orderStatusChart = ref(null)

// 初始化图表
const initCharts = () => {
  if (!orderTrendChart.value || !orderStatusChart.value) return
  
  // 订单趋势图
  const trendChart = echarts.init(orderTrendChart.value)
  trendChart.setOption({
    title: { text: '订单趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' },
    series: [{ 
      name: '订单量',
      type: 'line',
      data: [120, 132, 101, 134, 90, 230]
    }]
  })

  // 订单状态分布图
  const statusChart = echarts.init(orderStatusChart.value)
  statusChart.setOption({
    title: { text: '订单状态分布' },
    tooltip: { trigger: 'item' },
    series: [{
      name: '订单状态',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 40, name: '待付款' },
        { value: 35, name: '待发货' },
        { value: 60, name: '已发货' },
        { value: 15, name: '已完成' },
        { value: 6, name: '已取消' }
      ]
    }]
  })
}

// 获取订单状态标签样式
const getOrderStatusTag = (status: string) => {
  const statusMap: Record<string, string> = {
    '1': 'warning',
    '2': 'info',
    '3': '',
    '4': 'success',
    '5': 'danger'
  }
  return statusMap[status] || ''
}

// 获取订单状态文本
const getOrderStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    '1': '待付款',
    '2': '待发货',
    '3': '已发货',
    '4': '已完成',
    '5': '已取消'
  }
  return textMap[status] || status
}

// 获取订单报表数据
const getOrderReport = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    orderList.value = [
      {
        orderNo: 'DD20230601001',
        createTime: '2023-06-01 10:30:00',
        customerName: '张三',
        amount: 899.00,
        status: '3',
        paymentMethod: '支付宝',
        warning: ''
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
  getOrderReport()
}

// 重置查询
const resetQuery = () => {
  queryParams.status = ''
  queryParams.dateRange = []
  handleQuery()
}

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val
  getOrderReport()
}

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val
  getOrderReport()
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
  getOrderReport()
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