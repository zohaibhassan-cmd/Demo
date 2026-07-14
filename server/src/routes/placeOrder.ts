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
  step: 'start' | 'selection' | 'form' | 'review' | 'placed'
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

const zipLookup: Record<string, { city: string; state: string }> = {
  '20001': { city: 'Washington', state: 'DC' },
  '22201': { city: 'Arlington', state: 'VA' },
  '50309': { city: 'Des Moines', state: 'IA' },
  '27601': { city: 'Raleigh', state: 'NC' },
  '82001': { city: 'Cheyenne', state: 'WY' },
}

placeOrderRouter.get('/new-order/options', (_req, res) => {
  res.json({
    ru1: filterOptions.ru1,
    ru2: filterOptions.ru2,
    bureauDesignator: filterOptions.bureau,
    ccat1: ['Phone', 'Tablet', 'Wireless'],
    ccat2: ['Samsung', 'Apple', 'Pass', 'Router/WAP SIM'],
    ccat3: ['Standard', 'Rugged', 'Secure'],
    restrictedReporting: ['No (default)', 'Yes'],
    signatureRequired: ['No (default)', 'Yes'],
    addressLine1: ['1849 C Street NW', '1201 Oak Ridge Ave', '450 Federal Plaza'],
    addressLine2: ['Suite 100', 'Building B', 'Floor 3', ''],
    zips: Object.keys(zipLookup),
    unitCost: 250,
  })
})

placeOrderRouter.get('/international-pass/options', (_req, res) => {
  res.json({
    piuNickname: filterOptions.ru1,
    bureauDesignator: filterOptions.bureau,
    unitCost: 89,
  })
})

placeOrderRouter.get('/replace-upgrade/options', (_req, res) => {
  res.json({
    puiNickname: filterOptions.ru1,
    bureauDesignator: filterOptions.bureau,
    eca1: ['ECA-100', 'ECA-200', 'ECA-300'],
    eca2: ['ECA-A', 'ECA-B', 'ECA-C'],
    eca3: ['Standard', 'Priority', 'Expedited'],
    restrictedReporting: ['No (default)', 'Yes'],
    signatureRequired: ['No (default)', 'Yes', 'Wait'],
    addressLine1: ['1849 C Street NW', '1201 Oak Ridge Ave', '450 Federal Plaza'],
    addressLine2: ['Suite 100', 'Building B', 'Floor 3', ''],
    zips: Object.keys(zipLookup),
    unitCost: 33333,
    initialMaintenanceUnitCost: 22222,
  })
})

placeOrderRouter.get('/suspend/options', (_req, res) => {
  res.json({
    ru1Nickname: filterOptions.ru1,
    ru2Nickname: filterOptions.ru2,
    devicesDesignator: ['Multiple', 'Push Air', 'Ground Link', 'Secure Mesh'],
    unitCost: 88888,
  })
})

placeOrderRouter.get('/deactivate/options', (_req, res) => {
  res.json({
    ruiNickname: filterOptions.ru1,
    bureauDesignator: filterOptions.bureau.filter((b) => b !== 'All'),
    unitCost: 50555,
  })
})

