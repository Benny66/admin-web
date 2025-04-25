<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="filter-container">
      <el-form :model="queryParams" ref="queryForm" :inline="true">
        <el-form-item label="退货单号" prop="returnNo">
          <el-input v-model="queryParams.returnNo" placeholder="请输入退货单号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="订单编号" prop="orderNo">
          <el-input v-model="queryParams.orderNo" placeholder="请输入订单编号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="queryParams.customerName" placeholder="请输入客户名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="退货状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择退货状态" clearable style="width: 200px">
            <el-option v-for="dict in statusOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间" prop="dateRange">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="table-container">
      <template #header>
        <div class="card-header">
          <span>退货管理</span>
          <div class="right-buttons">
            <el-button type="primary" icon="Plus" @click="handleAdd">新增退货</el-button>
            <el-button type="success" icon="Check" :disabled="multiple" @click="handleBatchApprove">批量审核</el-button>
            <el-button type="danger" icon="Close" :disabled="multiple" @click="handleBatchReject">批量拒绝</el-button>
            <el-button type="primary" icon="Download" @click="handleExport">导出数据</el-button>
          </div>
        </div>
      </template>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="returnList"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="退货单号" prop="returnNo" width="180" />
        <el-table-column label="订单编号" prop="orderNo" width="180" />
        <el-table-column label="客户名称" prop="customerName" min-width="120" show-overflow-tooltip />
        <el-table-column label="退款金额" prop="refundAmount" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.refundAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="退货原因" prop="reason" min-width="150" show-overflow-tooltip />
        <el-table-column label="退货状态" prop="status" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" prop="createTime" width="160" />
        <el-table-column label="操作" width="220" align="center">
          <template #default="scope">
            <el-button type="text" icon="View" @click="handleView(scope.row)">查看</el-button>
            <el-button 
              type="text" 
              icon="Check" 
              @click="handleApprove(scope.row)"
              v-if="scope.row.status === 'pending'"
            >审核通过</el-button>
            <el-button 
              type="text" 
              icon="Close" 
              @click="handleReject(scope.row)"
              v-if="scope.row.status === 'pending'"
            >拒绝</el-button>
            <el-button 
              type="text" 
              icon="Money" 
              @click="handleRefund(scope.row)"
              v-if="scope.row.status === 'approved'"
            >确认退款</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
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
    <!-- 查看退货详情对话框 -->
    <el-dialog title="退货详情" v-model="viewDialog.visible" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="退货单号">{{ returnDetail.returnNo }}</el-descriptions-item>
        <el-descriptions-item label="退货状态">
          <el-tag :type="getStatusType(returnDetail.status)">
            {{ getStatusLabel(returnDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="订单编号">{{ returnDetail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ returnDetail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ returnDetail.phone }}</el-descriptions-item>
        <el-descriptions-item label="退货方式">{{ returnDetail.returnMethod }}</el-descriptions-item>
        <el-descriptions-item label="退货原因" :span="2">{{ returnDetail.reason }}</el-descriptions-item>
        <el-descriptions-item label="问题描述" :span="2">{{ returnDetail.description }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ returnDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="处理时间" v-if="returnDetail.processTime">{{ returnDetail.processTime }}</el-descriptions-item>
        <el-descriptions-item label="退款时间" v-if="returnDetail.refundTime">{{ returnDetail.refundTime }}</el-descriptions-item>
        <el-descriptions-item label="处理备注" :span="2" v-if="returnDetail.processRemark">{{ returnDetail.processRemark }}</el-descriptions-item>
      </el-descriptions>

      <div class="return-products">
        <div class="title">退货商品</div>
        <el-table :data="returnDetail.products" border>
          <el-table-column label="商品编码" prop="code" width="120" />
          <el-table-column label="商品名称" prop="name" min-width="150" show-overflow-tooltip />
          <el-table-column label="规格" prop="specification" width="120" />
          <el-table-column label="单价" prop="price" width="100" align="right">
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="退货数量" prop="quantity" width="80" align="center" />
          <el-table-column label="小计" width="120" align="right">
            <template #default="scope">
              ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="return-images" v-if="returnDetail.images && returnDetail.images.length > 0">
        <div class="title">问题图片</div>
        <div class="image-list">
          <el-image
            v-for="(image, index) in returnDetail.images"
            :key="index"
            :src="image"
            :preview-src-list="returnDetail.images"
            fit="cover"
            class="return-image"
          />
        </div>
      </div>

      <div class="return-summary">
        <div class="summary-item">
          <span>商品总额：</span>
          <span>¥{{ returnDetail.productAmount?.toFixed(2) }}</span>
        </div>
        <div class="summary-item">
          <span>运费：</span>
          <span>¥{{ returnDetail.shippingFee?.toFixed(2) }}</span>
        </div>
        <div class="summary-item total">
          <span>退款总额：</span>
          <span>¥{{ returnDetail.refundAmount?.toFixed(2) }}</span>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="viewDialog.visible = false">关闭</el-button>
          <el-button 
            type="success" 
            @click="handleApprove(returnDetail)"
            v-if="returnDetail.status === 'pending'"
          >审核通过</el-button>
          <el-button 
            type="danger" 
            @click="handleReject(returnDetail)"
            v-if="returnDetail.status === 'pending'"
          >拒绝</el-button>
          <el-button 
            type="primary" 
            @click="handleRefund(returnDetail)"
            v-if="returnDetail.status === 'approved'"
          >确认退款</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新增退货对话框 -->
    <el-dialog :title="editDialog.title" v-model="editDialog.visible" width="800px" append-to-body>
      <el-form ref="returnFormRef" :model="returnForm" :rules="rules" label-width="100px">
        <el-form-item label="订单编号" prop="orderNo">
          <el-input v-model="returnForm.orderNo" placeholder="请输入订单编号" style="width: 300px">
            <template #append>
              <el-button @click="searchOrder">查询</el-button>
            </template>
          </el-input>
        </el-form-item>

        <div v-if="orderInfo.orderNo" class="order-info">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="订单编号">{{ orderInfo.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ orderInfo.customerName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ orderInfo.phone }}</el-descriptions-item>
            <el-descriptions-item label="订单金额">¥{{ orderInfo.totalAmount?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ orderInfo.createTime }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag type="success">{{ orderInfo.status === 'shipped' ? '已发货' : '已完成' }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="order-products">
            <div class="title">订单商品</div>
            <el-table :data="orderInfo.products" border @selection-change="handleProductSelectionChange">
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="商品编码" prop="code" width="120" />
              <el-table-column label="商品名称" prop="name" min-width="150" show-overflow-tooltip />
              <el-table-column label="规格" prop="specification" width="120" />
              <el-table-column label="单价" prop="price" width="100" align="right">
                <template #default="scope">
                  ¥{{ scope.row.price.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="数量" prop="quantity" width="80" align="center" />
              <el-table-column label="退货数量" width="120" align="center">
                <template #default="scope">
                  <el-input-number
                    v-model="scope.row.returnQuantity"
                    :min="1"
                    :max="scope.row.quantity"
                    size="small"
                    @change="calculateRefundAmount"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <el-form-item label="退货方式" prop="returnMethod">
          <el-radio-group v-model="returnForm.returnMethod">
            <el-radio label="退货退款">退货退款</el-radio>
            <el-radio label="仅退款">仅退款</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="退货原因" prop="reason">
          <el-select v-model="returnForm.reason" placeholder="请选择退货原因" style="width: 100%">
            <el-option label="商品质量问题" value="商品质量问题" />
            <el-option label="商品损坏" value="商品损坏" />
            <el-option label="商品与描述不符" value="商品与描述不符" />
            <el-option label="发错货/漏发" value="发错货/漏发" />
            <el-option label="不想要了" value="不想要了" />
            <el-option label="其他原因" value="其他原因" />
          </el-select>
        </el-form-item>

        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="returnForm.description"
            type="textarea"
            placeholder="请详细描述退货原因"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="问题图片">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="5"
            :file-list="fileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="el-upload__tip">最多上传5张图片，每张不超过2MB</div>
        </el-form-item>

        <el-form-item label="退款金额" prop="refundAmount">
          <el-input-number
            v-model="returnForm.refundAmount"
            :min="0"
            :precision="2"
            :step="10"
            style="width: 200px"
          />
          <span class="refund-tip">最大可退: ¥{{ maxRefundAmount.toFixed(2) }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitReturnForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog title="审核退货申请" v-model="approveDialog.visible" width="500px" append-to-body>
      <el-form ref="approveFormRef" :model="approveForm" :rules="approveRules" label-width="100px">
        <el-form-item label="退货单号">
          <span>{{ approveForm.returnNo }}</span>
        </el-form-item>
        <el-form-item label="客户名称">
          <span>{{ approveForm.customerName }}</span>
        </el-form-item>
        <el-form-item label="退款金额">
          <span>¥{{ approveForm.refundAmount?.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="处理备注" prop="remark">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            placeholder="请输入处理备注"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="approveDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitApproveForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 拒绝对话框 -->
    <el-dialog title="拒绝退货申请" v-model="rejectDialog.visible" width="500px" append-to-body>
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-width="100px">
        <el-form-item label="退货单号">
          <span>{{ rejectForm.returnNo }}</span>
        </el-form-item>
        <el-form-item label="客户名称">
          <span>{{ rejectForm.customerName }}</span>
        </el-form-item>
        <el-form-item label="拒绝原因" prop="reason">
          <el-select v-model="rejectForm.reason" placeholder="请选择拒绝原因" style="width: 100%">
            <el-option label="超过退货期限" value="超过退货期限" />
            <el-option label="商品已使用/损坏" value="商品已使用/损坏" />
            <el-option label="不符合退货条件" value="不符合退货条件" />
            <el-option label="信息不完整" value="信息不完整" />
            <el-option label="其他原因" value="其他原因" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明" prop="remark">
          <el-input
            v-model="rejectForm.remark"
            type="textarea"
            placeholder="请输入详细说明"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="rejectDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitRejectForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 退款对话框 -->
    <el-dialog title="确认退款" v-model="refundDialog.visible" width="500px" append-to-body>
      <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="100px">
        <el-form-item label="退货单号">
          <span>{{ refundForm.returnNo }}</span>
        </el-form-item>
        <el-form-item label="客户名称">
          <span>{{ refundForm.customerName }}</span>
        </el-form-item>
        <el-form-item label="退款金额">
          <span>¥{{ refundForm.refundAmount?.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="退款方式" prop="refundMethod">
          <el-select v-model="refundForm.refundMethod" placeholder="请选择退款方式" style="width: 100%">
            <el-option label="原路退回" value="原路退回" />
            <el-option label="退到余额" value="退到余额" />
            <el-option label="手动处理" value="手动处理" />
          </el-select>
        </el-form-item>
        <el-form-item label="退款备注" prop="remark">
          <el-input
            v-model="refundForm.remark"
            type="textarea"
            placeholder="请输入退款备注"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="refundDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitRefundForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>



<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, View, Check, Close, Plus, Download, Refresh, Money } from '@element-plus/icons-vue';

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  returnNo: '',
  orderNo: '',
  customerName: '',
  status: '',
  dateRange: []
});

// 退货状态选项
const statusOptions = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已审核' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'refunded', label: '已退款' }
];

// 退货列表数据
const returnList = ref([]);
const total = ref(0);
const loading = ref(false);
const selectedRows = ref([]);
const multiple = computed(() => selectedRows.value.length === 0);

// 查看对话框
const viewDialog = reactive({
  visible: false
});

// 退货详情
const returnDetail = reactive({
  id: '',
  returnNo: '',
  orderNo: '',
  customerName: '',
  phone: '',
  status: '',
  returnMethod: '',
  reason: '',
  description: '',
  createTime: '',
  processTime: '',
  refundTime: '',
  processRemark: '',
  productAmount: 0,
  shippingFee: 0,
  refundAmount: 0,
  products: [],
  images: []
});

// 初始化
onMounted(() => {
  getReturnList();
});

// 获取退货列表
const getReturnList = () => {
  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    returnList.value = [
      {
        id: '1',
        returnNo: 'TH20230510001',
        orderNo: 'DD20230501001',
        customerName: '张三',
        phone: '13800138001',
        status: 'refunded',
        returnMethod: '退货退款',
        reason: '商品质量问题',
        description: '收到的手机有划痕，屏幕有一条明显的划痕',
        createTime: '2023-05-10 09:30:00',
        processTime: '2023-05-10 14:20:00',
        refundTime: '2023-05-11 10:15:00',
        processRemark: '确认商品有划痕，同意退款',
        productAmount: 5000,
        shippingFee: 10,
        refundAmount: 5010,
        products: [
          {
            code: 'P0001',
            name: '苹果手机',
            specification: '128G',
            price: 5000,
            quantity: 1
          }
        ],
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ]
      },
      {
        id: '2',
        returnNo: 'TH20230512001',
        orderNo: 'DD20230502001',
        customerName: '李四',
        phone: '13900139001',
        status: 'approved',
        returnMethod: '退货退款',
        reason: '商品与描述不符',
        description: '平板电脑颜色与网站展示不一致，我购买的是蓝色，收到的是黑色',
        createTime: '2023-05-12 11:20:00',
        processTime: '2023-05-12 16:30:00',
        processRemark: '确认发错颜色，同意退货退款',
        productAmount: 3000,
        shippingFee: 0,
        refundAmount: 3000,
        products: [
          {
            code: 'P0002',
            name: '华为平板',
            specification: '10.8英寸',
            price: 3000,
            quantity: 1
          }
        ],
        images: [
          'https://example.com/image3.jpg'
        ]
      },
      {
        id: '3',
        returnNo: 'TH20230515001',
        orderNo: 'DD20230507001',
        customerName: '周九',
        phone: '13300133001',
        status: 'pending',
        returnMethod: '仅退款',
        reason: '不想要了',
        description: '买多了，不需要这么多',
        createTime: '2023-05-15 14:50:00',
        productAmount: 400,
        shippingFee: 0,
        refundAmount: 400,
        products: [
          {
            code: 'P0003',
            name: '小米手环',
            specification: '标准版',
            price: 200,
            quantity: 2
          }
        ],
        images: []
      }
    ];
    total.value = 3;
    loading.value = false;
  }, 500);
};
// 获取状态标签
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已审核',
    rejected: '已拒绝',
    refunded: '已退款'
  };
  return statusMap[status] || status;
};

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    refunded: 'info'
  };
  return statusMap[status] || '';
};

// 查询操作
const handleQuery = () => {
  queryParams.pageNum = 1;
  getReturnList();
};

// 重置查询
const resetQuery = () => {
  queryParams.returnNo = '';
  queryParams.orderNo = '';
  queryParams.customerName = '';
  queryParams.status = '';
  queryParams.dateRange = [];
  handleQuery();
};

// 分页操作
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  getReturnList();
};

const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val;
  getReturnList();
};

