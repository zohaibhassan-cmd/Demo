import { Router } from 'express'
import { adminFilterOptions, filterOptions } from '../data/store.js'

export const filtersRouter = Router()

filtersRouter.get('/', (_req, res) => {
  res.json({
    bureau: ['All', ...filterOptions.bureau],
    clin: ['All', ...filterOptions.clin],
    ru1: ['All', ...filterOptions.ru1],
    ru2: ['All', ...filterOptions.ru2],
  })
})

filtersRouter.get('/admin', (_req, res) => {
  res.json({
    bureau: ['All', ...adminFilterOptions.bureau],
    contractNumber: ['All', ...adminFilterOptions.contractNumber],
    pop: ['All', ...adminFilterOptions.pop],
    clin: ['All', ...adminFilterOptions.clin],
  })
})
