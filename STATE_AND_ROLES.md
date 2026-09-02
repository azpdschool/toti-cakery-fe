# State Management & Role-Based Access Control (RBAC)

## Global Contexts

### AuthContext (`src/context/AuthContext.tsx`)
* **State**: `user` (Object | null), `token` (String | null), `isAuthenticated` (Boolean)
* **Storage**: Store JWT access token di `localStorage` dengan key `toti_auth_token`.

### CartContext (`src/context/CartContext.tsx`)
* **State**: `cartItems` (Array), `totalPrice` (Number)
* **Storage**: Persist keranjang belanja di `localStorage` dengan key `toti_cart_data`.

## User Roles & Route Protection

| Role | Access Level | Protected Routes |
| :--- | :--- | :--- |
| `GUEST` | Unauthenticated | `/`, `/catalog`, `/login`, `/register` |
| `BUYER` | Authenticated Customer | `/checkout`, `/orders`, `/profile` |
| `SELLER` / `ADMIN` | Staff Management | `/admin/dashboard`, `/admin/products`, `/admin/finance` |

* **Route Guard**: Dikelola oleh `ProtectedRoute` component di `src/router/index.tsx`.