import cors from 'cors'
import express from 'express'
import { filtersRouter } from './routes/filters.js'
import { fundingRouter } from './routes/funding.js'
import { ordersRouter } from './routes/orders.js'
import { placeOrderRouter } from './routes/placeOrder.js'

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'acquisition-nexus-api' })
})

app.get('/api/cart', (_req, res) => {
  res.json({ count: 1 })
})

app.use('/api/filters', filtersRouter)
app.use('/api/funding', fundingRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/place-order', placeOrderRouter)

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
