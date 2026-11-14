/** Same rule as the dashboard and the inventory low-stock filter: quantity at or below the alert level. */
export function isLowStock(quantity: number, lowStockThreshold?: number | null) {
  return quantity <= (lowStockThreshold ?? 10);
}
