---
name: Handloom Nexus Fixes
overview: A comprehensive plan to fix marquee, buyer-home hero UX, product page mock data, admin features (users/sarees/report PDF), 403 API errors, image upload UX, weaver registration toast, missing profile route, sidebar + responsive layout, fashion e-commerce home page redesign, and deep seller (weaver) experience.
todos: []
isProject: false
---

# Handloom Weavers Nexus - Comprehensive Fix Plan

## 1. Marquee: Slow, Smooth, and Remove Close Button

**Files:** [public/pages/buyer-home.html](public/pages/buyer-home.html), [public/css/pages.css](public/css/pages.css), [public/js/pages/buyer-home.js](public/js/pages/buyer-home.js)

- Remove the close button (×) from [line 22](public/pages/buyer-home.html) of `buyer-home.html`
- Make marquee slower and smoother:
  - In `pages.css`: change default animation from `20s` to `35s`, add `animation-timing-function: ease-in-out` for smoothness (lines 503-531)
  - In `buyer-home.js`: set default `marquee_speed` to `'slow'` (line 52)
- Remove close-button click handler and `offer_banner_closed` localStorage logic from `buyer-home.js` (lines 63-76)

---

## 2. Buyer Home Hero: Start Shopping / Login and Logged-in User Behavior

**File:** [public/pages/buyer-home.html](public/pages/buyer-home.html), [public/js/pages/buyer-home.js](public/js/pages/buyer-home.js)

- **Current:** "Start Shopping" links to register, "Login" links to login; both always shown
- **Requested behavior:**
  - Guest: "Start Shopping" → `/pages/register.html`; show both Register and Login
  - Logged-in user: hide the hero CTA section or show different content (e.g. "Continue Shopping" → buyer-home)
- Add client-side check in `buyer-home.js` after `auth.checkAuth(false)`: if `user` exists, hide hero section (or replace with role-specific CTA)

---

## 3. Product Page (saree-detail): Fix Mock/Hardcoded Data

**File:** [public/pages/saree-detail.html](public/pages/saree-detail.html)

- **Discount:** Shipping section shows "Discount" with wrong format: `${saree.offer.value + (saree.offer.type === 'percentage' ? '%' : '₹')}` (line 379) — fix to show correct formatted discount (e.g. "2000₹ OFF" or "20% OFF")
- **Delivery time:** "Order in 02:30:25 to get next day delivery" — hardcoded; remove or derive from real data
- **Estimation arrive:** "10-12 October 2024" — hardcoded; compute from current date + delivery days (e.g. 3–4 working days)
- Use `saree` data for pricing, discount, and shipping instead of mock values

---

## 4. Admin Report PDF: Professional Layout

**File:** [public/pages/admin-report.html](public/pages/admin-report.html)

- Current "Download PDF" calls `window.print()` only
- Add print-specific CSS: logo/branding, page breaks, margins, table styling, footer with timestamp and page numbers
- Consider using a PDF library (e.g. jsPDF + html2canvas) for a proper PDF export, or improve print styles so `window.print()` produces a professional layout

---

## 5. Admin Users: Suspend, Reactivate, Edit User

**File:** [public/pages/admin-users.html](public/pages/admin-users.html), [controllers/admin.controller.js](controllers/admin.controller.js), [routes/admin.routes.js](routes/admin.routes.js)

- **Suspend/Reactivation:** Add `is_suspended` (or equivalent) in DB and backend:
  - Admin controller: `suspendUser` should set `is_suspended = 1`; add `reactivateUser` (or `PUT /users/:id/unsuspend`) to clear suspension
  - UI: For suspended users, show "Reactivate" instead of "Suspend"
- **Edit user:** "Edit user feature coming soon" — either implement a simple edit modal (name, email, phone) with `PUT /api/admin/users/:id` or keep toast but clarify "Coming soon"

---

## 6. Admin Sarees: Reactivate Deactivated Saree

**File:** [public/pages/admin-sarees.html](public/pages/admin-sarees.html), [controllers/admin.controller.js](controllers/admin.controller.js), [routes/admin.routes.js](routes/admin.routes.js)

- Add `PUT /api/admin/sarees/:id/activate` (or `reactivate`) to set `isActive = true`
- Add "Reactivate" button for inactive sarees (currently only "Deactivate" for active sarees)
- Update `deactivateSaree` and new `activateSaree` in admin controller

---

## 7. 403 Forbidden Errors - Root Causes and Fixes

**Affected endpoints:** `/api/notifications/unread-count`, `/api/weaver/`*, `/api/cart`, `/api/orders`, `/api/users/profile`, etc.

**Analysis:**

