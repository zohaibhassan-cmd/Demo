import { Router } from 'express'
import { filterOptions, fundingByClin } from '../data/store.js'
import { formatCurrency } from '../lib/orders.js'

export const orderTypes = [
  'New Order',
  'International Pass',
  'Replace-Upgrade',
  'Suspend',
  'Deactivate',
] as const

export type OrderType = (typeof orderTypes)[number]

export type DraftLineItem = {
  id: string
  type: string
  ru1: string
  ru2: string
  designatorCode: string
  ccat1: string
  ccat2: string
  unitCost: number
}

export type PlaceOrderDraft = {
  id: string
  bureau: string
  clin: string
  nickname: string
  fundingAvailableBefore: number
  createdAt: string
  step: 'start' | 'selection' | 'review' | 'placed'
  orderType: OrderType | null
  bulkUploadFileName: string | null
  items: DraftLineItem[]
  emailSent: boolean
  orderNumber: string | null
  summary: OrderSummary | null
}

export type CategoryTotal = {
  label: string
  count: number
  amount: number
}

export type LocationBreakdown = {
  location: string
  phones: CategoryTotal
  tablets: CategoryTotal
  wireless: CategoryTotal
  subtotal: number
}

export type OrderSummary = {
  clin: string
  orderNumber: string
  totalItems: number
  orderTotal: number
  categories: CategoryTotal[]
  locations: LocationBreakdown[]
  fundingAvailableBefore: number
  fundingAvailableAfter: number
  emailMessage: string
}

export const placeOrderDrafts: PlaceOrderDraft[] = []

let itemSeq = 1

function nextItemId() {
  const id = `LI-${String(itemSeq).padStart(3, '0')}`
  itemSeq += 1
  return id
}

function seedItems(orderType: OrderType): DraftLineItem[] {
  const base: DraftLineItem[] = [
    {
      id: nextItemId(),
      type: orderType === 'Replace-Upgrade' ? 'Upgrade' : 'New',
      ru1: 'Alabama',
      ru2: 'COLE',
      designatorCode: 'XXX',
      ccat1: 'Phone',
      ccat2: 'Samsung',
      unitCost: 280,
    },
    {
      id: nextItemId(),
      type: 'New',
      ru1: 'Iowa',
      ru2: 'ANRS',
      designatorCode: 'XXX',
      ccat1: 'Phone',
      ccat2: 'Apple',
      unitCost: 300,
    },
    {
      id: nextItemId(),
      type: 'New',
      ru1: 'North Dakota',
      ru2: 'AFAC',
      designatorCode: 'XXX',
      ccat1: 'Phone',
      ccat2: 'Pass',
      unitCost: 120,
    },
    {
      id: nextItemId(),
      type: 'Upgrade',
      ru1: 'Wyoming',
      ru2: 'ANRS',
      designatorCode: 'XXX',
      ccat1: 'Tablet',
      ccat2: 'Samsung',
      unitCost: 416,
    },
    {
      id: nextItemId(),
      type: orderType === 'Deactivate' ? 'Deactivate' : 'Upgrade',
      ru1: 'Wyoming',
      ru2: 'COLE',
      designatorCode: 'XXX',
      ccat1: 'Wireless',
      ccat2: 'Router/WAP SIM',
      unitCost: 100,
    },
  ]
  return base
}

function orderTotal(items: DraftLineItem[]) {
  return items.reduce((sum, item) => sum + item.unitCost, 0)
}

function buildOrderSummary(draft: PlaceOrderDraft): OrderSummary {
  const total = orderTotal(draft.items)
  // Demo summary matches Figma category/location breakdown; totals align to order total.
  const categories: CategoryTotal[] = [
    { label: 'Phones', count: 30, amount: 404 },
    { label: 'Tablets', count: 2, amount: 222 },
    { label: 'Wireless', count: 10, amount: 590 },
  ]
  const locations: LocationBreakdown[] = [
    {
      location: 'Iowa - ANRS',
      phones: { label: 'Phones', count: 20, amount: 269 },
      tablets: { label: 'Tablets', count: 1, amount: 111 },
      wireless: { label: 'Wireless', count: 0, amount: 0 },
      subtotal: 380,
    },
    {
      location: 'North Carolina - AFAC',
      phones: { label: 'Phones', count: 10, amount: 135 },
      tablets: { label: 'Tablets', count: 1, amount: 111 },
      wireless: { label: 'Wireless', count: 10, amount: 590 },
      subtotal: 836,
    },
  ]

  return {
    clin: draft.clin,
    orderNumber: draft.orderNumber ?? '',
    totalItems: categories.reduce((sum, row) => sum + row.count, 0),
    orderTotal: total,
    categories,
    locations,
    fundingAvailableBefore: draft.fundingAvailableBefore,
    fundingAvailableAfter: draft.fundingAvailableBefore - total,
    emailMessage: 'A copy of your order has been sent to your email.',
  }
}

