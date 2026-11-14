# POS UI/UX redesign report

The business logic, APIs, routes, and permissions were left in place. This pass replaces the soft blue “card inside a card” frame with a calmer workspace and applies that system to the shell and the main counter screens.

## 1. Design system

Plus Jakarta Sans stays. Numbers use tabular figures.

| Token | Value |
| --- | --- |
| Background | `#f3f4f7` |
| Surface | `#ffffff` |
| Surface muted | `#f6f7f9` |
| Text | `#12141c` |
| Muted text | `#6b7285` |
| Brand | `#4f46e5` |
| Brand hover | `#4338ca` |
| Brand soft | `#eef0ff` |
| Success | `#0f7a4d` |
| Warning | `#9a6700` |
| Danger | `#c2413a` |
| Border | 8% ink |

Radius is 12px on controls and 16px on panels. Depth has three steps: surface, raised, and floating. Large violet gradients are no longer used for primary buttons. Brand color is reserved for the active action, the active nav item, and the lead metric.

## 2. Motion system

Shared presets live in `lib/motion/presets.ts`: `fadeUp`, `fadeIn`, `pageTransition`, `springSoft`, `listContainer`, and `listItem`.

Used in the product:

- Sidebar active pill moves with a shared layout animation.
- The sidebar width animates when collapsed.
- The main area fades and rises about 6px when the route changes.
- Dashboard metrics lift 2px on hover.
- Checkout product cards and cart lines still animate in.
- Category chips keep their sliding active pill.
- `prefers-reduced-motion` short-circuits Framer Motion on the page wrapper and metrics, and a global CSS rule collapses transitions.

## 3. Components redesigned

Created:

- `components/pos/design.tsx` — page motion, section header, metric card, empty state
- `lib/motion/presets.ts`

Updated:

- App shell, including grouped navigation, collapse, search, shift, and notifications
- Primary button color
- Table header typography
- Login card
- Page headers on checkout, repairs, reports, and settings
- Sales table
- Category manager, now a list plus a detail panel

## 4. Pages redesigned

| Page | What changed |
| --- | --- |
| Login | Quiet sign-in panel on the new canvas |
| Shell | Compact sidebar, grouped links, account at the bottom, collapse control |
| Dashboard | Four different KPI cards, week chart, low stock, open repairs with estimates |
| Checkout | Search stays primary, payment is Cash / Card / Bank, total is the largest figure |
| Sales | Denser ledger, payment and status pills, row hover |
| Repairs | Header and new-ticket action match the new buttons |
| Categories | List on the left, selected category on the right, deactivate asks for confirmation |
| Product, stock, staff, settings, reports | Primary actions and page headers use the same surface and button treatment |

The persistent 300px right rail is gone. Search, the shift, notifications, and New sale sit in the top bar so checkout can use the full width for products and the cart.

## 5. UX improvements

- Search is always available. ⌘K or Ctrl+K focuses it and submits to checkout.
- The shift control is one compact button instead of a second column.
- Checkout payment no longer hides methods inside a dropdown.
- The sale total is right-aligned and larger than the subtotal.
- Category deactivation asks before it runs.
- Checkout no longer says “no products” before the first response returns.
- The notification control tells the truth: it reports that there are no alerts, instead of showing a fake unread dot.

## 6. Responsive behavior

Desktop is the primary layout. The sidebar is visible from 1024px up and collapses to icons. Below that, navigation moves into the existing slide-over menu, and the shift button drops under the page. Checkout stays a product grid plus a cart column. Tables scroll inside their surface instead of stretching the page.

## 7. Accessibility

- Search, notifications, and the mobile menu have accessible names.
- Payment methods expose `aria-selected`.
- Focus uses the brand outline.
- Motion respects `prefers-reduced-motion`.
- Forms that were rebuilt (login, categories) keep visible labels. Older forms still use a mix of labels and placeholders.

## 8. Files changed

- `app/globals.css`
- `app/login/page.tsx`
- `app/(pos)/dashboard/page.tsx`
- `components/auth/login-form.tsx`
- `components/pos/design.tsx`
- `components/pos/pos-shell.tsx`
- `components/pos/dashboard-home.tsx`
- `components/pos/checkout-client.tsx`
- `components/pos/sales-history.tsx`
- `components/pos/repairs-board.tsx`
- `components/pos/repair-detail.tsx`
- `components/pos/daily-report.tsx`
- `components/pos/settings-form.tsx`
- `components/pos/categories-admin.tsx`
- `components/pos/product-form.tsx`
- `components/pos/product-detail-client.tsx`
- `components/pos/stock-adjustments-form.tsx`
- `components/pos/users-admin.tsx`
- `components/pos/shift-bar.tsx`
- `components/ui/button.tsx`
- `components/ui/table.tsx`
- `lib/motion/presets.ts`

`app/(pos)/dashboard/page.tsx` also reads today’s repair payments so the dashboard can split retail and repair. That is a read for display. Sale, stock, and repair writes are unchanged.

## 9. Testing

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | Passed |
| `npm test` | 13 passed |
| `npm run lint` | Passed, 0 errors, 4 existing warnings |
| `npm run build` | Passed |

Browser check on the running app, signed in as admin:

- Dashboard shows the new sidebar, search, shift, four KPI cards, the week chart, low stock, and open repairs with estimates.
- Checkout renders the cart column and payment area. The first paint no longer claims the catalog is empty before products load.
- A full sale was not completed in this pass, so cart math was not re-proven in the browser. The handlers were not changed.

## 10. Remaining UI issues

These screens sit in the new shell, but their interiors are not yet at the same level as the dashboard:

- Staff editing is still a form on the page, not a drawer, and there is no last-activity column because the data model does not store it.
- Settings is one scrolling form, not General / Branding / Receipt / Repairs / Printing tabs, and it does not yet show an unsaved-changes state.
- Stock adjustment already previews the resulting quantity. It is not a stepped review flow.
- Reports still use the previous chart cards. Average ticket and top products are not on the page.
- Repair columns still use the earlier card chrome. Status changes are not layout-animated between columns because the board updates by refetch, not drag-and-drop.
- Inventory, product create, and several forms were not rebuilt onto `DataTable` and `FormSection`.
- Checkout product cards do not yet show a category name or a thumbnail. Products have no storefront image in the picker payload.
- The week chart still uses pill bars. Two weekday labels can sit close to the edge on a short viewport.
- Not every empty state uses the shared `EmptyState` component yet.

The shell, dashboard, checkout payment and total, sales ledger, and category manager are the screens that now read as one product. The remaining interiors should be brought onto `design.tsx` before calling the whole app visually finished.
