<template>
  <div class="dashboard-container">
    <!-- 欢迎信息与用户设置 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <template #header>
            <div class="card-header">
              <span>欢迎回来，{{ userStore.name }}！</span>
              <div>
                <el-button type="text" @click="refreshData">
                  <el-icon><Refresh /></el-icon>刷新数据
                </el-button>
                <el-button type="text" @click="navigateTo('/user/profile')">
                  <el-icon><User /></el-icon>个人设置
                </el-button>
              </div>
            </div>
          </template>
          <div class="welcome-content">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="6">
                <div class="data-item">
                  <el-icon class="icon"><User /></el-icon>
                  <div class="content">
                    <div class="value">{{ stats.userCount }}</div>
                    <div class="label">系统用户</div>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <div class="data-item">
                  <el-icon class="icon"><Box /></el-icon>
                  <div class="content">
                    <div class="value">{{ stats.warehouseCount }}</div>
                    <div class="label">仓库数量</div>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <div class="data-item">
                  <el-icon class="icon"><ShoppingCart /></el-icon>
                  <div class="content">
                    <div class="value">{{ stats.orderCount }}</div>
                    <div class="label">今日订单</div>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <div class="data-item">
                  <el-icon class="icon"><Money /></el-icon>
                  <div class="content">
                    <div class="value">¥{{ stats.salesAmount }}</div>
                    <div class="label">今日销售额</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 仓库与库存概览 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>仓库库存概览</span>
              <el-button type="text" @click="navigateTo('/warehouse/overview')">查看详情</el-button>
            </div>
          </template>
          <div class="chart-container" ref="warehouseChart"></div>
        </el-card>
      </el-col>
      
      <!-- 订单与物流动态 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订单物流动态</span>
              <el-button type="text" @click="navigateTo('/logistics/tracking')">查看详情</el-button>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(logistics, index) in logisticsList"
              :key="index"
              :timestamp="logistics.time"
            >
              {{ logistics.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- 关键指标与统计图表 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>关键业务指标</span>
              <el-radio-group v-model="chartType">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
                <el-radio-button label="quarter">本季</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container" ref="businessChart"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待处理任务与提醒 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待处理任务</span>
              <el-button type="text" @click="navigateTo('/order/process')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="pendingTasks" style="width: 100%">
            <el-table-column prop="type" label="任务类型" width="120" />
            <el-table-column prop="count" label="数量" width="80" />
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.priority === '高' ? 'danger' : 'warning'">
                  {{ scope.row.priority }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="scope">
                <el-button size="small" @click="handleTask(scope.row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 报表与分析快捷入口 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>报表与分析</span>
            </div>
          </template>
          <div class="shortcut-list">
            <div 
              class="shortcut-item" 
              v-for="(report, index) in reportShortcuts" 
              :key="index" 
              @click="navigateTo(report.path)"
            >
              <el-icon class="icon"><component :is="report.icon" /></el-icon>
              <span class="label">{{ report.title }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 仓库布局可视化 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>仓库布局可视化</span>
              <el-select v-model="selectedWarehouse" placeholder="选择仓库" style="width: 200px">
                <el-option
                  v-for="item in warehouseOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>
          </template>
          <div class="warehouse-map">
            <div class="map-container" ref="warehouseMap"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统公告与帮助 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统公告</span>
              <el-button type="text" @click="navigateTo('/system/notice')">查看全部</el-button>
            </div>
          </template>
          <div class="notice-list">
            <div class="notice-item" v-for="(notice, index) in notices" :key="index">
              <div class="notice-title">{{ notice.title }}</div>
              <div class="notice-time">{{ notice.time }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>帮助中心</span>
            </div>
          </template>
          <div class="help-list">
            <div class="help-item" v-for="(help, index) in helpList" :key="index" @click="showHelp(help)">
              <el-icon><QuestionFilled /></el-icon>
              <span>{{ help.title }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import * as echarts from 'echarts'
import { 
  User, Box, ShoppingCart, Money, 
  Refresh, QuestionFilled, Document, 
  DataAnalysis, List, PieChart 
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 统计数据
const stats = ref({
  userCount: 42,
  warehouseCount: 5,
  orderCount: 136,
  salesAmount: '28,450',
  inventoryCount: 1245,
  warningCount: 23
})

// 物流动态
const logisticsList = ref([
  { time: '10:30', content: '订单 #20230615001 已发货' },
  { time: '09:15', content: '订单 #20230614005 已到达上海分拣中心' },
  { time: '08:45', content: '订单 #20230614002 已签收' },
  { time: '昨天', content: '3个订单已完成出库' }
])

// 待处理任务
const pendingTasks = ref([
  { type: '待审核订单', count: 12, priority: '高' },
  { type: '退货申请', count: 5, priority: '中' },
  { type: '库存预警', count: 8, priority: '高' },
  { type: '供应商付款', count: 3, priority: '低' }
])

// 报表快捷入口
const reportShortcuts = ref([
  { title: '销售报表', icon: 'PieChart', path: '/report/order' },
  { title: '库存报表', icon: 'DataAnalysis', path: '/report/inventory' },
  { title: '运营报表', icon: 'Document', path: '/report/operation' },
  { title: '物流报表', icon: 'List', path: '/report/logistics' }
])

// 系统公告
const notices = ref([
  { title: '系统维护通知：本周凌晨2点进行系统升级', time: '2023-06-15' },
  { title: '新功能上线：仓库可视化功能已开放', time: '2023-06-10' },
  { title: '重要：请及时处理库存预警商品', time: '2023-06-05' }
])

// 帮助中心
const helpList = ref([
  { title: '如何创建新订单？', content: '...' },
  { title: '如何处理退货申请？', content: '...' },
  { title: '如何查看库存报表？', content: '...' },
  { title: '如何设置仓库布局？', content: '...' }
])

// 仓库选择
const selectedWarehouse = ref('1')
const warehouseOptions = ref([
  { value: '1', label: '上海总仓' },
  { value: '2', label: '北京分仓' },
  { value: '3', label: '广州分仓' }
])

// 图表类型
const chartType = ref('week')

// 图表引用
const warehouseChart = ref<HTMLElement>()
const businessChart = ref<HTMLElement>()
const warehouseMap = ref<HTMLElement>()

// 导航方法
const navigateTo = (path: string) => {
  router.push(path)
}

// 处理任务
const handleTask = (task: any) => {
  // 根据任务类型跳转到对应页面
  switch(task.type) {
    case '待审核订单':
      router.push('/order/process')
      break
    case '退货申请':
      router.push('/order/return')
      break
    case '库存预警':
      router.push('/product/inventory')
      break
    // 其他任务类型...
  }
}

// 显示帮助
const showHelp = (help: any) => {
  ElMessageBox.alert(help.content, help.title)
}

// 刷新数据
const refreshData = () => {
  // 这里可以调用API刷新数据
  ElMessage.success('数据已刷新')
}

// 初始化图表
const initCharts = () => {
  // 仓库库存图表
  const warehouseChartInstance = echarts.init(warehouseChart.value)
  warehouseChartInstance.setOption({
    // 仓库库存图表配置
  })

  // 业务指标图表
  const businessChartInstance = echarts.init(businessChart.value)
  businessChartInstance.setOption({
    // 业务指标图表配置
  })

  // 仓库布局可视化
  const warehouseMapInstance = echarts.init(warehouseMap.value)
  warehouseMapInstance.setOption({
    // 仓库布局配置
  })
}

onMounted(() => {
  initCharts()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  
  .mt-20 {
    margin-top: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
  
  .welcome-card {
    margin-bottom: 20px;
    
    .welcome-content {
      padding: 10px 0;
    }
    
    .data-item {
      display: flex;
      align-items: center;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 4px;
      margin-bottom: 10px;
      
      .icon {
        font-size: 48px;
        color: #409EFF;
        margin-right: 20px;
      }
      
      .content {
        .value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          line-height: 1.5;
        }
        
        .label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }
  
  .chart-container {
    width: 100%;
    height: 400px; /* 或根据需求调整 */
  }
  
  .shortcut-list {
    display: flex;
    flex-wrap: wrap;
    
    .shortcut-item {
      width: 25%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 15px 0;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        background-color: #f5f7fa;
      }
      
      .icon {
        font-size: 30px;
        color: #409EFF;
        margin-bottom: 8px;
      }
      
      .label {
        font-size: 14px;
      }
    }
  }
  
  .notice-list {
    .notice-item {
      padding: 12px 0;
      border-bottom: 1px solid #ebeef5;
      
      &:last-child {
        border-bottom: none;
      }
      
      .notice-title {
        font-size: 14px;
        color: #303133;
        margin-bottom: 5px;
      }
      
      .notice-time {
        font-size: 12px;
        color: #909399;
      }
    }
  }
  
  .help-list {
    .help-item {
      padding: 12px 0;
      border-bottom: 1px solid #ebeef5;
      cursor: pointer;
      display: flex;
      align-items: center;
      
      &:last-child {
        border-bottom: none;
      }
      
      .el-icon {
        margin-right: 10px;
        color: #409EFF;
      }
      
      &:hover {
        color: #409EFF;
      }
    }
  }
  
  .warehouse-map {
    .map-container {
      height: 400px;
      width: 100%;
    }
  }
}
</style>