placeOrderRouter.get('/zip/:zip', (req, res) => {
  const match = zipLookup[req.params.zip]
  if (!match) {
    res.status(404).json({ error: 'ZIP not found' })
    return
  }
  res.json({ zip: req.params.zip, ...match })
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
  if (
    orderType === 'New Order' ||
    orderType === 'International Pass' ||
    orderType === 'Replace-Upgrade' ||
    orderType === 'Suspend' ||
    orderType === 'Deactivate'
  ) {
    draft.items = []
    draft.step = 'form'
  } else {
    draft.items = seedItems(orderType)
    draft.step = 'review'
  }

  res.json({
    draft,
    review: draft.step === 'review' ? reviewPayload(draft) : null,
    fundingAvailableBeforeFormatted: formatCurrency(draft.fundingAvailableBefore),
    message:
      orderType === 'New Order'
        ? `Order type "${orderType}" selected. Continue to New Order form.`
        : orderType === 'International Pass'
          ? `Order type "${orderType}" selected. Continue to International Pass form.`
          : orderType === 'Replace-Upgrade'
            ? `Order type "${orderType}" selected. Continue to Replace-Upgrade form.`
            : orderType === 'Suspend'
              ? `Order type "${orderType}" selected. Continue to Suspend form.`
              : orderType === 'Deactivate'
                ? `Order type "${orderType}" selected. Continue to Deactivate form.`
                : `Order type "${orderType}" selected. Review your order.`,
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

placeOrderRouter.get('/:draftId/new-order-context', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }
  const unitCost = 250
  const spent = orderTotal(draft.items)
  res.json({
    draftId: draft.id,
    clin: draft.clin,
    bureau: draft.bureau,
    nickname: draft.nickname,
    orderType: draft.orderType ?? 'New Order',
    fundingAvailableBefore: draft.fundingAvailableBefore,
    fundingAvailableBeforeFormatted: formatCurrency(draft.fundingAvailableBefore),
    unitCost,
    unitCostFormatted: formatCurrency(unitCost),
    costRemainingForClin: draft.fundingAvailableBefore - spent,
    costRemainingForClinFormatted: formatCurrency(draft.fundingAvailableBefore - spent),
    cartCount: draft.items.length,
  })
})

placeOrderRouter.post('/:draftId/new-order-item', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }

  const body = req.body ?? {}
  const required = [
    'firstName',
    'lastName',
    'email',
    'ru1',
    'bureauDesignator',
    'ccat1',
    'ccat2',
    'requestedDeliveryDate',
    'shipAddress1',
    'shipZip',
    'shipCity',
    'shipState',
  ] as const

  for (const field of required) {
    if (!body[field] || typeof body[field] !== 'string' || !String(body[field]).trim()) {
      res.status(400).json({ error: `${field} is required` })
      return
    }
  }

  if (!String(body.email).includes('@')) {
    res.status(400).json({ error: 'Valid email is required' })
    return
  }

  const sameAsShipping = Boolean(body.sameAsShipping)
  const dutyAddress1 = sameAsShipping ? body.shipAddress1 : body.dutyAddress1
  const dutyZip = sameAsShipping ? body.shipZip : body.dutyZip
  const dutyCity = sameAsShipping ? body.shipCity : body.dutyCity
  const dutyState = sameAsShipping ? body.shipState : body.dutyState

  if (!sameAsShipping) {
    for (const [label, value] of [
      ['dutyAddress1', dutyAddress1],
      ['dutyZip', dutyZip],
      ['dutyCity', dutyCity],
      ['dutyState', dutyState],
    ] as const) {
      if (!value || typeof value !== 'string' || !value.trim()) {
        res.status(400).json({ error: `${label} is required when duty address differs` })
        return
      }
    }
  }

  const unitCost = typeof body.unitCost === 'number' ? body.unitCost : 250
  const item: DraftLineItem = {
    id: nextItemId(),
    type: 'New',
    ru1: String(body.ru1).split(' - ')[0] || String(body.ru1),
    ru2: typeof body.ru2 === 'string' && body.ru2 ? body.ru2 : 'ANRS',
    designatorCode: String(body.bureauDesignator).slice(0, 3).toUpperCase(),
    ccat1: String(body.ccat1),
    ccat2: String(body.ccat2),
    unitCost,
  }

  draft.items.push(item)
  draft.step = 'review'
  draft.orderType = 'New Order'

  const spent = orderTotal(draft.items)
  res.status(201).json({
    item,
    review: reviewPayload(draft),
    cartCount: draft.items.length,
    costRemainingForClinFormatted: formatCurrency(draft.fundingAvailableBefore - spent),
    message: 'Item added to cart',
  })
})

const historicalPassDates = [
  { orderNumber: '123451', passStartDate: '01/05/2025', passEndDate: '01/20/2025' },
  { orderNumber: '123452', passStartDate: '02/01/2025', passEndDate: '02/15/2025' },
  { orderNumber: '123453', passStartDate: '03/10/2025', passEndDate: '03/25/2025' },
  { orderNumber: '123454', passStartDate: '04/02/2025', passEndDate: '04/18/2025' },
]

placeOrderRouter.get('/:draftId/international-pass-context', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }
  const unitCost = 89
  const spent = orderTotal(draft.items)
  res.json({
    draftId: draft.id,
    clin: draft.clin,
    bureau: draft.bureau,
    nickname: draft.nickname,
    orderType: 'International Pass',
    fundingAvailableBefore: draft.fundingAvailableBefore,
    fundingAvailableBeforeFormatted: formatCurrency(draft.fundingAvailableBefore),
    unitCost,
    unitCostFormatted: formatCurrency(unitCost),
    costRemainingForPop: draft.fundingAvailableBefore - spent,
    costRemainingForPopFormatted: formatCurrency(draft.fundingAvailableBefore - spent),
    cartCount: draft.items.length,
    historicalPasses: historicalPassDates,
  })
})

