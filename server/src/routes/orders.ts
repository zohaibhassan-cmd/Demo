import { Router } from 'express'
import { orders, type OrderStatus } from '../data/store.js'
import {
  matchesFilters,
  parseQuery,
  toAdminOrderRow,
  toOrderRow,
  formatCurrency,
} from '../lib/orders.js'

export type ItemizationLine = {
  id: string
  type: string
  nid: string
  poc: string
  designatorCode: string
  stat1: string
  stat2: string
  unitCost: number
}

type ItemizationRecord = {
  orderId: string
  lines: ItemizationLine[]
}

const itemizationByOrder = new Map<string, ItemizationRecord>()
let itemizationSeq = 1

function nextLineId() {
  const id = `ITM-${String(itemizationSeq).padStart(3, '0')}`
  itemizationSeq += 1
  return id
}

function seedLines(orderId: string): ItemizationLine[] {
  return [
    {
      id: nextLineId(),
      type: 'Phone',
      nid: 'Motorola',
      poc: '12345',
      designatorCode: '123',
      stat1: 'Phone',
      stat2: 'Samsung',
      unitCost: 404,
    },
    {
      id: nextLineId(),
      type: 'Phone',
      nid: 'Nokia',
      poc: '23456',
      designatorCode: '234',
      stat1: 'Phone',
      stat2: 'Apple',
      unitCost: 350,
    },
    {
      id: nextLineId(),
      type: 'TABLET',
      nid: 'IPAD PRO',
      poc: '34567',
      designatorCode: '345',
      stat1: 'Tablet',
      stat2: 'Apple',
      unitCost: 899,
    },
    {
      id: nextLineId(),
      type: 'TABLET',
      nid: 'Galaxy Tab',
      poc: '45678',
      designatorCode: '456',
      stat1: 'Tablet',
      stat2: 'Samsung',
      unitCost: 650,
    },
    {
      id: nextLineId(),
      type: 'Smart Watch',
      nid: 'Apple Watch',
      poc: '56789',
      designatorCode: '567',
      stat1: 'Wearable',
      stat2: 'Apple WATCH Ultra',
      unitCost: 799,
    },
  ].map((line, index) => ({
    ...line,
    id: `${orderId}-L${index + 1}`,
  }))
}

function ensureItemization(orderId: string): ItemizationRecord {
  let record = itemizationByOrder.get(orderId)
  if (!record) {
    record = { orderId, lines: seedLines(orderId) }
    itemizationByOrder.set(orderId, record)
  }
  return record
}

function categoryBucket(stat1: string): 'phones' | 'tablets' | 'wireless' {
  const value = stat1.toLowerCase()
  if (value.includes('tablet')) return 'tablets'
  if (value.includes('wireless') || value.includes('wear')) return 'wireless'
  return 'phones'
}

function itemizationPayload(order: (typeof orders)[number], record: ItemizationRecord) {
  const totalItems = record.lines.length
  const orderTotal = record.lines.reduce((sum, line) => sum + line.unitCost, 0)
  const buckets = {
    phones: { count: 0, amount: 0 },
    tablets: { count: 0, amount: 0 },
    wireless: { count: 0, amount: 0 },
  }
  for (const line of record.lines) {
    const key = categoryBucket(line.stat1)
    buckets[key].count += 1
    buckets[key].amount += line.unitCost
  }

  const statusLabel = order.status === 'pending' ? 'Pending' : 'Complete'

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    clin: order.clin,
    orderStatus: statusLabel,
    title: `Itemization of Order ${order.orderNumber} CLIN ${order.clin}`,
    lines: record.lines,
    totalItems,
    orderTotal,
    orderTotalFormatted: formatCurrency(orderTotal),
    categories: [
      {
        label: 'Phones',
        count: buckets.phones.count,
        amount: buckets.phones.amount,
        amountFormatted: formatCurrency(buckets.phones.amount),
      },
      {
        label: 'Tablets',
        count: buckets.tablets.count,
        amount: buckets.tablets.amount,
        amountFormatted: formatCurrency(buckets.tablets.amount),
      },
      {
        label: 'Wireless',
        count: buckets.wireless.count,
        amount: buckets.wireless.amount,
        amountFormatted: formatCurrency(buckets.wireless.amount),
      },
    ],
  }
}

export const ordersRouter = Router()

function listByStatus(status: OrderStatus) {
  return (req: import('express').Request, res: import('express').Response) => {
    const query = parseQuery(req.query as Record<string, unknown>)
    const rows = orders
      .filter((order) => order.status === status)
      .filter((order) => matchesFilters(order, query))
      .map(toOrderRow)

    res.json({ status, count: rows.length, rows })
  }
}

function listAdminByStatus(status: OrderStatus) {
  return (req: import('express').Request, res: import('express').Response) => {
    const query = parseQuery(req.query as Record<string, unknown>)
    const rows = orders
      .filter((order) => order.status === status)
      .filter((order) => matchesFilters(order, query))
      .map(toAdminOrderRow)

    res.json({ status, count: rows.length, rows })
  }
}