// 多选框选中数据
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection;
};

// 查看退货详情
const handleView = (row: any) => {
  // 复制数据到详情对象
  Object.assign(returnDetail, row);
  viewDialog.visible = true;
};

// 新增退货
const editDialog = reactive({
  visible: false,
  title: '新增退货申请'
});

// 新增表单对象
const returnFormRef = ref();
const returnForm = reactive({
  orderNo: '',
  returnMethod: '退货退款',
  reason: '',
  description: '',
  refundAmount: 0
});

// 订单信息
const orderInfo = reactive({
  orderNo: '',
  customerName: '',
  phone: '',
  totalAmount: 0,
  status: '',
  createTime: '',
  products: []
});

// 文件列表
const fileList = ref([]);
const maxRefundAmount = ref(0);

// 表单校验规则
const rules = {
  orderNo: [
    { required: true, message: '请输入订单编号', trigger: 'blur' }
  ],
  returnMethod: [
    { required: true, message: '请选择退货方式', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请选择退货原因', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入问题描述', trigger: 'blur' }
  ],
  refundAmount: [
    { required: true, message: '请输入退款金额', trigger: 'blur' }
  ]
};

// 新增退货
const handleAdd = () => {
  editDialog.title = '新增退货申请';
  editDialog.visible = true;
  
  // 重置表单
  returnForm.orderNo = '';
  returnForm.returnMethod = '退货退款';
  returnForm.reason = '';
  returnForm.description = '';
  returnForm.refundAmount = 0;
  
  // 清空订单信息
  Object.assign(orderInfo, {
    orderNo: '',
    customerName: '',
    phone: '',
    totalAmount: 0,
    status: '',
    createTime: '',
    products: []
  });
  
  // 清空文件列表
  fileList.value = [];
  maxRefundAmount.value = 0;
};