- `/api/notifications/unread-count`: Intended to be public (return 0 for guests). It is registered before protected routes in [server.js](server.js). Verify it is not being matched by another router and returns `{ count: 0 }` for unauthenticated users.
- Weaver 403: `requireWeaverApproved` and weaver controller check `is_approved`. Pending weavers get 403. Solution: show a clear "Pending approval" page instead of redirecting to dashboard that fails.
- Cart/Orders 403: Require auth + `requireRole('buyer','admin','weaver')`. Guests correctly get 401/403 — suppress noisy logs and ensure guest-friendly UI.
- **Profile 403:** `PUT /api/users/profile` is **missing** in routes; requests fall through to routers that return 403 when role check fails. Add user profile route.

**Actions:**

1. Add `PUT /api/users/profile` (and `POST /api/users/avatar` if used) — new user routes or extend auth routes
2. Ensure `/api/notifications/unread-count` is registered **before** any `app.use('/api', ...)` routers so it always matches first
3. For pending weavers: show a dedicated "pending approval" view when dashboard returns 403, instead of generic error

---

## 8. Weaver Story: Images Not Clickable, Support Multiple Images/Videos

**Files:** [public/pages/weaver-story.html](public/pages/weaver-story.html), [middleware/upload.js](middleware/upload.js), weaver story controller

- **File input not clickable:** [pages.css](public/css/pages.css) uses `.file-upload input[type="file"] { display: none }` with label for click — ensure `for` and `id` match; add `cursor: pointer` to the label
- **Multiple media:** Current backend uses `uploadStoryMedia.single('media')` — support multiple images/videos (e.g. `uploadStoryMedia.array('media', 5)`) if desired
- Fix label/input association so the file area is clearly clickable (e.g. wrap in a styled div with `onclick` on the label)

---

## 9. Weaver Upload: Multiple Images Clickable

**File:** [public/pages/weaver-upload.html](public/pages/weaver-upload.html)

- Same file-upload styling issue: `input` is `display:none`; ensure label `for="images"` matches `id="images"` and the label covers the clickable area
- The input already has `multiple` — verify Multer config accepts multiple files (`uploadSareeImages.array('images', 5)` in weaver routes)
- Add visual feedback (border highlight, hover) when hovering over the upload zone

---

## 10. Weaver Registration: Admin Approval Toast

**File:** [public/pages/register.html](public/pages/register.html)

- On successful registration with `role === 'weaver'`, show toast: "Account created! Please wait for admin approval before you can sell sarees." (instead of generic success and redirect to login)
- Use `notifications.showToast('info', 'Pending Approval', '...')` and optionally delay redirect to login

---

## 11. Wishlist: "Coming Soon" Placeholder

**File:** [public/pages/saree-detail.html](public/pages/saree-detail.html)

- Current: `toggleWishlist()` shows "Wishlist feature coming soon!" — acceptable placeholder
- Option: Improve message or add a brief "We're working on it" note if needed; no backend change required for now

---

## 12. Sidebar Open/Close, Responsive, Attached to Header and Main

