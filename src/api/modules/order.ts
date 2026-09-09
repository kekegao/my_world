import { post } from '@/api/request'

/** 发布订单参数 */
export interface PublishOrderParams {
  /** 货主id */
  shipperUserId?: string
  /** 货主用户名称 */
  shipperUserName?: string
  /** 货主名称 */
  shipperName?: string
  /** 货主手机号 */
  shipperMobile?: string
  /** 承运方id */
  carrierUserId?: string
  /** 承运方用户名称 */
  carrierUserName?: string
  /** 承运方名称 */
  carrierName?: string
  /** 承运方手机号 */
  carrierMobile?: string
  /** 物品类型，例如建材，钢铁，煤炭 */
  goodsType: string
  /** 物品描述 */
  goodsDescription: string
  /** 物品重量 */
  goodsWeight: number
  /** 运费 */
  transportMoney?: number
  /** 发货源省市区-省份 */
  shipperProvince: string
  /** 发货源省市区-城市 */
  shipperCity: string
  /** 发货源省市区-地区 */
  shipperArea: string
  /** 发货源省市区-详细地址 */
  shipperAddress: string
  /** 收货地省市区-省份 */
  carrierProvince: string
  /** 收货地省市区-城市 */
  carrierCity: string
  /** 收货地省市区-地区 */
  carrierArea: string
  /** 收货地省市区-详细地址 */
  carrierAddress: string
}

/** 发布订单 */
export function publishOrder(data: PublishOrderParams) {
  return post('/api/publishOrder/publish', data)
}

/** 已发布订单（货主视角），字段与后端 OrderDto 对齐 */
export interface PublishedOrderItem {
  /** 主键 */
  id?: number
  /** 订单号 */
  orderId: string
  /** 订单状态：1发布-2摘单-3成交-4发货-5确认收货-6回单确认-7结算申请-8结算-9对账-10发票 */
  status: number
  /** 订单状态描述，例如：发布 */
  statusDesc?: string
  /** 货主用户id */
  shipperUserId?: string
  /** 货主用户名称 */
  shipperUserName?: string
  /** 货主名称 */
  shipperName?: string
  /** 货主手机号 */
  shipperMobile?: string
  /** 承运方用户id */
  carrierUserId?: string
  /** 承运方用户名称 */
  carrierUserName?: string
  /** 承运方名称 */
  carrierName?: string
  /** 承运方手机号 */
  carrierMobile?: string
  /** 物品类型，例如建材，钢铁，煤炭 */
  goodsType?: string
  /** 物品描述 */
  goodsDescription?: string
  /** 物品重量（吨） */
  goodsWeight?: number
  /** 运费（元），空表示面议 */
  transportMoney?: number
  /** 发货源省市区-省份 */
  shipperProvince?: string
  /** 发货源省市区-城市 */
  shipperCity?: string
  /** 发货源省市区-地区 */
  shipperArea?: string
  /** 发货源省市区-详细地址 */
  shipperAddress?: string
  /** 收货地省市区-省份 */
  carrierProvince?: string
  /** 收货地省市区-城市 */
  carrierCity?: string
  /** 收货地省市区-地区 */
  carrierArea?: string
  /** 收货地省市区-详细地址 */
  carrierAddress?: string
  /** 删除标记：0正常，1已删除 */
  deleteFlag?: number
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
}

/** 查询我的发布订单列表参数 */
export interface PublishOrderListParams {
  /** 订单状态（选填，单值精确匹配，传 status 时不传 statusList） */
  status?: number
  /** 订单状态列表（选填，IN 查询，用于多状态归并筛选，优先于 status） */
  statusList?: number[]
}

/** 查询我的发布订单列表 */
export function queryPublishOrderList(params: PublishOrderListParams = {}) {
  return post('/api/publishOrder/list', params)
}

/** 承运端货源大厅查询参数 */
export interface SourceOrderQueryParams {
  /** 发货地关键字（选填），模糊匹配发货省/市/区/详细地址 */
  shipperKeyword?: string
  /** 收货地关键字（选填），模糊匹配收货省/市/区/详细地址 */
  carrierKeyword?: string
}

/** 承运端货源大厅列表（可摘货源 / 线路搜索） */
export function querySourceOrderList(params: SourceOrderQueryParams = {}) {
  return post('/api/accept/list', params)
}

/** 承运端「我的运单」查询参数：订单状态列表（IN 查询）等，承运方身份由后端从登录态获取 */
export interface CarrierOrderQueryParams {
  /** 订单状态（选填，单值精确匹配） */
  status?: number
  /** 订单状态列表（选填，IN 查询，优先于 status） */
  statusList?: number[]
}

/** 承运端「我的运单」：实时查询当前承运方所有已摘的运单 */
export function queryCarrierOrders(params: CarrierOrderQueryParams = {}) {
  return post('/api/accept/myOrders', params)
}

/** 摘单（抢单）请求参数 */
export interface AcceptOrderParams {
  /** 运单号 */
  orderId: string
}

/** 承运端摘单（后端负责防并发抢单与幂等） */
export function carrierAcceptOrder(data: AcceptOrderParams) {
  return post('/api/accept/acceptOrder', data)
}

/** 运单操作请求参数（货主成交/取消、承运方发货共用） */
export interface OrderOperateParams {
  /** 运单号 */
  orderId: string
}

/** 承运方确认发货：成交(3) -> 发货(4)，后端校验仅承运方本人可操作 */
export function carrierShipOrder(data: OrderOperateParams) {
  return post('/api/accept/shipOrder', data)
}

/** 货主确认成交：摘单(2) -> 成交(3) */
export function dealPublishOrder(data: OrderOperateParams) {
  return post('/api/publishOrder/dealOrder', data)
}

/** 货主取消承运方摘单：摘单(2) -> 发布(1)，恢复等待摘单 */
export function cancelPublishOrderAccept(data: OrderOperateParams) {
  return post('/api/publishOrder/cancelAccept', data)
}
