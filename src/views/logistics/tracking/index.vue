<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物流跟踪</span>
          <div class="header-buttons">
            <el-button type="primary" @click="handleBatchTrack">
              <el-icon><Search /></el-icon>批量查询
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="queryParams" ref="queryForm" inline>
        <el-form-item label="物流单号" prop="trackingNo">
          <el-input v-model="queryParams.trackingNo" placeholder="请输入物流单号" clearable />
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

      <el-timeline v-if="trackingInfo.length > 0">
        <el-timeline-item
          v-for="(item, index) in trackingInfo"
          :key="index"
          :timestamp="item.time"
          :color="getStatusColor(item.status)"
          placement="top"
        >
          <el-card>
            <h4>{{ item.status }}</h4>
            <p>{{ item.location }}</p>
            <p v-if="item.remark">{{ item.remark }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-else description="暂无物流信息" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'

// 查询参数
const queryParams = reactive({
  trackingNo: '',
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

// 物流跟踪信息
const trackingInfo = ref([
  {
    time: '2023-05-01 10:30:00',
    status: '已签收',
    location: '北京市朝阳区',
    remark: '本人签收'
  },
  {
    time: '2023-05-01 08:15:00',
    status: '派送中',
    location: '北京市朝阳区',
    remark: '快递员：张三 电话：138****1234'
  },
  {
    time: '2023-04-30 20:45:00',
    status: '已到达',
    location: '北京转运中心'
  },
  {
    time: '2023-04-30 15:30:00',
    status: '运输中',
    location: '上海转运中心'
  },
  {
    time: '2023-04-30 10:00:00',
    status: '已揽收',
    location: '上海市浦东新区'
  }
])

// 获取状态颜色
const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    '已揽收': 'blue',
    '运输中': 'green',
    '已到达': 'purple',
    '派送中': 'orange',
    '已签收': 'red'
  }
  return statusMap[status] || ''
}

// 查询操作
const handleQuery = () => {
  // TODO: 实现查询逻辑
  console.log('查询参数:', queryParams)
}

// 重置查询
const resetQuery = () => {
  queryForm.value?.resetFields()
}

// 批量查询
const handleBatchTrack = () => {
  // TODO: 实现批量查询逻辑
  console.log('批量查询')
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

.el-timeline {
  margin-top: 20px;
}
</style>