ordersRouter.get('/pending', listByStatus('pending'))
ordersRouter.get('/historical', listByStatus('historical'))

ordersRouter.get('/admin/pending', listAdminByStatus('pending'))
ordersRouter.get('/admin/historical', listAdminByStatus('historical'))

ordersRouter.get('/admin/export/:status', (req, res) => {
  const status = req.params.status
  if (status !== 'pending' && status !== 'historical') {
    res.status(400).json({ error: 'status must be pending or historical' })
    return
  }

  const query = parseQuery(req.query as Record<string, unknown>)
  const rows = orders
    .filter((order) => order.status === status)
    .filter((order) => matchesFilters(order, query))

  const header =
    status === 'pending'
      ? [
          'Order #',
          'Order Date',
          'CLIN',
          'Total POP Cost',
          'Earliest Request Date',
          'Ordered By',
        ]
      : [
          'Order #',
          'Order Date',
          'CLIN',
          'Total POP Cost',
          'To Vendor Date',
          'Ordered By',
        ]

  const lines = rows.map((order) => {
    const dateCol =
      status === 'pending' ? order.earliestRequestDate ?? '' : order.toVendorDate ?? ''
    return [
      order.orderNumber,
      order.orderDate,
      order.clin,
      String(order.totalPopCost),
      dateCol,
      order.orderedBy,
    ]
      .map((cell) => `"${cell.replaceAll('"', '""')}"`)
      .join(',')
  })

  const csv = [header.join(','), ...lines].join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="admin-${status}-orders.csv"`,
  )
  res.send(csv)
})

ordersRouter.get('/export/:status', (req, res) => {
  const status = req.params.status
  if (status !== 'pending' && status !== 'historical') {
    res.status(400).json({ error: 'status must be pending or historical' })
    return
  }

  const query = parseQuery(req.query as Record<string, unknown>)
  const rows = orders
    .filter((order) => order.status === status)
    .filter((order) => matchesFilters(order, query))

  const header = [
    'Order Date',
    'Order #',
    'Order Nickname',
    'CLIN',
    'Bureau',
    'RU1',
    'RU2',
    'Total Items',
    'Total POP Cost',
    'Ordered By',
  ]

  const lines = rows.map((order) =>
    [
      order.orderDate,
      order.orderNumber,
      order.nickname,
      order.clin,
      order.bureau,
      order.ru1,
      order.ru2,
      String(order.totalItems),
      String(order.totalPopCost),
      order.orderedBy,
    ]
      .map((cell) => `"${cell.replaceAll('"', '""')}"`)
      .join(','),
  )

  const csv = [header.join(','), ...lines].join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${status}-orders.csv"`,
  )
  res.send(csv)
})

ordersRouter.get('/:id/itemization', (req, res) => {
  const order = orders.find((row) => row.id === req.params.id)
  if (!order) {
    res.status(404).json({ error: 'Order not found' })
    return
  }
  const record = ensureItemization(order.id)
  res.json(itemizationPayload(order, record))
})

ordersRouter.patch('/:id/itemization/:lineId', (req, res) => {
  const order = orders.find((row) => row.id === req.params.id)
  if (!order) {
    res.status(404).json({ error: 'Order not found' })
    return
  }
  const record = ensureItemization(order.id)
  const line = record.lines.find((row) => row.id === req.params.lineId)
  if (!line) {
    res.status(404).json({ error: 'Line item not found' })
    return
  }

  const fields = ['type', 'nid', 'poc', 'designatorCode', 'stat1', 'stat2'] as const
  for (const field of fields) {
    const value = req.body?.[field]
    if (typeof value === 'string' && value.trim()) {
      line[field] = value.trim()
    }
  }
  if (typeof req.body?.unitCost === 'number' && req.body.unitCost >= 0) {
    line.unitCost = req.body.unitCost
  }

  res.json(itemizationPayload(order, record))
})

ordersRouter.delete('/:id/itemization/:lineId', (req, res) => {
  const order = orders.find((row) => row.id === req.params.id)
  if (!order) {
    res.status(404).json({ error: 'Order not found' })
    return
  }
  const record = ensureItemization(order.id)
  const before = record.lines.length
  record.lines = record.lines.filter((row) => row.id !== req.params.lineId)
  if (record.lines.length === before) {
    res.status(404).json({ error: 'Line item not found' })
    return
  }
  res.json(itemizationPayload(order, record))
})

ordersRouter.get('/:id', (req, res) => {
  const order = orders.find((row) => row.id === req.params.id)
  if (!order) {
    res.status(404).json({ error: 'Order not found' })
    return
  }

  const record = ensureItemization(order.id)
  res.json({
    ...toOrderRow(order),
    status: order.status,
    bureau: order.bureau,
    ru1: order.ru1,
    ru2: order.ru2,
    contractNumber: order.contractNumber,
    pop: order.pop,
    earliestRequestDate: order.earliestRequestDate,
    toVendorDate: order.toVendorDate,
    itemization: itemizationPayload(order, record),
  })
})