placeOrderRouter.post('/:draftId/international-pass-item', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }

  const body = req.body ?? {}
  const required = [
    'mobileNumber',
    'firstName',
    'lastName',
    'email',
    'piuNickname1',
    'bureauDesignator',
    'passStartDate',
    'passEndDate',
  ] as const

  for (const field of required) {
    if (!body[field] || typeof body[field] !== 'string' || !String(body[field]).trim()) {
      res.status(400).json({ error: `${field} is required` })
      return
    }
  }

  if (!String(body.email).includes('@')) {
    res.status(400).json({ error: 'Valid email is required' })
    return
  }

  const start = new Date(String(body.passStartDate))
  const end = new Date(String(body.passEndDate))
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    res.status(400).json({ error: 'Pass End Date must be on or after Pass Start Date' })
    return
  }

  if (body.requireWithinWindow) {
    const limit = new Date()
    limit.setDate(limit.getDate() + 90)
    if (end > limit) {
      res.status(400).json({
        error: 'Pass dates must fall within the next 90 days when the restriction is checked',
      })
      return
    }
  }

  const unitCost = typeof body.unitCost === 'number' ? body.unitCost : 89
  const item: DraftLineItem = {
    id: nextItemId(),
    type: 'International Pass',
    ru1: String(body.piuNickname1).split(' - ')[0] || String(body.piuNickname1),
    ru2:
      typeof body.piuNickname2 === 'string' && body.piuNickname2
        ? String(body.piuNickname2).includes(' - ')
          ? String(body.piuNickname2).split(' - ').pop() || 'ANRS'
          : body.piuNickname2
        : 'ANRS',
    designatorCode: String(body.bureauDesignator).slice(0, 3).toUpperCase(),
    ccat1: 'Wireless',
    ccat2: 'Pass',
    unitCost,
  }

  draft.items.push(item)
  draft.step = 'review'
  draft.orderType = 'International Pass'

  const spent = orderTotal(draft.items)
  res.status(201).json({
    item,
    review: reviewPayload(draft),
    cartCount: draft.items.length,
    costRemainingForPopFormatted: formatCurrency(draft.fundingAvailableBefore - spent),
    message: 'International Pass item added to cart',
    passMeta: {
      mobileNumber: body.mobileNumber,
      passStartDate: body.passStartDate,
      passEndDate: body.passEndDate,
      sameEmailDomain: Boolean(body.sameEmailDomain),
    },
  })
})

placeOrderRouter.get('/:draftId/replace-upgrade-context', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }
  const unitCost = 33333
  const initialMaintenanceUnitCost = 22222
  const spent = orderTotal(draft.items)
  res.json({
    draftId: draft.id,
    clin: draft.clin,
    bureau: draft.bureau,
    nickname: draft.nickname,
    orderType: 'Replace-Upgrade',
    fundingAvailableBefore: draft.fundingAvailableBefore,
    fundingAvailableBeforeFormatted: formatCurrency(draft.fundingAvailableBefore),
    unitCost,
    unitCostFormatted: formatCurrency(unitCost),
    initialMaintenanceUnitCost,
    initialMaintenanceUnitCostFormatted: formatCurrency(initialMaintenanceUnitCost),
    costRemainingForClin: draft.fundingAvailableBefore - spent,
    costRemainingForClinFormatted: formatCurrency(draft.fundingAvailableBefore - spent),
    cartCount: draft.items.length,
    whatThisMeans:
      'Replace-Upgrade swaps or upgrades an existing device under the selected CLIN while preserving bureau ownership.',
    note: 'Ensure PUI nicknames and delivery dates align with the active Period of Performance.',
  })
})

