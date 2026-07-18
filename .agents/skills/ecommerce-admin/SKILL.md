---
name: ecommerce-admin
description: Essential features and best practices for building an effective e-commerce admin panel/dashboard.
---

# E-Commerce Admin Panel Guidelines

This skill provides a comprehensive baseline for the essential features required in an e-commerce admin panel. It should be used to audit and build the admin dashboard and related pages to ensure no critical features are missing.

## Core Management Modules

1. **Product Management**
   - **CRUD Operations**: Tools to easily add, edit, or **remove/delete** product listings.
   - **Details Management**: Ability to manage product descriptions, images, pricing (base and sale prices), variants (size, color, SKU), and categories.
   - **Bulk Actions**: Bulk updating for statuses, categories, and discounts.

2. **Order Management System (OMS)**
   - **Lifecycle Tracking**: Track, process, and fulfill orders from receipt to shipment.
   - **Status Updates**: Provide status updates for every stage of the order lifecycle (e.g., Pending, Processing, Shipped, Delivered, Cancelled).
   - **Returns & Refunds**: Manage order cancellations and returns smoothly.

3. **Inventory Control**
   - **Real-Time Tracking**: Monitor stock levels per variant.
   - **Alerts**: Automated alerts for low inventory to prevent stockouts.
   - **Restocking**: Tools for managing purchase orders and restocking flows.

4. **Customer & Staff Management**
   - **Customer Database**: Track customer interactions, profiles, support queries, and purchase history.
   - **Staff/Role Management**: Role-Based Access Control (RBAC) to add staff and assign specific permissions (e.g., Admin, Manager, Support, Editor) so they only access necessary data.

## Analytics & Reporting

1. **Real-Time Performance Snapshot (Dashboard)**
   - High-level overview of key metrics: total sales, revenue, conversion rates, and active/pending orders.
   - Quick links to common actions (e.g., Add Product, Fulfill Order).

2. **Comprehensive Reporting**
   - Data visualization (charts/graphs) for analyzing sales trends.
   - Tracking top-performing products, marketing campaign ROI, and traffic sources.

3. **Customer Insights**
   - Metrics like Customer Lifetime Value (CLV), retention rates, and cart abandonment rates.

## Technical Best Practices

1. **Security & Validation**
   - Delete operations must always have **confirmation dialogues** (e.g., AlertDialog) to prevent accidental data loss.
   - Role-based restrictions to protect sensitive business and customer information.

2. **User Experience (UX)**
   - **Mobile Responsiveness**: Design that works seamlessly across smartphones and tablets.
   - **Search & Navigation**: Intuitive, powerful search tools for finding products, orders, and users quickly.
   - **Unified Interface**: Avoid data silos; integrate marketing, inventory, and sales data cleanly.