function summaryPayload(summary: OrderSummary) {
  return {
    ...summary,
    orderTotalFormatted: formatCurrency(summary.orderTotal),
    fundingAvailableBeforeFormatted: formatCurrency(summary.fundingAvailableBefore),
    fundingAvailableAfterFormatted: formatCurrency(summary.fundingAvailableAfter),
    categories: summary.categories.map((row) => ({
      ...row,
      amountFormatted: formatCurrency(row.amount),
    })),
    locations: summary.locations.map((loc) => ({
      location: loc.location,
      subtotal: loc.subtotal,
      subtotalFormatted: formatCurrency(loc.subtotal),
      phones: { ...loc.phones, amountFormatted: formatCurrency(loc.phones.amount) },
      tablets: { ...loc.tablets, amountFormatted: formatCurrency(loc.tablets.amount) },
      wireless: { ...loc.wireless, amountFormatted: formatCurrency(loc.wireless.amount) },
    })),
  }
}

function reviewPayload(draft: PlaceOrderDraft) {
  const total = orderTotal(draft.items)
  const after = draft.fundingAvailableBefore - total
  return {
    draftId: draft.id,
    clin: draft.clin,
    nickname: draft.nickname,
    orderType: draft.orderType,
    fundingAvailableBefore: draft.fundingAvailableBefore,
    fundingAvailableBeforeFormatted: formatCurrency(draft.fundingAvailableBefore),
    fundingAvailableAfter: after,
    fundingAvailableAfterFormatted: formatCurrency(after),
    orderTotal: total,
    orderTotalFormatted: formatCurrency(total),
    cartCount: draft.items.length,
    emailMessage: draft.emailSent
      ? 'A copy of your order has been sent to your email.'
      : 'A copy of your order will be sent to your email on Place Order.',
    items: draft.items,
    step: draft.step,
    orderNumber: draft.orderNumber,
  }
}

function findDraft(draftId: string) {
  return placeOrderDrafts.find((row) => row.id === draftId)
}

export const placeOrderRouter = Router()

placeOrderRouter.get('/options', (_req, res) => {
  res.json({
    bureau: filterOptions.bureau,
    clin: filterOptions.clin,
    orderTypes: [...orderTypes],
  })
})

placeOrderRouter.get('/funding-available', (req, res) => {
  const clin = typeof req.query.clin === 'string' ? req.query.clin : ''
  const bureau = typeof req.query.bureau === 'string' ? req.query.bureau : ''

  if (!clin) {
    res.json({
      clin: null,
      bureau: bureau || null,
      totalFundingAvailableBefore: 1358000,
      totalFundingAvailableBeforeFormatted: formatCurrency(1358000),
    })
    return
  }

  const funding = fundingByClin.find((row) => row.clin === clin)
  if (!funding) {
    res.status(404).json({ error: `No funding found for CLIN ${clin}` })
    return
  }

  res.json({
    clin,
    bureau: bureau || null,
    totalFundingAvailableBefore: funding.totalFundingRemaining,
    totalFundingAvailableBeforeFormatted: formatCurrency(funding.totalFundingRemaining),
  })
})

placeOrderRouter.post('/start', (req, res) => {
  const { bureau, clin, nickname } = req.body ?? {}

  if (!bureau || typeof bureau !== 'string') {
    res.status(400).json({ error: 'Bureau/Office is required' })
    return
  }
  if (!clin || typeof clin !== 'string') {
    res.status(400).json({ error: 'CLIN is required' })
    return
  }
  if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
    res.status(400).json({ error: 'Order Nickname is required' })
    return
  }

  const funding = fundingByClin.find((row) => row.clin === clin)
  const fundingAvailableBefore = funding?.totalFundingRemaining ?? 1358000

  const draft: PlaceOrderDraft = {
    id: `DRAFT-${String(placeOrderDrafts.length + 1).padStart(3, '0')}`,
    bureau,
    clin,
    nickname: nickname.trim(),
    fundingAvailableBefore,
    createdAt: new Date().toISOString(),
    step: 'selection',
    orderType: null,
    bulkUploadFileName: null,
    items: [],
    emailSent: false,
    orderNumber: null,
    summary: null,
  }

  placeOrderDrafts.push(draft)

  res.status(201).json({
    draft,
    fundingAvailableBeforeFormatted: formatCurrency(fundingAvailableBefore),
    message: 'Place Order started. Continue to Order Selection.',
  })
})