// 查询订单
const searchOrder = () => {
  if (!returnForm.orderNo) {
    ElMessage.warning('请输入订单编号');
    return;
  }
  
  // 模拟API调用
  setTimeout(() => {
    // 模拟订单数据
    Object.assign(orderInfo, {
      orderNo: returnForm.orderNo,
      customerName: '测试客户',
      phone: '13800138000',
      totalAmount: 5000,
      status: 'completed',
      createTime: '2023-05-01 12:00:00',
      products: [
        {
          id: '1',
          code: 'P0001',
          name: '苹果手机',
          specification: '128G',
          price: 5000,
          quantity: 1,
          returnQuantity: 0
        }
      ]
    });
    
    // 计算最大可退金额
    maxRefundAmount.value = orderInfo.totalAmount;
  }, 500);
};

// 选择退货商品
const handleProductSelectionChange = (selection: any[]) => {
  // 设置选中商品的退货数量为1
  selection.forEach(item => {
    if (!item.returnQuantity) {
      item.returnQuantity = 1;
    }
  });
  
  // 未选中的商品退货数量设为0
  orderInfo.products.forEach((item: any) => {
    if (!selection.find(s => s.id === item.id)) {
      item.returnQuantity = 0;
    }
  });
  
  calculateRefundAmount();
};

