import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportItem, ReportOrderItem } from "./dashboard-api";

export type ColumnGroup = "default" | "customer" | "product" | "order";

export interface ReportColumnDef {
  id: string;
  label: string;
  group: ColumnGroup;
  defaultSelected: boolean;
  minWidth?: number;
  align?: "left" | "center" | "right";
  // Returns cell content for CSV and PDF. pdfNewline = true returns multiline string for PDF.
  getValue: (
    order: ReportItem,
    storeSettings?: { enableGst?: boolean; gstPercentage?: number },
    forPdf?: boolean
  ) => string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const datePart = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const timePart = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    return `${datePart} ${timePart}`;
  } catch {
    return dateStr;
  }
}

function formatNum(num?: number): string {
  return Number(num || 0).toFixed(2);
}

function getOrderItems(order: ReportItem): ReportOrderItem[] {
  if (order.orderItems && order.orderItems.length > 0) {
    return order.orderItems;
  }
  if (typeof order.items === "string" && order.items.trim()) {
    const parts = order.items.split(" | ");
    return parts.map((p) => ({
      productName: p,
      sku: "-",
      size: "-",
      quantity: 1,
      unitPrice: order.subtotal || order.total,
      totalPrice: order.subtotal || order.total
    }));
  }
  return [
    {
      productName: "Order Item",
      sku: "-",
      size: "-",
      quantity: 1,
      unitPrice: order.subtotal || order.total,
      totalPrice: order.subtotal || order.total
    }
  ];
}

function isGstActive(
  order: ReportItem,
  storeSettings?: { enableGst?: boolean; gstPercentage?: number }
): boolean {
  return Boolean(
    storeSettings?.enableGst ||
      (order.gstAmount !== undefined && Number(order.gstAmount) > 0) ||
      (order.gstPercentage !== undefined && Number(order.gstPercentage) > 0)
  );
}

function getOrderGstPct(
  order: ReportItem,
  storeSettings?: { enableGst?: boolean; gstPercentage?: number }
): number {
  if (order.gstPercentage !== undefined && Number(order.gstPercentage) > 0) {
    return Number(order.gstPercentage);
  }
  return Number(storeSettings?.gstPercentage ?? 0);
}

