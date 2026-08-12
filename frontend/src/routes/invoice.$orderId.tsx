import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatINR } from "@/lib/cart";
import { Loader2, Printer, MapPin, Phone, Mail, Globe, Heart, UserCircle, Truck, Package, CreditCard, Download, AlertTriangle } from "lucide-react";
import { useCompanySettings } from "@/lib/admin/settings-api";
import logoAsset from "@/assets/lilviaa-logo.png.asset.json";
import { Facebook, Instagram } from "lucide-react";

export const Route = createFileRoute("/invoice/$orderId")({
  component: InvoicePage,
});

function InvoicePage() {
  const { orderId } = Route.useParams();
  const { data: companyDetails, isLoading: isCompanyLoading } = useCompanySettings();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Invoice_${orderId}.pdf`;

    apiFetch(`/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch order");
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load invoice.");
        setLoading(false);
      });
  }, [orderId]);

  if (loading || isCompanyLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8FA3]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8]">
        <p className="text-[#5C3A21]">{error || "Order not found"}</p>
      </div>
    );
  }

  // Format Order ID and Invoice Number based on UUID
  const rawOrderId = order.id;
  const numericHash = parseInt(rawOrderId.replace(/-/g, '').substring(0, 6), 16).toString().padStart(6, '0');
  const invoiceNumber = `INV-LV-${numericHash}`;
  const formattedOrderId = `ORD-LV-${numericHash}`;
  const orderDate = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  
  const shippingAddress = order.addresses || {};
  const billingAddress = shippingAddress;

  const paymentTransaction = order.payment_transactions?.[0] || {};
  const paymentStatus = paymentTransaction.status === 'successful' ? 'Paid' : (order.status === 'delivered' ? 'Paid' : 'Pending');
  
  let paymentMethodLabel = order.payment_method || 'Online';
  if (order.payment_method === 'razorpay' || paymentTransaction?.razorpay_payment_id) {
    paymentMethodLabel = "Razorpay";
    const method = paymentTransaction?.method || order.payment_details?.method;
    if (method) {
      paymentMethodLabel += ` (${method.toUpperCase()})`;
    } else {
      paymentMethodLabel += " (Online)";
    }
  } else if (order.payment_method === 'cod') {
    paymentMethodLabel = "Cash on Delivery";
  } else if (order.payment_method === 'netbanking') {
    paymentMethodLabel = "Net Banking";
  }
  
  const shippingMethod = order.courier_name || "Shiprocket";

  const items = order.order_items || [];
  
  // Extract stored snapshots with fallback to recalculation for old orders
  const subtotal = order.subtotal !== undefined ? order.subtotal : items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
  const shipping = order.shipping_amount || 0;
  const discount = order.discount_amount || 0;
  const taxableAmount = order.taxable_amount !== undefined ? order.taxable_amount : Math.max(0, subtotal - discount);
  const gstAmount = order.gst_amount || 0;
  const gstPercentage = order.gst_percentage || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white flex justify-center font-['Nunito',sans-serif]">
      <style>{`
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      {/* Floating Print Action (Hidden in print) */}
      <div className="fixed top-6 right-6 flex flex-col gap-3 print:hidden z-50">
        <button 
          onClick={handlePrint}
          className="bg-[#5C3A21] hover:bg-[#4A2E1A] text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center group"
          title="Print Invoice"
        >
          <Printer className="h-6 w-6" />
        </button>
        <button 
          onClick={handlePrint}
          className="bg-white hover:bg-gray-50 text-[#5C3A21] border border-[#F4EBE1] p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
          title="Download PDF"
        >
          <Download className="h-6 w-6" />
        </button>
      </div>

      {/* A4 Invoice Container */}
      <div className="w-[210mm] min-h-[297mm] bg-[#FFFDF8] shadow-2xl print:shadow-none p-8 text-[#5C3A21] relative overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-start print:break-inside-avoid">
          <div className="flex flex-col items-start gap-4">
            {/* Logo */}
            {companyDetails?.logo_url ? (
              <img src={companyDetails.logo_url} alt="Logo" className="w-[180px] h-auto object-contain" />
            ) : (
              <img src={logoAsset.url} alt="Logo" className="w-[180px] h-auto object-contain" />
            )}
            
            {/* Address */}
            <div className="text-[#5C3A21] text-xs leading-tight">
              <div className="font-bold text-sm mb-1">{companyDetails?.company_name || 'Lil Viaaa'}</div>
              {companyDetails?.address_line && <div>{companyDetails.address_line}</div>}
              {(companyDetails?.city || companyDetails?.state) && (
                <div>
                  {[companyDetails?.city, companyDetails?.state].filter(Boolean).join(', ')}
                  {companyDetails?.pincode ? ` - ${companyDetails.pincode}` : ''}
                </div>
              )}
              {companyDetails?.phone_primary && <div className="mt-0.5">Phone: {companyDetails.phone_primary}</div>}
              {companyDetails?.business_email && <div>Email: {companyDetails.business_email}</div>}
              {companyDetails?.website && <div>{companyDetails.website}</div>}
              {companyDetails?.enable_gst && companyDetails?.gst_number && (
                <div className="mt-1 font-bold">GST: {companyDetails.gst_number}</div>
              )}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-[900] tracking-wider text-[#5C3A21] mb-1">INVOICE</h1>
            <span className="inline-block bg-[#FF8FA3] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm mb-3">
              Online Order
            </span>
            <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-xs text-left w-max ml-auto items-center">
              <span className="text-[#8C6D56]">Invoice No.</span>
              <span className="font-bold text-red-500">: {invoiceNumber}</span>
              
              <span className="text-[#8C6D56]">Order ID</span>
              <span className="font-bold">: {formattedOrderId}</span>
              
              <span className="text-[#8C6D56]">Order Date</span>
              <span className="font-bold">: {orderDate}</span>
              
              <span className="text-[#8C6D56]">Invoice Date</span>
              <span className="font-bold">: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-[#F4EBE1] my-4 print:break-inside-avoid" />

        {/* ADDRESSES */}
        <div className="grid grid-cols-2 gap-8 print:break-inside-avoid">
          {/* Bill To */}
          <div>
            <div className="flex items-center gap-1.5 text-[#FF8FA3] mb-2">
              <div className="bg-[#FF8FA3] text-white p-1 rounded-full flex items-center justify-center">
                <UserCircle className="h-3 w-3" />
              </div>
              <h2 className="font-extrabold text-xs uppercase tracking-wider text-[#5C3A21]">BILL TO</h2>
            </div>
            <div className="font-extrabold text-sm mb-1">{billingAddress.full_name || order.offline_customer_name || 'Customer'}</div>
            <div className="text-[#5C3A21] leading-tight text-xs">
              {billingAddress.phone || order.offline_customer_phone}<br/>
              {billingAddress.address && <>{billingAddress.address},<br/></>}
              {billingAddress.city && <>{billingAddress.city}, {billingAddress.state} - {billingAddress.zip}</>}
            </div>
          </div>
          
          {/* Ship To */}
          <div>
            <div className="flex items-center gap-1.5 text-[#FF8FA3] mb-2">
              <div className="bg-[#FF8FA3] text-white p-1 rounded-full flex items-center justify-center">
                <Truck className="h-3 w-3" />
              </div>
              <h2 className="font-extrabold text-xs uppercase tracking-wider text-[#5C3A21]">SHIP TO</h2>
            </div>
            <div className="font-extrabold text-sm mb-1">{shippingAddress.full_name || order.offline_customer_name || 'Customer'}</div>
            <div className="text-[#5C3A21] leading-tight text-xs">
              {shippingAddress.phone || order.offline_customer_phone}<br/>
              {shippingAddress.address && <>{shippingAddress.address},<br/></>}
              {shippingAddress.city && <>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.zip}</>}
            </div>
          </div>
        </div>

        {/* COMPACT STATUS ROW */}
        <div className="mt-4 bg-[#FCF8F2] border border-[#F4EBE1] rounded-lg p-4 grid grid-cols-3 gap-4 text-xs text-center print:break-inside-avoid">
          <div><strong className="text-[#8C6D56] uppercase tracking-wide text-[10px] block mb-1">Payment Method</strong><span className="font-bold">{paymentMethodLabel}</span></div>
          <div>
            <strong className="text-[#8C6D56] uppercase tracking-wide text-[10px] block mb-1">Payment Status</strong>
            <span className={`font-bold ${paymentStatus === 'Paid' ? 'text-[#1E8A53]' : 'text-[#856404]'}`}>{paymentStatus}</span>
          </div>
          <div><strong className="text-[#8C6D56] uppercase tracking-wide text-[10px] block mb-1">Shipping Partner</strong><span className="font-bold">{shippingMethod}</span></div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mt-5 border-t border-[#8C6D56]/20 pt-4">
          <table className="w-full text-left text-[#5C3A21] text-xs rounded-xl overflow-hidden border border-[#F4EBE1]">
            <thead className="bg-[#FCEAE8] font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-2 px-3 text-[#5C3A21] w-8">#</th>
                <th className="py-2 px-3 text-[#5C3A21]">PRODUCT</th>
                <th className="py-2 px-3 text-[#5C3A21] text-center w-16">SIZE</th>
                <th className="py-2 px-3 text-[#5C3A21] text-center w-16">QTY</th>
                <th className="py-2 px-3 text-[#5C3A21] text-right w-24">UNIT PRICE</th>
                <th className="py-2 px-3 text-[#5C3A21] text-right w-24">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EBE1]">
              {items.map((item: any, idx: number) => {
                const product = item.product_variants?.products || {};
                const variant = item.product_variants || {};
                return (
                  <tr key={item.id} className="bg-[#FCF8F2] print:break-inside-avoid">
                    <td className="py-2 px-3 font-semibold">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="font-bold">{product.name || 'Unknown Product'}</div>
                      <div className="text-[#8C6D56] text-[10px] mt-0.5">SKU: {variant.sku || 'N/A'}</div>
                    </td>
                    <td className="py-2 px-3 text-center font-medium">{variant.size || 'N/A'}</td>
                    <td className="py-2 px-3 text-center font-medium">{item.quantity}</td>
                    <td className="py-2 px-3 text-right font-medium">{formatINR(item.unit_price)}</td>
                    <td className="py-2 px-3 text-right font-bold">{formatINR(item.total_price)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TOTALS & NOTES */}
        <div className="mt-4 flex flex-col md:flex-row justify-between items-start gap-4 print:break-inside-avoid">
          {/* Notes (Only show if exists) */}
          <div className="flex-1">
            {order.notes && (
              <div className="bg-[#FCF8F2] rounded-xl p-4 border border-[#F4EBE1] h-fit">
                <h3 className="text-[#5C3A21] font-extrabold mb-2 flex items-center gap-2 uppercase text-[10px] tracking-wider">
                  ORDER NOTES <Heart className="text-[#FF8FA3] w-3 h-3 fill-[#FF8FA3]"/>
                </h3>
                <p className="text-[#5C3A21] text-xs leading-relaxed font-medium">
                  {order.notes}
                </p>
              </div>
            )}
          </div>

          {/* Calculations */}
          <div className="w-[280px] bg-[#FCF8F2] rounded-xl p-4 border border-[#F4EBE1] ml-auto shrink-0">
            <div className="space-y-2 text-xs text-[#5C3A21] font-medium">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="font-bold">{formatINR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                  <span className="font-bold">- {formatINR(discount)}</span>
                </div>
              )}
              {gstAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span>Taxable Amount</span>
                  <span className="font-bold">{formatINR(taxableAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Shipping</span>
                <span className="font-bold">{shipping === 0 ? 'Free' : formatINR(shipping)}</span>
              </div>
              {gstAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span>GST ({gstPercentage}%)</span>
                  <span className="font-bold">{formatINR(gstAmount)}</span>
                </div>
              )}
              
              <div className="h-px bg-[#E8D9CE] my-2" />
              
              <div className="flex justify-between items-center pt-1">
                <span className="font-extrabold text-sm uppercase tracking-wider">GRAND TOTAL</span>
                <span className="font-[900] text-xl text-[#FF8FA3]">{formatINR(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* THANK YOU */}
        <div className="mt-8 text-center print:break-inside-avoid">
          <p className="text-[#FF8FA3] font-extrabold text-lg mb-1 flex items-center justify-center gap-2">
            Thank you! <Heart className="w-4 h-4 fill-[#FF8FA3]" />
          </p>
          <p className="text-[#5C3A21] font-medium text-xs">We hope you love your purchase.</p>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-8 left-8 right-8 print:break-inside-avoid">
          <div className="pt-4 border-t border-[#F4EBE1] flex justify-between items-start text-[10px] text-[#5C3A21] font-medium">
            
            <div className="flex items-center gap-2">
              <div className="bg-[#FCF8F2] text-[#5C3A21] p-1.5 rounded-full">
                <Heart className="w-3 h-3 fill-[#FF8FA3] text-[#FF8FA3]" />
              </div>
              <div>
                <div className="font-bold tracking-wide text-[#5C3A21]">
                  {companyDetails?.company_name || 'Company Name'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-[#5C3A21]">
              {companyDetails?.business_email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> <span>{companyDetails.business_email}</span>
                </div>
              )}
              {companyDetails?.website && (
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> <span>{companyDetails.website.replace(/^https?:\/\//, '')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[#5C3A21]">
              <Phone className="w-3 h-3" />
              <div className="flex flex-col">
                {companyDetails?.phone_primary && <span>{companyDetails.phone_primary}</span>}
                {companyDetails?.phone_secondary && <span>{companyDetails.phone_secondary}</span>}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