placeOrderRouter.post('/:draftId/order-type', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }

  const { orderType } = req.body ?? {}
  if (!orderType || !orderTypes.includes(orderType)) {
    res.status(400).json({
      error: `Order Type is required. Valid types: ${orderTypes.join(', ')}`,
    })
    return
  }

  draft.orderType = orderType
  draft.items = seedItems(orderType)
  draft.step = 'review'

  res.json({
    draft,
    review: reviewPayload(draft),
    fundingAvailableBeforeFormatted: formatCurrency(draft.fundingAvailableBefore),
    message: `Order type "${orderType}" selected. Review your order.`,
  })
})

placeOrderRouter.post('/:draftId/bulk-upload', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }

  const { fileName } = req.body ?? {}
  if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
    res.status(400).json({ error: 'fileName is required for bulk upload' })
    return
  }

  const lower = fileName.toLowerCase()
  if (!lower.endsWith('.csv') && !lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
    res.status(400).json({ error: 'Upload a .csv or Excel file' })
    return
  }

  draft.bulkUploadFileName = fileName.trim()
  if (draft.items.length === 0) {
    draft.items = seedItems(draft.orderType ?? 'New Order')
  }
  draft.step = 'review'

  res.json({
    draft,
    review: reviewPayload(draft),
    message: `Bulk upload received: ${draft.bulkUploadFileName}`,
  })
})

placeOrderRouter.get('/:draftId/review', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }
  res.json(reviewPayload(draft))
})

placeOrderRouter.delete('/:draftId/items/:itemId', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }

  const before = draft.items.length
  draft.items = draft.items.filter((item) => item.id !== req.params.itemId)
  if (draft.items.length === before) {
    res.status(404).json({ error: 'Item not found' })
    return
  }

  res.json(reviewPayload(draft))
})

placeOrderRouter.patch('/:draftId/items/:itemId', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }

  const item = draft.items.find((row) => row.id === req.params.itemId)
  if (!item) {
    res.status(404).json({ error: 'Item not found' })
    return
  }

  const fields = ['type', 'ru1', 'ru2', 'designatorCode', 'ccat1', 'ccat2'] as const
  for (const field of fields) {
    const value = req.body?.[field]
    if (typeof value === 'string' && value.trim()) {
      item[field] = value.trim()
    }
  }
  if (typeof req.body?.unitCost === 'number' && req.body.unitCost >= 0) {
    item.unitCost = req.body.unitCost
  }

  res.json(reviewPayload(draft))
})

placeOrderRouter.post('/:draftId/items', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }

  const item: DraftLineItem = {
    id: nextItemId(),
    type: typeof req.body?.type === 'string' ? req.body.type : 'New',
    ru1: typeof req.body?.ru1 === 'string' ? req.body.ru1 : 'Iowa',
    ru2: typeof req.body?.ru2 === 'string' ? req.body.ru2 : 'ANRS',
    designatorCode:
      typeof req.body?.designatorCode === 'string' ? req.body.designatorCode : 'XXX',
    ccat1: typeof req.body?.ccat1 === 'string' ? req.body.ccat1 : 'Phone',
    ccat2: typeof req.body?.ccat2 === 'string' ? req.body.ccat2 : 'Samsung',
    unitCost: typeof req.body?.unitCost === 'number' ? req.body.unitCost : 250,
  }

  draft.items.push(item)
  draft.step = 'review'

  res.status(201).json(reviewPayload(draft))
})

placeOrderRouter.post('/:draftId/place', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }
  if (draft.items.length === 0) {
    res.status(400).json({ error: 'Add at least one line item before placing the order' })
    return
  }

  draft.emailSent = true
  draft.step = 'placed'
  draft.orderNumber = `${draft.bureau}${100 + placeOrderDrafts.indexOf(draft)}`
  draft.summary = buildOrderSummary(draft)

  res.json({
    ...reviewPayload(draft),
    summary: summaryPayload(draft.summary),
    message: `Order ${draft.orderNumber} placed. Confirmation emailed to user and CO.`,
  })
})

placeOrderRouter.get('/:draftId/summary', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }
  if (!draft.summary) {
    if (draft.items.length === 0) {
      res.status(400).json({ error: 'No order summary available yet' })
      return
    }
    draft.summary = buildOrderSummary(draft)
  }
  res.json(summaryPayload(draft.summary))
})