export const ALL_REPORT_COLUMNS: ReportColumnDef[] = [
  // ── GROUP A: Default Order Details (13 enabled by default) ──
  {
    id: "orderId",
    label: "Invoice No.",
    group: "default",
    defaultSelected: true,
    minWidth: 62,
    align: "center",
    getValue: (order) => order.orderId || order.displayId || "-"
  },
  {
    id: "orderDate",
    label: "Date",
    group: "default",
    defaultSelected: true,
    minWidth: 54,
    align: "center",
    getValue: (order) => formatDate(order.date || order.createdAt)
  },
  {
    id: "customerName",
    label: "Customer Name",
    group: "default",
    defaultSelected: true,
    minWidth: 70,
    align: "left",
    getValue: (order) => order.customerName || "Customer"
  },
  {
    id: "customerPhone",
    label: "Customer Phone",
    group: "default",
    defaultSelected: true,
    minWidth: 64,
    align: "center",
    getValue: (order) => order.customerPhone || "-"
  },
  {
    id: "customerEmail",
    label: "Customer Email",
    group: "default",
    defaultSelected: true,
    minWidth: 78,
    align: "left",
    getValue: (order) => order.customerEmail || "-"
  },
  {
    id: "productName",
    label: "Order Product Name",
    group: "default",
    defaultSelected: true,
    minWidth: 115,
    align: "left",
    getValue: (order, _, forPdf) => {
      const items = getOrderItems(order);
      const list = items.map((it) => `${it.productName}${it.size && it.size !== "Unknown" ? ` (${it.size})` : ""}`);
      return forPdf ? list.join("\n") : list.join(", ");
    }
  },
  {
    id: "productAmount",
    label: "Product Amount",
    group: "default",
    defaultSelected: true,
    minWidth: 50,
    align: "right",
    getValue: (order, _, forPdf) => {
      const amt = Number(order.subtotal || order.taxableAmount || (order.total - (order.shippingAmount || 0) - (order.gstAmount || 0)));
      return forPdf ? `Rs. ${formatNum(amt)}` : `₹${formatNum(amt)}`;
    }
  },
  {
    id: "gstRate",
    label: "GST %",
    group: "default",
    defaultSelected: true,
    minWidth: 35,
    align: "center",
    getValue: (order, storeSettings) => {
      const active = isGstActive(order, storeSettings);
      const pct = getOrderGstPct(order, storeSettings);
      return active ? `${pct}%` : "0%";
    }
  },
  {
    id: "gstAmount",
    label: "GST Amount",
    group: "default",
    defaultSelected: true,
    minWidth: 48,
    align: "right",
    getValue: (order, storeSettings, forPdf) => {
      const active = isGstActive(order, storeSettings);
      const amt = active ? Number(order.gstAmount || 0) : 0;
      return forPdf ? `Rs. ${formatNum(amt)}` : `₹${formatNum(amt)}`;
    }
  },
  {
    id: "shippingAmount",
    label: "Shipping Amount",
    group: "default",
    defaultSelected: true,
    minWidth: 48,
    align: "right",
    getValue: (order, _, forPdf) => {
      const amt = Number(order.shippingAmount || 0);
      return forPdf ? `Rs. ${formatNum(amt)}` : `₹${formatNum(amt)}`;
    }
  },
  {
    id: "state",
    label: "State",
    group: "default",
    defaultSelected: true,
    minWidth: 55,
    align: "left",
    getValue: (order) => order.state || "-"
  },
  {
    id: "totalAmount",
    label: "Total Amount",
    group: "default",
    defaultSelected: true,
    minWidth: 54,
    align: "right",
    getValue: (order, _, forPdf) => {
      const amt = Number(order.total || 0);
      return forPdf ? `Rs. ${formatNum(amt)}` : `₹${formatNum(amt)}`;
    }
  },
  {
    id: "paymentMethod",
    label: "Payment Method",
    group: "default",
    defaultSelected: true,
    minWidth: 44,
    align: "center",
    getValue: (order) => (order.paymentMethod || "online").toUpperCase()
  },

  // ── GROUP B: Optional Customer Details ──
  {
    id: "customerId",
    label: "Customer ID",
    group: "customer",
    defaultSelected: false,
    minWidth: 55,
    align: "center",
    getValue: (order) => (order.customerId ? (order.customerId.length > 8 ? `${order.customerId.slice(0, 8)}...` : order.customerId) : "-")
  },
  {
    id: "customerAddress",
    label: "Customer Address",
    group: "customer",
    defaultSelected: false,
    minWidth: 90,
    align: "left",
    getValue: (order) => order.customerAddress || "-"
  },
  {
    id: "city",
    label: "City",
    group: "customer",
    defaultSelected: false,
    minWidth: 50,
    align: "left",
    getValue: (order) => order.city || "-"
  },
  {
    id: "postalCode",
    label: "PIN Code",
    group: "customer",
    defaultSelected: false,
    minWidth: 45,
    align: "center",
    getValue: (order) => order.pincode || "-"
  },
  {
    id: "country",
    label: "Country",
    group: "customer",
    defaultSelected: false,
    minWidth: 45,
    align: "center",
    getValue: (order) => order.country || "India"
  },

  // ── GROUP C: Optional Product Details ──
  {
    id: "productSku",
    label: "Product SKU",
    group: "product",
    defaultSelected: false,
    minWidth: 55,
    align: "left",
    getValue: (order, _, forPdf) => {
      const items = getOrderItems(order);
      const list = items.map((it) => it.sku || "-");
      return forPdf ? list.join("\n") : list.join(", ");
    }
  },
  {
    id: "productVariant",
    label: "Product Variant",
    group: "product",
    defaultSelected: false,
    minWidth: 70,
    align: "left",
    getValue: (order, _, forPdf) => {
      const items = getOrderItems(order);
      const list = items.map((it) => (it.size ? `${it.productName} (${it.size})` : it.productName));
      return forPdf ? list.join("\n") : list.join(", ");
    }
  },
  {
    id: "productSize",
    label: "Size",
    group: "product",
    defaultSelected: false,
    minWidth: 45,
    align: "center",
    getValue: (order, _, forPdf) => {
      const items = getOrderItems(order);
      const list = items.map((it) => it.size || "-");
      return forPdf ? list.join("\n") : list.join(", ");
    }
  },
  {
    id: "productQuantity",
    label: "Quantity",
    group: "product",
    defaultSelected: false,
    minWidth: 40,
    align: "center",
    getValue: (order, _, forPdf) => {
      const items = getOrderItems(order);
      if (items.length === 1) return String(items[0].quantity);
      const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
      const list = items.map((it) => String(it.quantity));
      return forPdf ? `${list.join("\n")}\n(Tot: ${totalQty})` : `${list.join(", ")} (Total: ${totalQty})`;
    }
  },
  {
    id: "productUnitPrice",
    label: "Unit Price",
    group: "product",
    defaultSelected: false,
    minWidth: 50,
    align: "right",
    getValue: (order, _, forPdf) => {
      const items = getOrderItems(order);
      const prefix = forPdf ? "Rs. " : "₹";
      const list = items.map((it) => `${prefix}${formatNum(it.unitPrice)}`);
      return forPdf ? list.join("\n") : list.join(", ");
    }
  },
  {
    id: "productSubtotal",
    label: "Product Subtotal",
    group: "product",
    defaultSelected: false,
    minWidth: 50,
    align: "right",
    getValue: (order, _, forPdf) => {
      const items = getOrderItems(order);
      const prefix = forPdf ? "Rs. " : "₹";
      const list = items.map((it) => `${prefix}${formatNum(it.totalPrice)}`);
      return forPdf ? list.join("\n") : list.join(", ");
    }
  },
  {
    id: "productDiscount",
    label: "Discount Amount",
    group: "product",
    defaultSelected: false,
    minWidth: 45,
    align: "right",
    getValue: (order, _, forPdf) => {
      const amt = Number(order.discountAmount || 0);
      return forPdf ? `Rs. ${formatNum(amt)}` : `₹${formatNum(amt)}`;
    }
  },
  {
    id: "productGstRate",
    label: "Product GST Rate",
    group: "product",
    defaultSelected: false,
    minWidth: 45,
    align: "center",
    getValue: (order, storeSettings, forPdf) => {
      const items = getOrderItems(order);
      const active = isGstActive(order, storeSettings);
      const pct = getOrderGstPct(order, storeSettings);
      const rateStr = active ? `${pct}%` : "0%";
      const list = items.map((it) => it.gstRate || rateStr);
      return forPdf ? list.join("\n") : list.join(", ");
    }
  },
  {
    id: "productGstAmount",
    label: "Product GST Amount",
    group: "product",
    defaultSelected: false,
    minWidth: 50,
    align: "right",
    getValue: (order, storeSettings, forPdf) => {
      const items = getOrderItems(order);
      const active = isGstActive(order, storeSettings);
      const pct = getOrderGstPct(order, storeSettings);
      const prefix = forPdf ? "Rs. " : "₹";
      const list = items.map((it) => {
        const itemGst = active ? (it.gstAmount !== undefined ? it.gstAmount : roundGst(it.totalPrice, pct)) : 0;
        return `${prefix}${formatNum(itemGst)}`;
      });
      return forPdf ? list.join("\n") : list.join(", ");
    }
  },
  {
    id: "productTotalInclGst",
    label: "Product Total (Inc. GST)",
    group: "product",
    defaultSelected: false,
    minWidth: 55,
    align: "right",
    getValue: (order, storeSettings, forPdf) => {
      const items = getOrderItems(order);
      const active = isGstActive(order, storeSettings);
      const pct = getOrderGstPct(order, storeSettings);
      const prefix = forPdf ? "Rs. " : "₹";
      const list = items.map((it) => {
        const itemGst = active ? (it.gstAmount !== undefined ? it.gstAmount : roundGst(it.totalPrice, pct)) : 0;
        const tot = Number(it.totalPrice) + itemGst;
        return `${prefix}${formatNum(tot)}`;
      });
      return forPdf ? list.join("\n") : list.join(", ");
    }
  },

  // ── GROUP D: Optional Order Details ──
  {
    id: "orderStatus",
    label: "Order Status",
    group: "order",
    defaultSelected: false,
    minWidth: 48,
    align: "center",
    getValue: (order) => (order.status || "pending").toUpperCase()
  },
  {
    id: "paymentStatus",
    label: "Payment Status",
    group: "order",
    defaultSelected: false,
    minWidth: 48,
    align: "center",
    getValue: (order) => (order.paymentStatus || "pending").toUpperCase()
  },
  {
    id: "paymentTransactionId",
    label: "Transaction ID",
    group: "order",
    defaultSelected: false,
    minWidth: 65,
    align: "left",
    getValue: (order) => order.paymentTransactionId || "-"
  },
  {
    id: "deliveryFee",
    label: "Delivery Fee",
    group: "order",
    defaultSelected: false,
    minWidth: 45,
    align: "right",
    getValue: (order, _, forPdf) => {
      const amt = Number(order.shippingAmount || 0);
      return forPdf ? `Rs. ${formatNum(amt)}` : `₹${formatNum(amt)}`;
    }
  },
  {
    id: "couponCode",
    label: "Coupon Code",
    group: "order",
    defaultSelected: false,
    minWidth: 48,
    align: "center",
    getValue: (order) => order.couponCode || "-"
  },
  {
    id: "totalDiscount",
    label: "Total Discount",
    group: "order",
    defaultSelected: false,
    minWidth: 48,
    align: "right",
    getValue: (order, _, forPdf) => {
      const amt = Number(order.discountAmount || 0);
      return forPdf ? `Rs. ${formatNum(amt)}` : `₹${formatNum(amt)}`;
    }
  },
  {
    id: "subtotalBeforeTax",
    label: "Subtotal Before Tax",
    group: "order",
    defaultSelected: false,
    minWidth: 50,
    align: "right",
    getValue: (order, _, forPdf) => {
      const amt = Number(order.taxableAmount || order.subtotal || 0);
      return forPdf ? `Rs. ${formatNum(amt)}` : `₹${formatNum(amt)}`;
    }
  },
  {
    id: "totalGstAmount",
    label: "Total GST Amount",
    group: "order",
    defaultSelected: false,
    minWidth: 48,
    align: "right",
    getValue: (order, storeSettings, forPdf) => {
      const active = isGstActive(order, storeSettings);
      const amt = active ? Number(order.gstAmount || 0) : 0;
      return forPdf ? `Rs. ${formatNum(amt)}` : `₹${formatNum(amt)}`;
    }
  },
  {
    id: "grandTotal",
    label: "Grand Total",
    group: "order",
    defaultSelected: false,
    minWidth: 54,
    align: "right",
    getValue: (order, _, forPdf) => {
      const amt = Number(order.total || 0);
      return forPdf ? `Rs. ${formatNum(amt)}` : `₹${formatNum(amt)}`;
    }
  },
  {
    id: "createdAt",
    label: "Created Timestamp",
    group: "order",
    defaultSelected: false,
    minWidth: 65,
    align: "center",
    getValue: (order) => formatDateTime(order.createdAt || order.date)
  },
  {
    id: "updatedAt",
    label: "Updated Timestamp",
    group: "order",
    defaultSelected: false,
    minWidth: 65,
    align: "center",
    getValue: (order) => formatDateTime(order.updatedAt || order.date)
  },
  {
    id: "shippingStatus",
    label: "Fulfillment Status",
    group: "order",
    defaultSelected: false,
    minWidth: 50,
    align: "center",
    getValue: (order) => (order.trackingStatus || order.status || "-").toUpperCase()
  },
  {
    id: "trackingDetails",
    label: "Tracking Details",
    group: "order",
    defaultSelected: false,
    minWidth: 70,
    align: "left",
    getValue: (order) => {
      if (order.courierName || order.awbCode) {
        return `${order.courierName || "Courier"} (AWB: ${order.awbCode || "-"})`;
      }
      return order.trackingNumber || "-";
    }
  }
];

