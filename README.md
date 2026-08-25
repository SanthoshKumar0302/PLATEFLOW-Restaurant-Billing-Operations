# PlateFlow • Restaurant Billing Operations

**A recruiter-grade React/Vite/Tailwind frontend for a Java Core/Collections-based restaurant billing engine.**

PlateFlow provides a command console interface showcasing Java OOP principles, Collections Framework, `Comparable<Dish>` natural ordering, custom `InvalidQuantity` exception handling, and automated testing (11/11 Java test cases & 26 Vitest tests) through an elegant, modern billing dashboard.

---

## 🎯 Project Overview

PlateFlow is a portfolio-quality frontend that visually and architecturally maps to a Java restaurant billing engine. It demonstrates:

- **Java Architecture Mapping**: Collections Framework, `Comparable<Dish>` price interface, `InvalidQuantity` custom exception guard, and automated test suite integration.
- **React 18 Architecture**: Clean component hierarchy, centralized state, localStorage persistence, and responsive routing.
- **Visual Excellence**: Professional dark-graphite interface with warm ivory text and gold accents (`#d4a574`).
- **Offline & PWA Support**: Service worker caching and installable Web App Manifest for complete offline reliability.
- **Automated Testing**: 26 automated unit, component, and end-to-end flow tests via Vitest & Testing Library.

---

## ✨ Core Differentiators

### 1. **ORDER PULSE**
A dynamic 5-stage transaction timeline (*Order Created → Dishes Added → Quantity Verified → Total Calculated → Bill Generated*) that visually advances with real order state and allows direct stage navigation.

### 2. **BILL DNA**
An expandable card displaying a live cryptographic hash checksum and chromatic 12-block DNA map dynamically generated from the active order's plate count and total amount.

### 3. **QUANTITY GUARD**
A protective UI modal and shake animation that actively intercepts invalid state (negative quantities, exceeding available plates, or exceeding plate limits), modeling Java's custom `InvalidQuantity` RuntimeException.

### 4. **COMPARABLE MODE**
An indicator badge in the Dish Explorer that activates when sorting dishes by price (Ascending / Descending), visualizing the Java `Comparable<Dish>` interface.

---

## 📱 Application Screens (All 7 Pages)

1. **Operations Console** (`/`) — Landing dashboard featuring ORDER PULSE, BILL DNA, live financial metric cards, Engine Architecture breakdown, and live network/sync indicators.
2. **Dish Explorer** (`dishes`) — Case-insensitive search, Comparable price sort, dish tiles with quantity +/- controls, and hotel admin menu controls.
3. **Active Bill** (`bill`) — Itemized plate breakdown, +/- controls, line totals, BillSummary (SGST 5% + CGST 5%), and empty-state navigation.
4. **Bill Preview** (`preview`) — Official tax invoice with order reference, date, time, GSTIN, print styling (`window.print()`), and client-side PDF export (`jspdf` + `html2canvas`).
5. **Order History** (`history`) — Searchable transaction ledger of completed orders with computed summary metrics (Total Orders, Total Plates, Total Revenue).
6. **System Insights** (`insights`) — Analytics dashboard computing average order value, most ordered dish, highest value dish, and system health.
7. **Reliability Center** (`reliability`) — Interactive 11/11 Java Engine test suite with real-time test execution and pass/fail attestation.

---

## 🛠️ Technology Stack

- **Frontend**: React 18.2, Vite 4.4, Modern ES6+ JavaScript
- **Styling**: Tailwind CSS 3.3, PostCSS, Custom Keyframe Animations (`shake`, `slideIn`, `fadeIn`, `pulse`)
- **Icons**: Lucide React
- **Document Export**: jsPDF, html2canvas
- **Testing**: Vitest 4.1, `@testing-library/react`, `@testing-library/jest-dom`, jsdom
- **PWA / Offline**: Service Worker (`sw.js`), Web App Manifest (`manifest.json`)