// 计算退款金额
const calculateRefundAmount = () => {
  let amount = 0;
  orderInfo.products.forEach((item: any) => {
    if (item.returnQuantity > 0) {
      amount += item.price * item.returnQuantity;
    }
  });
  returnForm.refundAmount = amount;
};

// 文件上传相关
const handleFileChange = (file: any) => {
  // 处理文件上传
};

const handleFileRemove = (file: any) => {
  // 处理文件移除
};

// 提交退货表单
const submitReturnForm = () => {
  returnFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success('退货申请提交成功');
        editDialog.visible = false;
        getReturnList();
      }, 500);
    }
  });
};

// 审核对话框
const approveDialog = reactive({
  visible: false
});

// 审核表单
const approveFormRef = ref();
const approveForm = reactive({
  id: '',
  returnNo: '',
  customerName: '',
  refundAmount: 0,
  remark: ''
});

// 审核表单校验规则
const approveRules = {
  remark: [
    { required: true, message: '请输入处理备注', trigger: 'blur' }
  ]
};

// 审核通过
const handleApprove = (row: any) => {
  approveForm.id = row.id;
  approveForm.returnNo = row.returnNo;
  approveForm.customerName = row.customerName;
  approveForm.refundAmount = row.refundAmount;
  approveForm.remark = '';
  approveDialog.visible = true;
};

