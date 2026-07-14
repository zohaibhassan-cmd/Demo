import type { Order } from '../data/store.js'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function toOrderRow(order: Order) {
  return {
    id: order.id,
    orderDate: order.orderDate,
    orderNumber: order.orderNumber,
    nickname: order.nickname,
    clin: order.clin,
    totalItems: String(order.totalItems),
    totalPopCost: formatCurrency(order.totalPopCost),
    orderedBy: order.orderedBy,
  }
}

export function toAdminOrderRow(order: Order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderDate: order.orderDate,
    clin: order.clin,
    totalPopCost: formatCurrency(order.totalPopCost),
    earliestRequestDate: order.earliestRequestDate,
    toVendorDate: order.toVendorDate,
    orderedBy: order.orderedBy,
  }
}

export type OrderQuery = {
  bureau?: string
  clin?: string
  ru1?: string
  ru2?: string
  contractNumber?: string
  pop?: string
  search?: string
}

export function matchesFilters(order: Order, query: OrderQuery): boolean {
  if (query.bureau && query.bureau !== 'All' && order.bureau !== query.bureau) {
    return false
  }
  if (query.clin && query.clin !== 'All' && order.clin !== query.clin) {
    return false
  }
  if (query.ru1 && query.ru1 !== 'All' && order.ru1 !== query.ru1) {
    return false
  }
  if (query.ru2 && query.ru2 !== 'All' && order.ru2 !== query.ru2) {
    return false
  }
  if (
    query.contractNumber &&
    query.contractNumber !== 'All' &&
    order.contractNumber !== query.contractNumber
  ) {
    return false
  }
  if (query.pop && query.pop !== 'All' && order.pop !== query.pop) {
    return false
  }

  const q = query.search?.trim().toLowerCase()
  if (!q) return true

  const haystack = [
    order.orderDate,
    order.orderNumber,
    order.nickname,
    order.clin,
    String(order.totalItems),
    formatCurrency(order.totalPopCost),
    order.orderedBy,
    order.bureau,
    order.ru1,
    order.ru2,
    order.contractNumber,
    order.pop,
    order.earliestRequestDate ?? '',
    order.toVendorDate ?? '',
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}

export function parseQuery(input: Record<string, unknown>): OrderQuery {
  const pick = (key: string) => {
    const value = input[key]
    return typeof value === 'string' && value.length > 0 ? value : undefined
  }

  return {
    bureau: pick('bureau'),
    clin: pick('clin'),
    ru1: pick('ru1'),
    ru2: pick('ru2'),
    contractNumber: pick('contractNumber'),
    pop: pick('pop'),
    search: pick('search'),
  }
}
