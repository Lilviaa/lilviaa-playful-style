import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportItem, ReportOrderItem } from "./dashboard-api";

export interface ExportReportRow {
  orderId: string;
  date: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentMethod: string;
  rowType: "Product" | "GST" | "Product Total" | "Discount" | "Shipping" | "Order Grand Total";
  description: string;
  sku: string;
  quantity: string | number;
  unitPrice: string | number;
  baseAmount: string | number;
  gstRate: string;
  gstAmount: string | number;
  totalAmount: string | number;
}

export function buildReportRows(
  reportData: ReportItem[],
  storeSettings?: { enableGst?: boolean; gstPercentage?: number }
): ExportReportRow[] {
  const rows: ExportReportRow[] = [];
  const websiteGstEnabled = storeSettings?.enableGst ?? false;
  const websiteGstPct = storeSettings?.gstPercentage ?? 0;

  for (const order of reportData) {
    const orderDate = order.date
      ? new Date(order.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
      : "-";

    const orderGstPct =
      order.gstPercentage !== undefined && order.gstPercentage > 0
        ? order.gstPercentage
        : websiteGstPct;

    const isGstEnabled =
      websiteGstEnabled || ((order.gstAmount ?? 0) > 0) || ((order.gstPercentage ?? 0) > 0);

    let items: ReportOrderItem[] = order.orderItems || [];
    if (!items.length) {
      if (typeof order.items === "string" && order.items.trim()) {
        const itemParts = order.items.split(" | ");
        items = itemParts.map((part) => ({
          productName: part,
          sku: "-",
          size: "-",
          quantity: 1,
          unitPrice: order.subtotal || order.total,
          totalPrice: order.subtotal || order.total
        }));
      } else {
        items = [
          {
            productName: "Order Items",
            sku: "-",
            size: "-",
            quantity: 1,
            unitPrice: order.subtotal || order.total,
            totalPrice: order.subtotal || order.total
          }
        ];
      }
    }

    items.forEach((item, index) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const itemTotal = Number(item.totalPrice) || (qty * unitPrice);
      const itemGst = isGstEnabled ? Math.round((itemTotal * orderGstPct) / 100 * 100) / 100 : 0;
      const itemTotalWithGst = Math.round((itemTotal + itemGst) * 100) / 100;
      const skuAndSize = item.sku && item.sku !== "Unknown"
        ? `${item.sku}${item.size && item.size !== "Unknown" ? ` (${item.size})` : ""}`
        : item.size && item.size !== "Unknown" ? item.size : "-";

      // 1. Product row
      rows.push({
        orderId: order.orderId,
        date: orderDate,
        customerName: order.customerName || "Customer",
        customerEmail: order.customerEmail || "-",
        status: order.status || "pending",
        paymentMethod: order.paymentMethod || "online",
        rowType: "Product",
        description: item.productName || `Item #${index + 1}`,
        sku: skuAndSize,
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        baseAmount: itemTotal.toFixed(2),
        gstRate: isGstEnabled ? `${orderGstPct}%` : "-",
        gstAmount: "-",
        totalAmount: isGstEnabled ? "-" : itemTotal.toFixed(2)
      });

      // 2. GST row for that product (only if GST enabled in website/order)
      if (isGstEnabled) {
        rows.push({
          orderId: order.orderId,
          date: orderDate,
          customerName: order.customerName || "Customer",
          customerEmail: order.customerEmail || "-",
          status: order.status || "pending",
          paymentMethod: order.paymentMethod || "online",
          rowType: "GST",
          description: `GST (${orderGstPct}%) on ${item.productName}`,
          sku: "-",
          quantity: "-",
          unitPrice: "-",
          baseAmount: "-",
          gstRate: `${orderGstPct}%`,
          gstAmount: itemGst.toFixed(2),
          totalAmount: "-"
        });
      }

      // 3. Total row for that product
      rows.push({
        orderId: order.orderId,
        date: orderDate,
        customerName: order.customerName || "Customer",
        customerEmail: order.customerEmail || "-",
        status: order.status || "pending",
        paymentMethod: order.paymentMethod || "online",
        rowType: "Product Total",
        description: `Total for ${item.productName}`,
        sku: "-",
        quantity: qty,
        unitPrice: "-",
        baseAmount: itemTotal.toFixed(2),
        gstRate: isGstEnabled ? `${orderGstPct}%` : "-",
        gstAmount: isGstEnabled ? itemGst.toFixed(2) : "-",
        totalAmount: itemTotalWithGst.toFixed(2)
      });
    });

    // Discount row if present
    if (order.discountAmount && order.discountAmount > 0) {
      rows.push({
        orderId: order.orderId,
        date: orderDate,
        customerName: order.customerName || "Customer",
        customerEmail: order.customerEmail || "-",
        status: order.status || "pending",
        paymentMethod: order.paymentMethod || "online",
        rowType: "Discount",
        description: `Coupon Discount ${order.couponCode ? `(${order.couponCode})` : ""}`,
        sku: "-",
        quantity: "-",
        unitPrice: "-",
        baseAmount: `-${order.discountAmount.toFixed(2)}`,
        gstRate: "-",
        gstAmount: "-",
        totalAmount: `-${order.discountAmount.toFixed(2)}`
      });
    }

    // Shipping row if present
    if (order.shippingAmount && order.shippingAmount > 0) {
      rows.push({
        orderId: order.orderId,
        date: orderDate,
        customerName: order.customerName || "Customer",
        customerEmail: order.customerEmail || "-",
        status: order.status || "pending",
        paymentMethod: order.paymentMethod || "online",
        rowType: "Shipping",
        description: "Shipping & Delivery Fee",
        sku: "-",
        quantity: "-",
        unitPrice: "-",
        baseAmount: order.shippingAmount.toFixed(2),
        gstRate: "-",
        gstAmount: "-",
        totalAmount: order.shippingAmount.toFixed(2)
      });
    }

    // Order Grand Total row
    const totalOrderItemsQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
    const orderTaxableOrSubtotal = order.subtotal || order.taxableAmount || order.total;
    rows.push({
      orderId: order.orderId,
      date: orderDate,
      customerName: order.customerName || "Customer",
      customerEmail: order.customerEmail || "-",
      status: order.status || "pending",
      paymentMethod: order.paymentMethod || "online",
      rowType: "Order Grand Total",
      description: `Order #${order.orderId.slice(0, 8)} Grand Total`,
      sku: "-",
      quantity: totalOrderItemsQty,
      unitPrice: "-",
      baseAmount: Number(orderTaxableOrSubtotal).toFixed(2),
      gstRate: isGstEnabled ? `${orderGstPct}%` : "-",
      gstAmount: isGstEnabled ? Number(order.gstAmount || 0).toFixed(2) : "-",
      totalAmount: Number(order.total).toFixed(2)
    });
  }

  return rows;
}

