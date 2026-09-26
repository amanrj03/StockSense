import Link from "next/link";
import { MdSearch } from "react-icons/md";
import { searchInventory } from "@/lib/services/global-search";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const query = firstParam((await searchParams).q).trim().slice(0, 100);
  const results = await searchInventory(query);
  const hasResults = results !== null && Object.values(results).some((items) => items.length > 0);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">Results across inventory records</p>
      </div>

      <form action="/search" method="get" role="search" className="flex max-w-xl items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        <MdSearch size={18} className="text-muted-foreground" aria-hidden="true" />
        <input type="search" name="q" defaultValue={query} autoFocus aria-label="Search inventory" placeholder="Product, SKU, reference, contact, warehouse, location" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Search</button>
      </form>

      {!query ? (
        <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Enter a search term to find inventory records.</p>
      ) : !hasResults ? (
        <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">No results for “{query}”.</p>
      ) : (
        <div className="space-y-6">
          {results.products.length > 0 && <section aria-labelledby="products-results"><h2 id="products-results" className="mb-2 text-sm font-semibold text-foreground">Products · {results.products.length}</h2><div className="divide-y divide-border border-y border-border">{results.products.map((item) => <Link key={item.id} href="/products" className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"><span className="font-medium text-foreground">{item.name}</span><span className="font-mono text-xs text-muted-foreground">{item.sku} · {item.unitOfMeasure}</span></Link>)}</div></section>}

          {results.receipts.length > 0 && <section aria-labelledby="receipts-results"><h2 id="receipts-results" className="mb-2 text-sm font-semibold text-foreground">Receipts · {results.receipts.length}</h2><div className="divide-y divide-border border-y border-border">{results.receipts.map((item) => <Link key={item.id} href={`/operations/receipts/${item.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"><span className="font-mono font-medium text-primary">{item.reference}</span><span className="text-sm text-muted-foreground">{item.contact} · {item.status.toLowerCase()}</span></Link>)}</div></section>}

          {results.deliveryOrders.length > 0 && <section aria-labelledby="delivery-results"><h2 id="delivery-results" className="mb-2 text-sm font-semibold text-foreground">Delivery Orders · {results.deliveryOrders.length}</h2><div className="divide-y divide-border border-y border-border">{results.deliveryOrders.map((item) => <Link key={item.id} href={`/operations/delivery-orders/${item.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"><span className="font-mono font-medium text-primary">{item.reference}</span><span className="text-sm text-muted-foreground">{item.contact} · {item.status.toLowerCase()}</span></Link>)}</div></section>}

          {results.transfers.length > 0 && <section aria-labelledby="transfers-results"><h2 id="transfers-results" className="mb-2 text-sm font-semibold text-foreground">Internal Transfers · {results.transfers.length}</h2><div className="divide-y divide-border border-y border-border">{results.transfers.map((item) => <Link key={item.id} href={`/operations/internal-transfers/${item.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"><span className="font-mono font-medium text-primary">{item.reference}</span><span className="text-sm text-muted-foreground">{item.status.toLowerCase()}</span></Link>)}</div></section>}

          {results.adjustments.length > 0 && <section aria-labelledby="adjustments-results"><h2 id="adjustments-results" className="mb-2 text-sm font-semibold text-foreground">Stock Adjustments · {results.adjustments.length}</h2><div className="divide-y divide-border border-y border-border">{results.adjustments.map((item) => <Link key={item.id} href={`/operations/adjustments/${item.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"><span className="font-mono font-medium text-primary">{item.reference} · {item.product.name} ({item.product.sku})</span><span className="text-sm text-muted-foreground">{item.status.toLowerCase()}</span></Link>)}</div></section>}

          {results.warehouses.length > 0 && <section aria-labelledby="warehouses-results"><h2 id="warehouses-results" className="mb-2 text-sm font-semibold text-foreground">Warehouses · {results.warehouses.length}</h2><div className="divide-y divide-border border-y border-border">{results.warehouses.map((item) => <Link key={item.id} href="/settings/warehouses" className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"><span className="font-medium text-foreground">{item.name}</span><span className="font-mono text-xs text-muted-foreground">{item.shortCode}</span></Link>)}</div></section>}

          {results.locations.length > 0 && <section aria-labelledby="locations-results"><h2 id="locations-results" className="mb-2 text-sm font-semibold text-foreground">Locations · {results.locations.length}</h2><div className="divide-y divide-border border-y border-border">{results.locations.map((item) => <Link key={item.id} href="/settings/locations" className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"><span className="font-medium text-foreground">{item.name}</span><span className="text-xs text-muted-foreground">{item.warehouse.shortCode}/{item.shortCode}</span></Link>)}</div></section>}
        </div>
      )}
    </div>
  );
}