function roundGst(totalPrice: number, pct: number): number {
  return Math.round(((totalPrice * pct) / 100) * 100) / 100;
}

export const DEFAULT_COLUMN_IDS: string[] = ALL_REPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.id);

export function getSelectedColumnDefs(selectedIds: string[]): ReportColumnDef[] {
  const selectedSet = new Set(selectedIds);
  const defs = ALL_REPORT_COLUMNS.filter((c) => selectedSet.has(c.id));
  return defs.length > 0 ? defs : ALL_REPORT_COLUMNS.filter((c) => c.defaultSelected);
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV EXPORT (One Order Per Row)
// ─────────────────────────────────────────────────────────────────────────────

export function downloadReportCSV(
  reportData: ReportItem[],
  selectedColumnIds: string[],
  startDate: string,
  endDate: string,
  storeSettings?: { enableGst?: boolean; gstPercentage?: number }
) {
  const columns = getSelectedColumnDefs(selectedColumnIds);
  const headers = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`);

  const csvRows = reportData.map((order) => {
    return columns.map((col) => {
      const val = col.getValue(order, storeSettings, false);
      // Clean string escaping for CSV
      return `"${String(val ?? "").replace(/"/g, '""')}"`;
    });
  });

  const csvContent = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\r\n");
  // \uFEFF for UTF-8 Byte Order Mark (ensures Excel on Windows displays ₹ symbol properly)
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Order_Report_${startDate}_to_${endDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF EXPORT (One Order Per Row, Clean Redesigned Table)
// ─────────────────────────────────────────────────────────────────────────────

export function downloadReportPDF(
  reportData: ReportItem[],
  selectedColumnIds: string[],
  startDate: string,
  endDate: string,
  storeSettings?: { enableGst?: boolean; gstPercentage?: number }
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4"
  });

  const columns = getSelectedColumnDefs(selectedColumnIds);
  const isGstEnabled = storeSettings?.enableGst ?? false;
  const gstRate = storeSettings?.gstPercentage ?? 0;

  const activeOrders = reportData.filter(
    (o) => !["cancelled", "returned", "refunded"].includes((o.status || "").toLowerCase())
  );
  const totalOrders = reportData.length;
  const totalRevenue = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalGstCollected = activeOrders.reduce((sum, o) => sum + (Number(o.gstAmount) || 0), 0);
  const totalShipping = activeOrders.reduce((sum, o) => sum + (Number(o.shippingAmount) || 0), 0);
  const totalTaxable = activeOrders.reduce(
    (sum, o) => sum + (Number(o.taxableAmount || o.subtotal || o.total) || 0),
    0
  );

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Lilviaa Header Banner
  doc.setFillColor(92, 58, 33); // Cocoa Brown #5C3A21
  doc.rect(0, 0, pageWidth, 52, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("LILVIAA - ORDER SALES & GST TAX REPORT", 30, 26);

  const exportDateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const exportTimeStr = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 230, 215);
  const cancelledCount = totalOrders - activeOrders.length;
  doc.text(
    `Date Period: ${startDate} to ${endDate}   |   Exported: ${exportDateStr} ${exportTimeStr}   |   Orders: ${totalOrders}${cancelledCount > 0 ? ` (${activeOrders.length} active, ${cancelledCount} cancelled/returned)` : ""}`,
    30,
    42
  );

  // 2. Summary Metrics Strip
  doc.setFillColor(253, 248, 243); // Soft warm cream
  doc.rect(20, 58, pageWidth - 40, 24, "F");
  doc.setDrawColor(230, 215, 200);
  doc.setLineWidth(0.75);
  doc.rect(20, 58, pageWidth - 40, 24, "S");

  doc.setFontSize(8);
  doc.setTextColor(92, 58, 33);
  doc.setFont("helvetica", "bold");

  const colWidth = (pageWidth - 60) / 5;
  doc.text(`Total Orders: ${totalOrders}`, 30, 73);
  doc.text(`Taxable Base: Rs. ${formatNum(totalTaxable)}`, 30 + colWidth, 73);
  doc.text(`Website GST: ${isGstEnabled ? `Enabled (${gstRate}%)` : "Disabled"}`, 30 + colWidth * 2, 73);
  doc.text(`Total GST: Rs. ${formatNum(totalGstCollected)}`, 30 + colWidth * 3, 73);
  doc.text(`Total Revenue: Rs. ${formatNum(totalRevenue)}`, 30 + colWidth * 4, 73);

  // 3. Table Rows & Headers
  const tableHead = [columns.map((c) => c.label)];
  const tableBody = reportData.map((order) => {
    return columns.map((c) => c.getValue(order, storeSettings, true));
  });

  // Calculate dynamic column styles
  const columnStyles: Record<number, { cellWidth?: number; halign?: "left" | "center" | "right" }> = {};
  columns.forEach((col, idx) => {
    columnStyles[idx] = {
      halign: col.align || "left",
      ...(col.minWidth ? { cellWidth: col.minWidth } : {})
    };
  });

  // Adjust font size based on column count
  const columnCount = columns.length;
  const tableFontSize = columnCount > 18 ? 5.5 : columnCount > 14 ? 6.5 : 7;
  const headerFontSize = columnCount > 18 ? 6 : columnCount > 14 ? 7 : 7.5;

  autoTable(doc, {
    startY: 88,
    head: tableHead,
    body: tableBody,
    theme: "grid",
    showHead: "everyPage",
    headStyles: {
      fillColor: [92, 58, 33],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: headerFontSize,
      halign: "center",
      valign: "middle",
      cellPadding: 3
    },
    styles: {
      fontSize: tableFontSize,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "middle",
      lineColor: [230, 220, 210],
      lineWidth: 0.5,
      textColor: [50, 40, 35]
    },
    alternateRowStyles: {
      fillColor: [252, 249, 246] // Warm alternating row background
    },
    columnStyles: columnStyles
  });

  // 4. Add "Page X of Y" Footer to every page
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFontSize(7);
    doc.setTextColor(140, 110, 90);
    doc.text(
      `Lilviaa Store Admin Report  |  Page ${page} of ${totalPages}`,
      pageWidth - 170,
      pageHeight - 12
    );
  }

  doc.save(`Order_Report_${startDate}_to_${endDate}.pdf`);
}

// Backward compatibility export (if any other file still imports buildReportRows)
export function buildReportRows(
  reportData: ReportItem[],
  storeSettings?: { enableGst?: boolean; gstPercentage?: number }
) {
  return reportData;
}