export function downloadReportCSV(
  rows: ExportReportRow[],
  startDate: string,
  endDate: string
) {
  const headers = [
    "Order ID",
    "Date",
    "Customer Name",
    "Customer Email",
    "Status",
    "Payment Method",
    "Row Type",
    "Item / Description",
    "SKU / Size",
    "Quantity",
    "Unit Price (INR)",
    "Base Amount (INR)",
    "GST Rate",
    "GST Amount (INR)",
    "Total Amount (INR)"
  ];

  const csvRows = rows.map((r) => [
    `"${String(r.orderId).replace(/"/g, '""')}"`,
    `"${String(r.date).replace(/"/g, '""')}"`,
    `"${String(r.customerName).replace(/"/g, '""')}"`,
    `"${String(r.customerEmail).replace(/"/g, '""')}"`,
    `"${String(r.status).replace(/"/g, '""')}"`,
    `"${String(r.paymentMethod).replace(/"/g, '""')}"`,
    `"${String(r.rowType).replace(/"/g, '""')}"`,
    `"${String(r.description).replace(/"/g, '""')}"`,
    `"${String(r.sku).replace(/"/g, '""')}"`,
    r.quantity,
    r.unitPrice,
    r.baseAmount,
    `"${String(r.gstRate).replace(/"/g, '""')}"`,
    r.gstAmount,
    r.totalAmount
  ]);

  const csvContent = [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\r\n");
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

export function downloadReportPDF(
  reportData: ReportItem[],
  rows: ExportReportRow[],
  startDate: string,
  endDate: string,
  storeSettings?: { enableGst?: boolean; gstPercentage?: number }
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4"
  });

  const isGstEnabled = storeSettings?.enableGst ?? false;
  const gstRate = storeSettings?.gstPercentage ?? 0;

  const totalOrders = reportData.length;
  const totalRevenue = reportData.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalGstCollected = reportData.reduce((sum, o) => sum + (Number(o.gstAmount) || 0), 0);
  const totalTaxable = reportData.reduce(
    (sum, o) => sum + (Number(o.taxableAmount || o.subtotal || o.total) || 0),
    0
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  // Lilviaa Header Banner
  doc.setFillColor(92, 58, 33); // Cocoa Brown #5C3A21
  doc.rect(0, 0, pageWidth, 52, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("LILVIAA - ORDER SALES & GST TAX REPORT", 30, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(255, 230, 215);
  doc.text(
    `Date Period: ${startDate} to ${endDate}   |   Exported: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ${new Date().toLocaleTimeString("en-IN")}`,
    30,
    44
  );

  // Summary Metrics Bar
  doc.setFillColor(252, 246, 240); // Soft cream
  doc.rect(20, 60, pageWidth - 40, 24, "F");
  doc.setDrawColor(230, 215, 200);
  doc.setLineWidth(0.75);
  doc.rect(20, 60, pageWidth - 40, 24, "S");

  doc.setFontSize(8.5);
  doc.setTextColor(92, 58, 33);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Orders: ${totalOrders}`, 35, 75);
  doc.text(`Taxable Base: Rs. ${totalTaxable.toFixed(2)}`, 160, 75);
  doc.text(`Website GST: ${isGstEnabled ? `Enabled (${gstRate}%)` : "Disabled"}`, 360, 75);
  if (isGstEnabled) {
    doc.text(`Total GST: Rs. ${totalGstCollected.toFixed(2)}`, 530, 75);
  }
  doc.text(`Total Revenue: Rs. ${totalRevenue.toFixed(2)}`, 680, 75);

  const head = [
    [
      "Order ID",
      "Date",
      "Customer",
      "Status",
      "Row Type",
      "Item / Description",
      "SKU/Size",
      "Qty",
      "Unit (Rs.)",
      "Base (Rs.)",
      "GST %",
      "GST (Rs.)",
      "Total (Rs.)"
    ]
  ];

  const tableRows = rows.map((r) => [
    r.orderId.length > 8 ? `#${r.orderId.slice(0, 8)}...` : `#${r.orderId}`,
    r.date,
    r.customerName,
    r.status.toUpperCase(),
    r.rowType,
    r.description,
    r.sku,
    r.quantity,
    r.unitPrice,
    r.baseAmount,
    r.gstRate,
    r.gstAmount,
    r.totalAmount
  ]);

  autoTable(doc, {
    startY: 92,
    head: head,
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [92, 58, 33],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      valign: "middle",
      cellPadding: 4
    },
    styles: {
      fontSize: 7,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "middle",
      lineColor: [230, 220, 210],
      lineWidth: 0.5
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 55 },
      2: { cellWidth: 72 },
      3: { cellWidth: 50, halign: "center" },
      4: { cellWidth: 56, halign: "center" },
      5: { cellWidth: 154 },
      6: { cellWidth: 55 },
      7: { cellWidth: 26, halign: "center" },
      8: { cellWidth: 42, halign: "right" },
      9: { cellWidth: 48, halign: "right" },
      10: { cellWidth: 36, halign: "center" },
      11: { cellWidth: 48, halign: "right" },
      12: { cellWidth: 55, halign: "right" }
    },
    didParseCell: function (data) {
      if (data.section !== "body") return;
      const rowData = rows[data.row.index];
      if (!rowData) return;

      if (rowData.rowType === "GST") {
        data.cell.styles.fillColor = [254, 245, 240];
        data.cell.styles.textColor = [160, 70, 30];
        data.cell.styles.fontStyle = "italic";
      } else if (rowData.rowType === "Product Total") {
        data.cell.styles.fillColor = [252, 235, 230];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [92, 58, 33];
      } else if (rowData.rowType === "Order Grand Total") {
        data.cell.styles.fillColor = [240, 222, 212];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [70, 40, 20];
      }
    },
    didDrawPage: function (data) {
      doc.setFontSize(7);
      doc.setTextColor(140, 110, 90);
      const pageNumber = data.pageNumber;
      doc.text(
        `Lilviaa Store Admin Report  |  Page ${pageNumber}`,
        pageWidth - 170,
        doc.internal.pageSize.getHeight() - 12
      );
    }
  });

  doc.save(`Order_Report_${startDate}_to_${endDate}.pdf`);
}