---

## 📦 Installation & Running

```bash
# Navigate to project directory
cd plateflow-frontend

# Install dependencies
npm install

# Run automated tests (26/26 passing)
npm test

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🧪 Automated Testing Suite

The project includes 26 automated tests covering unit logic, component behavior, and end-to-end user flows:

- **Unit Tests (`src/__tests__/billingEngine.test.js`)**:
  - Dish constructor and `toString()` formatting.
  - `Comparable<Dish>` natural price sorting.
  - Tax calculations: Subtotal, SGST (5%), CGST (5%), and Grand Total.
  - `InvalidQuantityError` and QuantityGuard validation rules.
  - Bill DNA 14-character checksum generation.
  - Case-insensitive dish search and price sorting.
  - **11/11 Java Engine Test Cases** mirroring `TestAll.java`.
- **Component Tests (`src/__tests__/components.test.jsx`)**:
  - `DishTile` +/- quantity buttons, inventory tagging, and add to order.
  - `BillItem` line total calculations and item removal.
  - `QuantityGuard` modal with available vs requested counts and BLOCKED status.
  - `Toast` notification rendering and auto-dismiss.
  - `OrderPulse` 5-stage progression.
  - `BillDNA` checksum hash and chromatic block map rendering.
- **End-to-End Flow Test (`src/__tests__/flow.test.jsx`)**:
  - Simulates the entire lifecycle: *Ops → Dish Explorer → Active Bill → Quantity Guard Intercept → Bill Generation → Order History → System Insights*.

---

## 🔗 Java Backend Alignment

| Java Backend Component | Frontend UI Implementation | Behavioral Mapping |
|------------------------|----------------------------|--------------------|
| `Dish.java` | `DishTile.jsx` / `DishExplorer.jsx` | Dish model with name, price, description, and inventory tagging |
| `Dish.compareTo()` | `COMPARABLE MODE` Sort in `DishExplorer.jsx` | Natural price ordering (`Comparable<Dish>`) |
| `Bill.java` (`addDish`) | Add to Order & Quantity Controls | Adding items, incrementing quantity, updating subtotal |
| `Bill.java` (`removeDish`) | Remove Button & `-` controls | Plate decrement and dish removal from order |
| `InvalidQuantity.java` | `QuantityGuard.jsx` | Modal shield blocking negative quantities and excess removal |
| `Bill.java` (`calculateTotal`) | `BillSummary.jsx` | Subtotal + SGST 5% + CGST 5% + Grand Total |
| `Bill.java` (`generateBill`) | `BillPreview.jsx` | Official tax invoice with print & PDF generation |
| `TestAll.java` (11 Tests) | `ReliabilityCenter.jsx` | 11 automated test verification runner with 100% success rate |

---

## 📱 Responsive Layout

- **Desktop (≥1440px)**: Full layout with left sidebar, workspace, metrics grid, and detailed summaries.
- **Tablet (768px–1439px)**: Responsive multi-column grid with collapsible navigation.
- **Mobile (<768px)**: Single-column layout with 48px+ touch targets and fixed bottom navigation bar (`MobileNav`).

---

## 🌐 Offline & PWA Capabilities

1. **Installable PWA**: Configured with `manifest.json` and theme colors.
2. **Offline Pre-caching**: Service worker (`sw.js`) caches app shell and assets.
3. **Client-Side PDF Export**: Generates and downloads PDFs without external network calls.
4. **Live Connectivity Indicator**: TopBar displays "Online" vs "Offline — Changes Saved Locally" via `navigator.onLine`.

---

## 📌 Known Limitations

- **Java Microservice**: This repository provides a browser-based, recruiter-grade frontend that models the Java billing engine architecture with deterministic client-side logic and `localStorage` persistence. It does not require a running JVM server or external database to operate.

---

**PlateFlow • Java Billing Operations Frontend • v1.0**
