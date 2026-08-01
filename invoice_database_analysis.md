# Supabase Database Analysis for Online Invoice

## 1. Database Overview
This report analyzes the existing PostgreSQL database (hosted on Supabase) for the Lilviaa project. The goal is to identify how current tables and relationships map to the data required for generating an Online Order Invoice, and to highlight any structural gaps.

---

## 2. Table-by-Table Explanation

### Customer Information
Customer details are split across three primary tables:

*   **`public.users`** (Extends Supabase `auth.users`)
    *   `id` (UUID) - Links to auth.users
    *   `email` (TEXT) - Customer's Email
*   **`public.user_profiles`**
    *   `user_id` (UUID) - Foreign Key to `users`
    *   `full_name` (TEXT) - Customer Name
    *   `phone` (TEXT) - Customer Phone Number
*   **`public.addresses`**
    *   `id` (UUID)
    *   `user_id` (UUID) - Foreign Key to `users`
    *   `full_name` (TEXT)
    *   `phone` (TEXT)
    *   `address` (TEXT) - Shipping/Billing Address line
    *   `city` (TEXT)
    *   `state` (TEXT)
    *   `zip` (TEXT) - Pincode

### Order Information
Order-level data is stored across two tables:

*   **`public.orders`**
    *   `id` (UUID) - Order ID (Internal Database ID, not a formatted Invoice Number)
    *   `user_id` (UUID) - Links to Customer
    *   `created_at` (TIMESTAMPTZ) - Order Date
    *   `status` (TEXT) - Order/Shipping Status (`pending`, `processing`, `shipped`, `delivered`, etc.)
    *   `payment_method` (TEXT) - Payment Method (`upi`, `card`, `netbanking`, `cod`)
    *   `total_amount` (NUMERIC) - Grand Total
    *   `shipping_amount` (NUMERIC) - Shipping Charge
    *   `shipping_address_id` (UUID) - Links to `addresses` table
*   **`public.payment_transactions`**
    *   `order_id` (UUID) - Links to `orders`
    *   `razorpay_order_id` (TEXT) - Razorpay Order reference
    *   `razorpay_payment_id` (TEXT) - Razorpay Payment ID reference
    *   `status` (TEXT) - Payment Status (`pending`, `successful`, `failed`, `refunded`)

### Order Items
The individual products purchased within an order are stored here:

*   **`public.order_items`**
    *   `id` (UUID)
    *   `order_id` (UUID) - Links to `orders`
    *   `product_variant_id` (UUID) - Links to `product_variants`
    *   `quantity` (INTEGER) - Quantity Purchased
    *   `unit_price` (NUMERIC) - Price per unit
    *   `total_price` (NUMERIC) - Line total

### Product Information
Product details are split into base products and variants (SKUs):

*   **`public.products`**
    *   `id` (UUID)
    *   `name` (TEXT) - Product Name
    *   `category` (TEXT) - Product Category
*   **`public.product_variants`**
    *   `id` (UUID)
    *   `product_id` (UUID) - Links to `products`
    *   `sku` (TEXT) - SKU number
    *   `size` (TEXT) - Size
    *   `color` (TEXT) - Color

### Company Information
**No Company Details table exists.** 
There is currently no table in the Supabase schema storing the business's metadata (Company Name, Logo URL, GST Number, Address, Website, etc.).

---

## 3. Relationships

The database utilizes a standard relational structure:

**Customers** (`users` & `user_profiles`)
&nbsp;&nbsp;↓ *(1-to-Many)*
**Addresses** (`addresses`) & **Orders** (`orders`)
&nbsp;&nbsp;↓ *(1-to-Many)*
**Order Items** (`order_items`) & **Payment Transactions** (`payment_transactions`)
&nbsp;&nbsp;↓ *(Many-to-1)*
**Product Variants** (`product_variants`)
&nbsp;&nbsp;↓ *(Many-to-1)*
**Products** (`products`)

To generate a complete invoice, a query must join `orders` → `users`/`user_profiles` → `addresses` → `payment_transactions` → `order_items` → `product_variants` → `products`.

---

## 4. Available vs. Missing Data for Invoice

### ✅ Available Data (Ready to use)
*   **Customer:** Name, Email, Phone, Shipping Address (City, State, Pincode)
*   **Order:** Order ID (UUID), Order Date, Payment Method, Order/Shipping Status, Grand Total, Shipping Charge
*   **Payment:** Payment Status, Razorpay Order & Payment IDs
*   **Items:** Product Name, SKU, Size, Color, Quantity, Unit Price, Line Total

### ❌ Missing Data (Needs to be added/calculated)
1.  **Invoice Number:** There is no dedicated sequential Invoice Number field in the `orders` table (only a UUID exists).
2.  **Billing Address:** The `orders` table only links to a `shipping_address_id`. There is no `billing_address_id` for cases where they differ.
3.  **Company Details:** Missing Company Name, Address, GST Number, Email, and Logo. (Usually stored in a `settings` or `company` table, or hardcoded in the frontend).
4.  **GST / Tax Amount:** No specific column in `orders` or `order_items` to store calculated Tax/GST amounts.
5.  **Discount Amount:** No dedicated column in the `orders` table to explicitly state the total discount applied to the invoice.
6.  **Subtotal:** Not stored in the `orders` table (though it can be dynamically calculated as `Sum(order_items.total_price)`).

---

## 5. Recommendations
*   **Add an `invoice_number` column** to the `orders` table with a sequential or formatted structure (e.g., `INV-2026-001`).
*   **Add financial breakdown columns** (`subtotal`, `discount_amount`, `tax_amount`) to the `orders` table to ensure historical invoices remain accurate even if product prices or tax rates change in the future.
*   **Add a `billing_address_id`** to the `orders` table if customers require separate billing and shipping addresses for B2B/tax purposes.
*   **Create a `company_settings` table** (or decide to hardcode company details in the frontend) to populate the invoice header.