**Reference layout:** [Fashion E-Commerce Landing Page](https://dribbble.com/shots/26777874-Fashion-E-Commerce-Landing-Page-Website)

**Current state:** Sidebar is fixed; main-content has `margin-left`. Sidebar only shows for logged-in users. Toggle exists but `sidebar-toggle` has `display: none` by default and only shows on mobile.

**Target:**

1. **App shell structure** — Wrap header, sidebar, and main in a shared container:

```html
   <div class="app-shell">
     <header class="header">...</header>
     <aside class="sidebar" id="sidebar">...</aside>
     <main class="main-content">...</main>
   </div>
   <footer>...</footer>
   

```

- Use CSS Grid or Flex so sidebar and main are siblings under the same shell.
- Sidebar is visually "attached" to header (below it) and main (beside it).

1. **Sidebar toggle** — Always visible when sidebar exists:
  - Mobile: hamburger icon in header opens sidebar as slide-over overlay; backdrop to close.
  - Desktop: collapsible sidebar (narrow icon-only) with toggle button.
  - Ensure `sidebar-toggle` is shown and works on all breakpoints.
2. **Responsive behavior:**
  - Mobile (<768px): sidebar off-canvas, full-width main, hamburger in header.
  - Tablet/Desktop: sidebar visible or collapsed; main adjusts `margin-left` accordingly.
  - Use CSS variables for sidebar width; smooth transitions.
3. **Guests** — Current: no sidebar for guests. Option: show sidebar with limited items (Browse, Login, Register) or keep no-sidebar and rely on header nav. If header gets horizontal nav (HOME, SHOP, etc.), guests may not need a sidebar.

**Files:** [public/pages/buyer-home.html](public/pages/buyer-home.html) (and shared layout pages), [public/css/layout.css](public/css/layout.css), [public/js/components.js](public/js/components.js)

---

## 13. Home Page Redesign — Fashion E-Commerce Layout

**Reference:** [Dribbble - Fashion E-Commerce Landing Page](https://dribbble.com/shots/26777874-Fashion-E-Commerce-Landing-Page-Website)

Replicate the structure and aesthetics:


| Section               | Implementation                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Top bar**           | Thin black strip for promos/announcements (optional; can reuse marquee)                                                                                                |
| **Header**            | Logo left, search center, nav links (Home, Shop, Category, Contact, About), cart + user icons right. Gold-brown accents on active/hover.                               |
| **Hero**              | Large title "Aesthetic Collections" (or Handloom equivalent) with accent color on "Collections"; subtitle; image carousel of featured sarees; circular "Shop Now" CTA. |
| **Top Categories**    | "Top Categories Collections" title; category grid with arrow icons; cream/light grey background.                                                                       |
| **Featured products** | "Explore Our Newest Products" title; optional promo banner; tabs: Featured, New Arrivals, Best Seller; product grid (4 columns, image + name + price, wishlist icon).  |
| **Key benefits**      | Horizontal strip: Flexible price, Customer support, 100% secure — each with icon.                                                                                      |
| **Newsletter**        | "Subscribe to Newsletter" section with email input and Subscribe button.                                                                                               |
| **Footer**            | Logo, links, contact, copyright.                                                                                                                                       |


**Color palette:** Cream (#F5F0E8), light grey (#E8E4DF), white, gold-brown accents (#B8860B or similar). Elegant serif/display font for headings.

**Files:** [public/pages/buyer-home.html](public/pages/buyer-home.html), [public/css/pages.css](public/css/pages.css), [public/css/variables.css](public/css/variables.css), [public/js/pages/buyer-home.js](public/js/pages/buyer-home.js)

---

## 14. Seller (Weaver) Experience — Deep Implementation

**Current:** Basic dashboard, upload saree, upload story, sales report, edit saree. Sparse UI and limited workflow.

**Target — Full seller journey:**

1. **Weaver Dashboard (enriched)**
  - Stats cards: Total Sarees, Pending Orders, Revenue (this month), Low Stock alerts.
  - Quick actions: Add Saree, View Orders.
  - Recent orders table with status, buyer, amount, actions.
  - Low-stock warning list.
  - Optional: simple revenue chart (last 7/30 days).
2. **Product (Saree) Management**
  - Dedicated page: list all weaver sarees with filters (category, status), search.
  - Each row: image, title, price, stock, status (pending/approved), actions (Edit, Deactivate, View).
  - Bulk actions: Approve (if admin), export.
  - Link from sidebar: "My Sarees" (new page or expand dashboard).
3. **Order Management**
  - Page: "My Orders" — list orders for weaver's sarees.
  - Columns: Order ID, Buyer, Items, Amount, Status, Date.
  - Actions: Mark Shipped, Update Status.
  - Filter by status (pending, shipped, delivered).
4. **Sales Report & Analytics**
  - Improve existing weaver-sales-report: revenue by period, units sold, top products.
  - Add date range picker, export CSV.
5. **Weaver Profile / Storefront**
  - Public weaver profile page: bio, region, featured sarees, all products.
  - Edit profile: name, bio, region, avatar (if route exists).
6. **Pending Approval State**
  - When `is_approved = 0`: dedicated "Pending Approval" view instead of broken dashboard.
  - Message: "Your account is under review. We'll notify you when approved."
  - Hide upload/edit actions until approved.

**Backend:** Ensure APIs exist for weaver orders list, weaver profile, and status updates. Add `GET /api/weaver/orders` if missing.

**Files:** New/updated: [public/pages/weaver-dashboard.html](public/pages/weaver-dashboard.html), [public/pages/weaver-sarees.html](public/pages/weaver-sarees.html) (new), [public/pages/weaver-orders.html](public/pages/weaver-orders.html) (new), [public/pages/weaver-sales-report.html](public/pages/weaver-sales-report.html), [public/js/pages/weaver-dashboard.js](public/js/pages/weaver-dashboard.js), weaver controller and routes.

---

## Implementation Priority


| Priority | Item                                                                   | Effort |
| -------- | ---------------------------------------------------------------------- | ------ |
| High     | Add `/api/users/profile` route (fix 403)                               | Small  |
| High     | Marquee slow + smooth + remove X                                       | Small  |
| High     | Fix notification/cart 403 for guests (route order + graceful handling) | Small  |
| High     | Product page real data (discount, delivery, estimation)                | Medium |
| High     | Buyer home hero for logged-in vs guest                                 | Small  |
| High     | Sidebar open/close, responsive, app-shell layout                       | Medium |
| High     | Home page redesign (fashion e-commerce layout)                         | Large  |
| High     | Seller (weaver) experience — deep implementation                       | Large  |
| Medium   | Admin sarees: Reactivate button + API                                  | Small  |
| Medium   | Admin users: Suspend/Reactivate + Edit                                 | Medium |
| Medium   | Weaver registration toast                                              | Small  |
| Medium   | File upload clickable (weaver-upload, weaver-story)                    | Small  |
| Low      | Admin report PDF professional layout                                   | Medium |
| Low      | Weaver story multiple images (if required)                             | Medium |