placeOrderRouter.post('/:draftId/replace-upgrade-item', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }

  const body = req.body ?? {}
  const required = [
    'firstName',
    'lastName',
    'email',
    'puiNickname1',
    'bureauDesignator',
    'eca1',
    'eca2',
    'requestedDeliveryDate',
    'shipAddress1',
    'shipZip',
    'shipCity',
    'shipState',
  ] as const

  for (const field of required) {
    if (!body[field] || typeof body[field] !== 'string' || !String(body[field]).trim()) {
      res.status(400).json({ error: `${field} is required` })
      return
    }
  }

  if (!String(body.email).includes('@')) {
    res.status(400).json({ error: 'Valid email is required' })
    return
  }

  const unitCost = typeof body.unitCost === 'number' ? body.unitCost : 33333
  const item: DraftLineItem = {
    id: nextItemId(),
    type: 'Upgrade',
    ru1: String(body.puiNickname1).split(' - ')[0] || String(body.puiNickname1),
    ru2:
      typeof body.puiNickname2 === 'string' && body.puiNickname2
        ? String(body.puiNickname2).includes(' - ')
          ? String(body.puiNickname2).split(' - ').pop() || 'ANRS'
          : body.puiNickname2
        : 'ANRS',
    designatorCode: String(body.bureauDesignator).slice(0, 3).toUpperCase(),
    ccat1: String(body.eca1),
    ccat2: String(body.eca2),
    unitCost,
  }

  draft.items.push(item)
  draft.step = 'review'
  draft.orderType = 'Replace-Upgrade'

  const spent = orderTotal(draft.items)
  res.status(201).json({
    item,
    review: reviewPayload(draft),
    cartCount: draft.items.length,
    costRemainingForClinFormatted: formatCurrency(draft.fundingAvailableBefore - spent),
    message: 'Replace-Upgrade item added to cart',
  })
})

const historicalSuspendDates = [
  {
    orderNumber: '122212',
    suspendDays: 180,
    startDate: '01/05/2025',
    resumeDate: '07/04/2025',
  },
  {
    orderNumber: '45224',
    suspendDays: 0,
    startDate: '02/01/2025',
    resumeDate: '02/01/2025',
  },
  {
    orderNumber: '88901',
    suspendDays: 30,
    startDate: '03/10/2025',
    resumeDate: '04/09/2025',
  },
  {
    orderNumber: '90112',
    suspendDays: 14,
    startDate: '04/02/2025',
    resumeDate: '04/16/2025',
  },
]

placeOrderRouter.get('/:draftId/suspend-context', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }
  const unitCost = 88888
  const spent = orderTotal(draft.items)
  const remaining = Math.max(0, draft.fundingAvailableBefore - spent)
  res.json({
    draftId: draft.id,
    clin: draft.clin,
    bureau: draft.bureau,
    nickname: draft.nickname,
    orderType: 'Suspend',
    fundingAvailableBefore: draft.fundingAvailableBefore,
    fundingAvailableBeforeFormatted: formatCurrency(draft.fundingAvailableBefore),
    fundingBanner: `Total Funding Available (Before Order) ${formatCurrency(draft.fundingAvailableBefore)}`,
    unitCost,
    unitCostFormatted: formatCurrency(unitCost),
    costRemainingForPop: remaining,
    costRemainingForPopFormatted: formatCurrency(Math.min(unitCost, remaining) || unitCost),
    cartCount: draft.items.length,
    historicalSuspends: historicalSuspendDates,
  })
})

placeOrderRouter.post('/:draftId/suspend-item', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }

  const body = req.body ?? {}
  const required = [
    'mobileNumber',
    'firstName',
    'lastName',
    'email',
    'ru1Nickname',
    'devicesDesignator',
    'suspendStartDate',
    'suspendEndDate',
  ] as const

  for (const field of required) {
    if (!body[field] || typeof body[field] !== 'string' || !String(body[field]).trim()) {
      res.status(400).json({ error: `${field} is required` })
      return
    }
  }

  if (!String(body.email).includes('@')) {
    res.status(400).json({ error: 'Valid email is required' })
    return
  }

  const start = new Date(String(body.suspendStartDate))
  const end = new Date(String(body.suspendEndDate))
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    res.status(400).json({ error: 'Suspend End Date must be on or after Suspend Start Date' })
    return
  }

  const maxAdvanceStart = new Date()
  maxAdvanceStart.setHours(0, 0, 0, 0)
  maxAdvanceStart.setDate(maxAdvanceStart.getDate() + 15)
  if (start > maxAdvanceStart) {
    res.status(400).json({
      error: 'Suspend Start Date can be at most 15 days in advance',
    })
    return
  }

  const maxEnd = new Date()
  maxEnd.setHours(0, 0, 0, 0)
  maxEnd.setMonth(maxEnd.getMonth() + 12)
  if (end > maxEnd) {
    res.status(400).json({
      error: 'Suspend End Date can be at most 12 months in advance',
    })
    return
  }

  const unitCost = typeof body.unitCost === 'number' ? body.unitCost : 88888
  const item: DraftLineItem = {
    id: nextItemId(),
    type: 'Suspend',
    ru1: String(body.ru1Nickname).split(' - ')[0] || String(body.ru1Nickname),
    ru2:
      typeof body.ru2Nickname === 'string' && body.ru2Nickname
        ? String(body.ru2Nickname).includes(' - ')
          ? String(body.ru2Nickname).split(' - ').pop() || 'ANRS'
          : body.ru2Nickname
        : 'ANRS',
    designatorCode: String(body.devicesDesignator).slice(0, 3).toUpperCase(),
    ccat1: 'Wireless',
    ccat2: 'Suspend',
    unitCost,
  }

  draft.items.push(item)
  draft.step = 'review'
  draft.orderType = 'Suspend'

  const spent = orderTotal(draft.items)
  res.status(201).json({
    item,
    review: reviewPayload(draft),
    cartCount: draft.items.length,
    costRemainingForPopFormatted: formatCurrency(
      Math.max(0, draft.fundingAvailableBefore - spent),
    ),
    message: 'Suspend item added to cart',
    suspendMeta: {
      mobileNumber: body.mobileNumber,
      suspendStartDate: body.suspendStartDate,
      suspendEndDate: body.suspendEndDate,
      useEmailForNotifications: Boolean(body.useEmailForNotifications),
    },
  })
})

