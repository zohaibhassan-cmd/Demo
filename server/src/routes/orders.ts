import { Router } from 'express'
import { orders, type OrderStatus } from '../data/store.js'
import {
  matchesFilters,
  parseQuery,
  toAdminOrderRow,
  toOrderRow,
} from '../lib/orders.js'

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

ordersRouter.get('/:id', (req, res) => {
  const order = orders.find((row) => row.id === req.params.id)
  if (!order) {
    res.status(404).json({ error: 'Order not found' })
    return
  }

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
    items: [
      {
        type: 'New',
        tech: 'Phone',
        quantity: Math.max(1, Math.floor(order.totalItems / 2)),
      },
      {
        type: 'Upgrade',
        tech: 'Tablet',
        quantity: Math.max(1, order.totalItems - Math.floor(order.totalItems / 2)),
      },
    ],
  })
})
