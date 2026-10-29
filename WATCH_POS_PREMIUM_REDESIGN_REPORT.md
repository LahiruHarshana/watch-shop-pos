# Watch POS premium redesign

## 1. Design concept

The interface is now an atelier operations desk: a warm stone canvas, an ink navigation rail, and Instrument Serif headlines over Plus Jakarta Sans. Brand indigo is reserved for actions, links, and the current chart bar. A brass hairline marks the active nav item and low-stock rows. Checkout’s cart is a dark ticket, so the sale total reads like a receipt rather than another white card.

Routes, APIs, permissions, money math, and form behavior are unchanged.

## 2. Design system

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#f3efe8` | App background, with a faint indigo wash at the top right |
| Surface | `#fffcf8` | Cards, tables, inputs |
| Ink | `#141218` | Sidebar, dashboard hero, checkout ticket |
| Ivory | `#f6f1ea` | Type and buttons on ink |
| Brand | `#3d35c4` | Primary actions and today’s chart bar |
| Brass | `#b08968` | Active nav mark, low-stock edge |
| Muted text | `#6f675e` | Labels and helper copy |
| Radius | `0.85rem` base, 20–24px panels | Cards and the ticket |
| Shadows | layered warm shadows | Surface, raised, floating |

Display type is Instrument Serif at weight 400 on every `h1` and on large money figures. UI text stays Plus Jakarta Sans. Amounts use tabular numerals.

Shared surfaces: `.pos-surface` and `.pos-ink`.

## 3. Motion system

Framer Motion still drives page enter (`pos-shell`), dashboard section reveal, chart bar growth, checkout product and cart line motion, category pill layout, and repair column entrance. Hover lift stays on product tiles, repair cards, and shortcuts. `useReducedMotion` skips those entrance offsets. A global `prefers-reduced-motion` rule collapses CSS animation and transition duration.

## 4. Screens redesigned

- **Login.** Split brand panel and sign-in card. The headline now uses the display face.
- **Shell.** Dark grouped sidebar, ivory mark, account card, command-style search, shift chip, and New sale.
- **Dashboard.** Ink welcome panel with today’s total, retail / repairs / open jobs, ink activity bars, low-stock list, repair cards, and shortcut tiles.
- **Checkout.** Editorial title, catalog tiles with SKU, name, category, price, and stock, and a dark ticket with payment chips.
- **Sales.** Display title, filter tray, and the existing ledger table on the new surface.
- **Repairs, inventory, categories, stock, reports, settings, staff, product forms.** Display titles and the shared stone / surface system. Product form sections use `.pos-surface`. Report mix bar is solid brand and emerald.

## 5. UX improvements

- The active page is obvious in the dark rail.
- Today’s money is the first number on the dashboard, with retail and repairs separated underneath.
- Checkout search, categories, stock, and price sit on the tile. The total sits on the dark ticket.
- Low stock is a list with the quantity and threshold, linked to the product.
- Page titles share one scale, so moving between modules feels like one product.

## 6. Components created or refactored

- `app/globals.css` tokens, `.pos-ink`, display face
- `app/layout.tsx` Instrument Serif
- `components/pos/pos-shell.tsx`
- `components/pos/dashboard-home.tsx`
- `components/pos/checkout-client.tsx` catalog tile and ticket
- `components/pos/page-header.tsx`
- `components/pos/product-form.tsx` section surface
- Page titles on sales, repairs, inventory, categories, stock, reports, settings, and staff

`components/pos/design.tsx` (`PageMotion`, `SectionHeader`, `MetricCard`, `EmptyState`) and `lib/motion/presets.ts` remain the motion helpers.

## 7. Responsiveness

Desktop is the primary layout. The sidebar hides below the `lg` breakpoint and opens from the menu sheet, using the same dark nav. The dashboard hero and checkout ticket stack when the grid collapses. At a 1920px layout width, checkout and sales did not overflow the document.

## 8. Accessibility

Focus rings stay on the brand outline. Search, payment tabs, and the password toggle keep their labels. Error and change amounts stay in live regions. Reduced motion is respected in CSS and in the Framer hooks on the dashboard, checkout, and shell.

## 9. Files changed for this visual pass

- `app/globals.css`
- `app/layout.tsx`
- `app/login/page.tsx`
- `components/auth/login-brand.tsx`
- `components/auth/login-form.tsx`
- `components/pos/pos-shell.tsx`
- `components/pos/dashboard-home.tsx`
- `components/pos/checkout-client.tsx`
- `components/pos/sales-history.tsx`
- `components/pos/repairs-board.tsx`
- `components/pos/products-admin.tsx`
- `components/pos/categories-admin.tsx`
- `components/pos/stock-adjustments-form.tsx`
- `components/pos/daily-report.tsx`
- `components/pos/settings-form.tsx`
- `components/pos/users-admin.tsx`
- `components/pos/product-form.tsx`
- `components/pos/page-header.tsx`
- `components/pos/design.tsx`
- `lib/motion/presets.ts`

## 10. Testing

- `npx tsc --noEmit` passed.
- `npm run lint` passed with the same four existing warnings (`jsonError`, unused `_`, mongoose eslint-disable, `productsBySku`). No new warnings.
- `npm run build` passed.
- Browser: signed in and reviewed dashboard, checkout, and sales. Dashboard hero total is fully visible. Checkout shows catalog tiles and the dark ticket. Sales filters and invoice rows render. A dev overlay appeared while the browser tool was attached; the diff was `data-cursor-ref` injected by that tool.

## 11. Remaining UI gaps

- Staff is still a list beside the create and edit form, not a drawer.
- Settings is still one configuration form, not tabbed groups, and the receipt preview was not rebuilt.
- Inventory, repairs, and reports use the new type and surfaces. Their tables, kanban columns, and charts were not rebuilt as new components.
- Modals, toasts, and drawers inherit tokens. They were not redesigned as separate patterns.
- The activity chart labels the amount above each bar. It does not add a separate hover tooltip.
- Tablet widths were not screenshotted in this pass. The shell collapses the sidebar below `lg`.
