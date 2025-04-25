<template>
    <div class="app-container">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card class="overview-card">
            <template #header>
              <div class="card-header">
                <span>仓库概览</span>
                <div class="header-buttons">
                  <el-button type="primary" plain size="small" @click="exportWarehouseData">
                    <el-icon><Download /></el-icon>导出数据
                  </el-button>
                  <el-button type="primary" plain size="small" @click="printReport">
                    <el-icon><Printer /></el-icon>打印报表
                  </el-button>
                  <el-button type="primary" link @click="refreshData">
                    <el-icon><RefreshRight /></el-icon>刷新数据
                  </el-button>
                </div>
              </div>
            </template>
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="data-item">
                  <div class="data-icon blue">
                    <el-icon><Goods /></el-icon>
                  </div>
                  <div class="data-info">
                    <div class="data-title">仓库总数</div>
                    <div class="data-value">{{ overviewData.warehouseCount }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="data-item">
                  <div class="data-icon green">
                    <el-icon><Grid /></el-icon>
                  </div>
                  <div class="data-info">
                    <div class="data-title">库区总数</div>
                    <div class="data-value">{{ overviewData.areaCount }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="data-item">
                  <div class="data-icon orange">
                    <el-icon><Menu /></el-icon>
                  </div>
                  <div class="data-info">
                    <div class="data-title">货架总数</div>
                    <div class="data-value">{{ overviewData.shelfCount }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="data-item">
                  <div class="data-icon purple">
                    <el-icon><Box /></el-icon>
                  </div>
                  <div class="data-info">
                    <div class="data-title">商品总数</div>
                    <div class="data-value">{{ overviewData.productCount }}</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
  
      <el-row :gutter="20" class="mt-20">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>仓库使用率</span>
              </div>
            </template>
            <div class="chart-container" ref="warehouseChartRef"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>库区类型分布</span>
              </div>
            </template>
            <div class="chart-container" ref="areaTypeChartRef"></div>
          </el-card>
        </el-col>
      </el-row>
  
      <el-row :gutter="20" class="mt-20">
        <el-col :span="24">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>近30天入库/出库趋势</span>
              </div>
            </template>
            <div class="chart-container" ref="trendChartRef"></div>
          </el-card>
        </el-col>
      </el-row>
  
      <el-row :gutter="20" class="mt-20">
        <el-col :span="12">
          <el-card class="table-card">
            <template #header>
              <div class="card-header">
                <span>库存预警</span>
                <el-button type="primary" link @click="handleViewMore('warning')">查看更多</el-button>
              </div>
            </template>
            <el-table :data="warningList" style="width: 100%" border>
              <el-table-column prop="code" label="商品编码" width="120" />
              <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
              <el-table-column prop="warehouseName" label="所属仓库" width="120" />
              <el-table-column prop="quantity" label="当前库存" width="100" align="center" />
              <el-table-column prop="warningValue" label="预警值" width="100" align="center" />
              <el-table-column prop="warningType" label="预警类型" width="100" align="center">
                <template #default="scope">
                  <el-tag :type="scope.row.warningType === 'low' ? 'danger' : 'warning'">
                    {{ scope.row.warningType === 'low' ? '库存不足' : '库存过高' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="table-card">
            <template #header>
              <div class="card-header">
                <span>近期操作记录</span>
                <el-button type="primary" link @click="handleViewMore('log')">查看更多</el-button>
              </div>
            </template>
            <el-table :data="logList" style="width: 100%" border>
              <el-table-column prop="time" label="操作时间" width="160" />
              <el-table-column prop="type" label="操作类型" width="100">
                <template #default="scope">
                  <el-tag :type="getLogTypeTag(scope.row.type)">
                    {{ scope.row.type }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="user" label="操作人" width="100" />
              <el-table-column prop="content" label="操作内容" min-width="200" show-overflow-tooltip />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage } from 'element-plus';
  import * as echarts from 'echarts';
  import { Goods, Grid, Menu, Box, Download, Printer, RefreshRight } from '@element-plus/icons-vue';
  
  const router = useRouter();
  
  // 图表实例
  let warehouseChart: echarts.ECharts | null = null;
  let areaTypeChart: echarts.ECharts | null = null;
  let trendChart: echarts.ECharts | null = null;
  
  // 图表DOM引用
  const warehouseChartRef = ref<HTMLElement | null>(null);
  const areaTypeChartRef = ref<HTMLElement | null>(null);
  const trendChartRef = ref<HTMLElement | null>(null);
  
  // 概览数据
  const overviewData = reactive({
    warehouseCount: 5,
    areaCount: 18,
    shelfCount: 126,
    productCount: 1568
  });
  
  // 库存预警列表
  const warningList = ref([
    {
      code: 'P0001',
      name: '苹果手机',
      warehouseName: '北京仓库',
      quantity: 5,
      warningValue: 10,
      warningType: 'low'
    },
    {
      code: 'P0002',
      name: '华为平板',
      warehouseName: '上海仓库',
      quantity: 8,
      warningValue: 15,
      warningType: 'low'
    },
    {
      code: 'P0003',
      name: '小米手环',
      warehouseName: '广州仓库',
      quantity: 3,
      warningValue: 20,
      warningType: 'low'
    },
    {
      code: 'P0004',
      name: '联想笔记本',
      warehouseName: '成都仓库',
      quantity: 120,
      warningValue: 100,
      warningType: 'high'
    },
    {
      code: 'P0005',
      name: '戴尔显示器',
      warehouseName: '深圳仓库',
      quantity: 85,
      warningValue: 50,
      warningType: 'high'
    }
  ]);
  
  // 操作日志列表
  const logList = ref([
    {
      time: '2023-05-10 14:30:25',
      type: '入库',
      user: '张三',
      content: '完成入库单RK20230510001的入库操作'
    },
    {
      time: '2023-05-10 11:20:15',
      type: '出库',
      user: '李四',
      content: '完成出库单CK20230510002的出库操作'
    },
    {
      time: '2023-05-09 16:45:30',
      type: '调拨',
      user: '王五',
      content: '完成从北京仓库到上海仓库的调拨单DB20230509001'
    },
    {
      time: '2023-05-09 09:15:10',
      type: '盘点',
      user: '赵六',
      content: '完成北京仓库的月度盘点PD20230509001'
    },
    {
      time: '2023-05-08 17:30:45',
      type: '退货',
      user: '张三',
      content: '处理客户退货单TH20230508001'
    }
  ]);
  
  // 初始化
  onMounted(() => {
    initData();
    
    // 定时刷新数据
    const timer = setInterval(() => {
      refreshData();
    }, 300000); // 每5分钟刷新一次
    
    // 组件卸载时清除定时器
    onBeforeUnmount(() => {
      clearInterval(timer);
      
      // 销毁图表实例
      warehouseChart?.dispose();
      areaTypeChart?.dispose();
      trendChart?.dispose();
    });
  });
  
  // 初始化数据
  const initData = () => {
    nextTick(() => {
      initWarehouseChart();
      initAreaTypeChart();
      initTrendChart();
    });
  };
  
  // 初始化仓库使用率图表
  const initWarehouseChart = () => {
    if (!warehouseChartRef.value) return;
    
    // 销毁旧实例
    if (warehouseChart) {
      warehouseChart.dispose();
    }
    
    // 创建新实例
    warehouseChart = echarts.init(warehouseChartRef.value);
    
    // 模拟数据
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}% ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: ['北京仓库', '上海仓库', '广州仓库', '成都仓库', '深圳仓库']
      },
      series: [
        {
          name: '使用率',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: 85, name: '北京仓库' },
            { value: 72, name: '上海仓库' },
            { value: 65, name: '广州仓库' },
            { value: 48, name: '成都仓库' },
            { value: 38, name: '深圳仓库' }
          ]
        }
      ]
    };
    
    warehouseChart.setOption(option);
    
    // 响应窗口大小变化
    window.addEventListener('resize', () => {
      warehouseChart?.resize();
    });
  };
  
  // 初始化库区类型分布图表
  const initAreaTypeChart = () => {
    if (!areaTypeChartRef.value) return;
    
    // 销毁旧实例
    if (areaTypeChart) {
      areaTypeChart.dispose();
    }
    
    // 创建新实例
    areaTypeChart = echarts.init(areaTypeChartRef.value);
    
    // 模拟数据
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['常温区', '冷藏区', '冷冻区', '危险品区', '贵重品区']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: ['北京仓库', '上海仓库', '广州仓库', '成都仓库', '深圳仓库']
      },
      series: [
        {
          name: '常温区',
          type: 'bar',
          stack: 'total',
          label: {
            show: true
          },
          emphasis: {
            focus: 'series'
          },
          data: [5, 4, 6, 3, 4]
        },
        {
          name: '冷藏区',
          type: 'bar',
          stack: 'total',
          label: {
            show: true
          },
          emphasis: {
            focus: 'series'
          },
          data: [2, 3, 2, 1, 2]
        },
        {
          name: '冷冻区',
          type: 'bar',
          stack: 'total',
          label: {
            show: true
          },
          emphasis: {
            focus: 'series'
          },
          data: [1, 2, 1, 1, 1]
        },
        {
          name: '危险品区',
          type: 'bar',
          stack: 'total',
          label: {
            show: true
          },
          emphasis: {
            focus: 'series'
          },
          data: [1, 1, 1, 0, 1]
        },
        {
          name: '贵重品区',
          type: 'bar',
          stack: 'total',
          label: {
            show: true
          },
          emphasis: {
            focus: 'series'
          },
          data: [1, 1, 0, 1, 1]
        }
      ]
    };
    
    areaTypeChart.setOption(option);
    
    // 响应窗口大小变化
    window.addEventListener('resize', () => {
      areaTypeChart?.resize();
    });
  };
  
  // 初始化入库/出库趋势图表
  const initTrendChart = () => {
    if (!trendChartRef.value) return;
    
    // 销毁旧实例
    if (trendChart) {
      trendChart.dispose();
    }
    
    // 创建新实例
    trendChart = echarts.init(trendChartRef.value);
    
    // 生成日期数据
    const dates = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      dates.push(`${month}/${day}`);
    }
    
    // 模拟数据
    const inData = [];
    const outData = [];
    for (let i = 0; i < 30; i++) {
      inData.push(Math.floor(Math.random() * 50) + 10);
      outData.push(Math.floor(Math.random() * 40) + 5);
    }
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        data: ['入库数量', '出库数量']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: dates
        }
      ],
      yAxis: [
        {
          type: 'value'
        }
      ],
      series: [
        {
          name: '入库数量',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: inData
        },
        {
          name: '出库数量',
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: outData
        }
      ]
    };
    
    trendChart.setOption(option);
    
    // 响应窗口大小变化
    window.addEventListener('resize', () => {
      trendChart?.resize();
    });
  };
  
  // 刷新数据
  const refreshData = () => {
    // 模拟获取最新统计数据
    overviewData.warehouseCount = 5;
    overviewData.areaCount = Math.floor(Math.random() * 5) + 15;
    overviewData.shelfCount = Math.floor(Math.random() * 20) + 120;
    overviewData.productCount = Math.floor(Math.random() * 200) + 1500;
    
    // 刷新图表
    nextTick(() => {
      initWarehouseChart();
      initAreaTypeChart();
      initTrendChart();
    });
    
    // 刷新预警和操作记录
    updateWarningList();
    updateLogList();
    
    ElMessage.success('数据已刷新');
  };
  
  // 更新预警列表
  const updateWarningList = () => {
    // 模拟API调用更新预警商品
    warningList.value.forEach(item => {
      // 随机更新库存数量
      item.quantity = Math.floor(Math.random() * 20) + (item.warningType === 'low' ? 1 : 70);
      // 更新预警类型
      item.warningType = item.quantity < item.warningValue ? 'low' : 'high';
    });
  };
  
  // 更新操作日志
  const updateLogList = () => {
    // 获取当前日期
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    
    // 模拟新的操作记录
    const operationTypes = ['入库', '出库', '调拨', '盘点', '退货'];
    const users = ['张三', '李四', '王五', '赵六'];
    const randomType = operationTypes[Math.floor(Math.random() * operationTypes.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    
    let content = '';
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    switch (randomType) {
      case '入库':
        content = `完成入库单RK${year}${month}${day}${random}的入库操作`;
        break;
      case '出库':
        content = `完成出库单CK${year}${month}${day}${random}的出库操作`;
        break;
      case '调拨':
        content = `完成从北京仓库到上海仓库的调拨单DB${year}${month}${day}${random}`;
        break;
      case '盘点':
        content = `完成北京仓库的月度盘点PD${year}${month}${day}${random}`;
        break;
      case '退货':
        content = `处理客户退货单TH${year}${month}${day}${random}`;
        break;
    }
    
    // 添加新记录到列表开头
    logList.value.unshift({
      time: `${dateStr} ${timeStr}`,
      type: randomType,
      user: randomUser,
      content: content
    });
    
    // 保持列表长度为5
    if (logList.value.length > 5) {
      logList.value.pop();
    }
  };
  
  // 获取日志类型标签样式
  const getLogTypeTag = (type: string) => {
    const typeMap: Record<string, string> = {
      '入库': 'success',
      '出库': 'info',
      '调拨': 'warning',
      '盘点': 'primary',
      '退货': 'danger'
    };
    return typeMap[type] || '';
  };
  
  // 查看更多
  const handleViewMore = (type: string) => {
    if (type === 'warning') {
      router.push('/warehouse/inventory');
    } else if (type === 'log') {
      router.push('/system/operlog');
    }
  };
  
  // 导出仓库数据
  const exportWarehouseData = () => {
    ElMessage.success('仓库数据导出成功');
  };
  
  // 打印报表
  const printReport = () => {
    window.print();
  };
  </script>
  
  <style lang="scss" scoped>
  .app-container {
    padding: 20px;
  }
  
  .mt-20 {
    margin-top: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-buttons {
      display: flex;
      gap: 10px;
    }
  }
  
  .overview-card {
    margin-bottom: 20px;
  }
  
  .data-item {
    display: flex;
    align-items: center;
    padding: 20px;
    border-radius: 4px;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    
    .data-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 15px;
      
      .el-icon {
        font-size: 30px;
        color: #fff;
      }
      
      &.blue {
        background-color: #409EFF;
      }
      
      &.green {
        background-color: #67C23A;
      }
      
      &.orange {
        background-color: #E6A23C;
      }
      
      &.purple {
        background-color: #909399;
      }
    }
    
    .data-info {
      flex: 1;
      
      .data-title {
        font-size: 14px;
        color: #606266;
        margin-bottom: 5px;
      }
      
      .data-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
      }
    }
  }
  
  .chart-card, .table-card {
    height: 100%;
    
    .chart-container {
      height: 300px;
    }
  }
  
  @media print {
    .app-container {
      padding: 0;
    }
    
    .el-button {
      display: none;
    }
    
    .chart-container {
      height: 200px !important;
    }
  }
  </style>