placeOrderRouter.get('/:draftId/deactivate-context', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }
  const unitCost = 50555
  const spent = orderTotal(draft.items)
  const remaining = Math.max(0, draft.fundingAvailableBefore - spent)
  res.json({
    draftId: draft.id,
    clin: draft.clin,
    bureau: draft.bureau,
    nickname: draft.nickname,
    orderType: 'Deactivate',
    fundingAvailableBefore: draft.fundingAvailableBefore,
    fundingAvailableBeforeFormatted: formatCurrency(draft.fundingAvailableBefore),
    unitCost,
    unitCostFormatted: formatCurrency(unitCost),
    costRemainingForClin: remaining,
    costRemainingForClinFormatted: formatCurrency(remaining),
    cartCount: draft.items.length,
  })
})

placeOrderRouter.post('/:draftId/deactivate-item', (req, res) => {
  const draft = findDraft(req.params.draftId)
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' })
    return
  }

  const body = req.body ?? {}
  const required = [
    'mobileNumber',
    'firstName',
    'lastName',
    'email',
    'ruiNickname1',
    'bureauDesignator',
    'deactivateDate',
  ] as const

  for (const field of required) {
    if (!body[field] || typeof body[field] !== 'string' || !String(body[field]).trim()) {
      res.status(400).json({ error: `${field} is required` })
      return
    }
  }

  if (!String(body.email).includes('@')) {
    res.status(400).json({ error: 'Valid email is required' })
    return
  }

  const deactivateDate = String(body.deactivateDate)
  const year = Number(deactivateDate.slice(0, 4))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deactivateDate) || Number.isNaN(year)) {
    res.status(400).json({ error: 'Valid Deactivate Date is required' })
    return
  }

  const currentYear = new Date().getFullYear()
  if (year !== currentYear) {
    res.status(400).json({
      error: `Deactivate Date must be within the current year (${currentYear})`,
    })
    return
  }

  const unitCost = typeof body.unitCost === 'number' ? body.unitCost : 50555
  const item: DraftLineItem = {
    id: nextItemId(),
    type: 'Deactivate',
    ru1: String(body.ruiNickname1).split(' - ')[0] || String(body.ruiNickname1),
    ru2:
      typeof body.ruiNickname2 === 'string' && body.ruiNickname2
        ? String(body.ruiNickname2).includes(' - ')
          ? String(body.ruiNickname2).split(' - ').pop() || 'ANRS'
          : body.ruiNickname2
        : 'ANRS',
    designatorCode: String(body.bureauDesignator).slice(0, 3).toUpperCase(),
    ccat1: 'Wireless',
    ccat2: 'Deactivate',
    unitCost,
  }

  draft.items.push(item)
  draft.step = 'review'
  draft.orderType = 'Deactivate'

  const spent = orderTotal(draft.items)
  res.status(201).json({
    item,
    review: reviewPayload(draft),
    cartCount: draft.items.length,
    costRemainingForClinFormatted: formatCurrency(
      Math.max(0, draft.fundingAvailableBefore - spent),
    ),
    message: 'Deactivate item added to cart',
    deactivateMeta: {
      mobileNumber: body.mobileNumber,
      deactivateDate: body.deactivateDate,
    },
  })
})
