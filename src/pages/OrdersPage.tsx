import { useState } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { FilterBar, type FilterValues } from '../components/FilterBar'
import { FundingCards } from '../components/FundingCards'
import { OrdersTable } from '../components/OrdersTable'
import { historicalOrders, pendingOrders } from '../data/orders'
import './OrdersPage.css'

const initialFilters: FilterValues = {
  bureau: 'All',
  clin: 'All',
  ru1: 'All',
  ru2: 'All',
}

export function OrdersPage() {
  const [filters, setFilters] = useState<FilterValues>(initialFilters)
  const clinSelected = filters.clin !== 'All'

  return (
    <div className="orders-page">
      <Header />
      <FilterBar
        values={filters}
        onChange={setFilters}
        cartCount={1}
        onProductDetails={() => undefined}
        onPlaceOrder={() => undefined}
        onAddressBook={() => undefined}
      />

      <main className="orders-page__main">
        <FundingCards
          clinSelected={clinSelected}
          cards={[
            { id: 'obligated', label: 'Total Obligated', value: '$1,250,000' },
            {
              id: 'historical',
              label: 'Historical Orders',
              value: '$842,500',
              linked: true,
            },
            { id: 'pending', label: 'Pending Orders', value: '$126,400' },
            {
              id: 'remaining',
              label: 'Total Funding Remaining',
              value: '$281,100',
            },
          ]}
        />

        <OrdersTable title="Pending Orders" rows={pendingOrders} />
        <OrdersTable title="Historical Orders" rows={historicalOrders} />
      </main>

      <Footer />
    </div>
  )
}
