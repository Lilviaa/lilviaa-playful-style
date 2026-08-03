import { Order } from "@/lib/admin/orders-api";
import { formatINR } from "@/lib/cart";
import { formatOrderId } from "@/lib/utils";

interface PackingSlipPrintProps {
  order: Order | null;
}

export function PackingSlipPrint({ order }: PackingSlipPrintProps) {
  if (!order) return null;

  return (
    <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:z-50 p-8 text-black bg-white">
      {/* Header */}
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider mb-1">Packing Slip</h1>
          <p className="text-gray-500">Order #{formatOrderId(order.id)}</p>
          <p className="text-gray-500">Date: {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold mb-1">lilviaa</h2>
          <p className="text-gray-500">123 Fashion Street</p>
          <p className="text-gray-500">Bangalore, KA 560001</p>
          <p className="text-gray-500">support@lilviaa.com</p>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold text-gray-700 uppercase mb-2 text-sm border-b pb-1">
            Ship To
          </h3>
          <p className="font-bold">{order.shipping_address.fullName}</p>
          <p>{order.shipping_address.address}</p>
          <p>
            {order.shipping_address.city}, {order.shipping_address.state}{" "}
            {order.shipping_address.zip}
          </p>
          <p className="mt-2 text-sm text-gray-600">Phone: {order.shipping_address.phone}</p>
          <p className="text-sm text-gray-600">Email: {order.shipping_address.email}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 uppercase mb-2 text-sm border-b pb-1">
            Order Details
          </h3>
          <p>
            <span className="font-medium text-gray-600">Payment Method:</span>{" "}
            <span className="uppercase">{order.payment_method}</span>
          </p>
          <p>
            <span className="font-medium text-gray-600">Payment Status:</span>{" "}
            <span className="capitalize">{order.payment_status}</span>
          </p>
          {order.tracking_number && (
            <p>
              <span className="font-medium text-gray-600">Tracking:</span> {order.tracking_number}
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="py-2 font-semibold">Item</th>
            <th className="py-2 font-semibold">Details</th>
            <th className="py-2 font-semibold text-center">Qty</th>
            <th className="py-2 font-semibold text-right">Price</th>
            <th className="py-2 font-semibold text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-4">
                <span className="font-medium">{item.product_name_snapshot}</span>
              </td>
              <td className="py-4 text-sm text-gray-600">
                Size: {item.size} | Color: {item.color}
              </td>
              <td className="py-4 text-center">{item.quantity}</td>
              <td className="py-4 text-right">{formatINR(item.price_at_purchase)}</td>
              <td className="py-4 text-right font-medium">
                {formatINR(item.price_at_purchase * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-1/2 md:w-1/3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Discount</span>
              <span className="text-red-500">-{formatINR(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Shipping</span>
            <span>{order.shipping_fee === 0 ? "Free" : formatINR(order.shipping_fee)}</span>
          </div>
          <div className="flex justify-between py-3 font-bold text-lg">
            <span>Total</span>
            <span>{formatINR(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-gray-500 text-sm">
        <p>Thank you for shopping with lilviaa!</p>
        <p>If you have any questions, please contact us at support@lilviaa.com</p>
      </div>
    </div>
  );
}
