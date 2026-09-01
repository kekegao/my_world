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
