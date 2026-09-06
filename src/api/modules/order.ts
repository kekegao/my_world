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
