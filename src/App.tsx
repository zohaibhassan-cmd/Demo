import { useState } from 'react'
import { OrdersPage } from './pages/OrdersPage'
import { AdminOrdersPage } from './pages/AdminOrdersPage'

export default function App() {
  const [view, setView] = useState<'bureau' | 'admin'>('bureau')

  if (view === 'admin') {
    return <AdminOrdersPage onSwitchToBureau={() => setView('bureau')} />
  }

  return <OrdersPage onSwitchToAdmin={() => setView('admin')} />
}
