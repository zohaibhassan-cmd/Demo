import { Router } from 'express'
import { fundingByClin } from '../data/store.js'
import { formatCurrency } from '../lib/orders.js'

export const fundingRouter = Router()

fundingRouter.get('/', (req, res) => {
  const clin = typeof req.query.clin === 'string' ? req.query.clin : 'All'
  const clinSelected = Boolean(clin && clin !== 'All')

  if (!clinSelected) {
    res.json({
      clinSelected: false,
      cards: [
        { id: 'obligated', label: 'Total Obligated', value: null },
        { id: 'historical', label: 'Historical Orders', value: null, linked: true },
        { id: 'pending', label: 'Pending Orders', value: null },
        { id: 'remaining', label: 'Total Funding Remaining', value: null },
      ],
    })
    return
  }

  const funding = fundingByClin.find((row) => row.clin === clin)
  if (!funding) {
    res.status(404).json({ error: `No funding found for CLIN ${clin}` })
    return
  }

  res.json({
    clinSelected: true,
    clin: funding.clin,
    cards: [
      {
        id: 'obligated',
        label: 'Total Obligated',
        value: formatCurrency(funding.totalObligated),
      },
      {
        id: 'historical',
        label: 'Historical Orders',
        value: formatCurrency(funding.historicalOrders),
        linked: true,
      },
      {
        id: 'pending',
        label: 'Pending Orders',
        value: formatCurrency(funding.pendingOrders),
      },
      {
        id: 'remaining',
        label: 'Total Funding Remaining',
        value: formatCurrency(funding.totalFundingRemaining),
      },
    ],
  })
})
