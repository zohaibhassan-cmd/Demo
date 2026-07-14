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

export type PlaceOrderDraft = {
  id: string
  bureau: string
  clin: string
  nickname: string
  fundingAvailableBefore: number
  createdAt: string
  step: 'start' | 'selection' | 'form'
  orderType: OrderType | null
  bulkUploadFileName: string | null
}

export const placeOrderDrafts: PlaceOrderDraft[] = []

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
  }

  placeOrderDrafts.push(draft)

  res.status(201).json({
    draft,
    fundingAvailableBeforeFormatted: formatCurrency(fundingAvailableBefore),
    message: 'Place Order started. Continue to Order Selection.',
  })
})

placeOrderRouter.post('/:draftId/order-type', (req, res) => {
  const draft = placeOrderDrafts.find((row) => row.id === req.params.draftId)
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
  draft.step = 'form'

  res.json({
    draft,
    fundingAvailableBeforeFormatted: formatCurrency(draft.fundingAvailableBefore),
    message: `Order type "${orderType}" selected. Continue to order form.`,
  })
})

placeOrderRouter.post('/:draftId/bulk-upload', (req, res) => {
  const draft = placeOrderDrafts.find((row) => row.id === req.params.draftId)
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

  res.json({
    draft,
    message: `Bulk upload received: ${draft.bulkUploadFileName}`,
  })
})