// 提交审核表单
const submitApproveForm = () => {
  approveFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success('审核通过成功');
        approveDialog.visible = false;
        getReturnList();
      }, 500);
    }
  });
};

// 批量审核
const handleBatchApprove = () => {
  const ids = selectedRows.value.map(item => item.id).join(',');
  ElMessageBox.confirm('确认要批量审核通过选中的退货申请吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      ElMessage.success('批量审核通过成功');
      getReturnList();
    }, 500);
  }).catch(() => {});
};

// 拒绝对话框
const rejectDialog = reactive({
  visible: false
});

// 拒绝表单
const rejectFormRef = ref();
const rejectForm = reactive({
  id: '',
  returnNo: '',
  customerName: '',
  reason: '',
  remark: ''
});

// 拒绝表单校验规则
const rejectRules = {
  reason: [
    { required: true, message: '请选择拒绝原因', trigger: 'change' }
  ],
  remark: [
    { required: true, message: '请输入详细说明', trigger: 'blur' }
  ]
};

// 拒绝退货
const handleReject = (row: any) => {
  rejectForm.id = row.id;
  rejectForm.returnNo = row.returnNo;
  rejectForm.customerName = row.customerName;
  rejectForm.reason = '';
  rejectForm.remark = '';
  rejectDialog.visible = true;
};

// 提交拒绝表单
const submitRejectForm = () => {
  rejectFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success('退货申请已拒绝');
        rejectDialog.visible = false;
        getReturnList();
      }, 500);
    }
  });
};

// 批量拒绝
const handleBatchReject = () => {
  const ids = selectedRows.value.map(item => item.id).join(',');
  ElMessageBox.confirm('确认要批量拒绝选中的退货申请吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟API调用
    setTimeout(() => {
      ElMessage.success('批量拒绝成功');
      getReturnList();
    }, 500);
  }).catch(() => {});
};

// 退款对话框
const refundDialog = reactive({
  visible: false
});

// 退款表单
const refundFormRef = ref();
const refundForm = reactive({
  id: '',
  returnNo: '',
  customerName: '',
  refundAmount: 0,
  refundMethod: '原路退回',
  remark: ''
});

// 退款表单校验规则
const refundRules = {
  refundMethod: [
    { required: true, message: '请选择退款方式', trigger: 'change' }
  ]
};

// 确认退款
const handleRefund = (row: any) => {
  refundForm.id = row.id;
  refundForm.returnNo = row.returnNo;
  refundForm.customerName = row.customerName;
  refundForm.refundAmount = row.refundAmount;
  refundForm.refundMethod = '原路退回';
  refundForm.remark = '';
  refundDialog.visible = true;
};

// 提交退款表单
const submitRefundForm = () => {
  refundFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success('退款操作成功');
        refundDialog.visible = false;
        getReturnList();
      }, 500);
    }
  });
};

// 导出数据
const handleExport = () => {
  ElMessage.success('退货数据导出成功');
};
</script>

<style scoped>
.filter-container {
  margin-bottom: 20px;
}

.table-container {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-buttons {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.return-products,
.return-images {
  margin-top: 20px;
}

.title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
  color: #303133;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.return-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.return-summary {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.summary-item {
  margin-bottom: 5px;
  font-size: 14px;
}

.summary-item.total {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.order-info {
  margin-top: 20px;
  margin-bottom: 20px;
}

.order-products {
  margin-top: 15px;
}

.refund-tip {
  margin-left: 10px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>