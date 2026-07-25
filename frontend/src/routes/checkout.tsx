import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { formatINR, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useAddresses } from "@/lib/addresses-api";
import { API_URL } from "@/lib/products-api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import { ArrowRight, CreditCard, Landmark, Banknote, SmartphoneNfc } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — lilviaa" },
      { name: "description", content: "Complete your purchase." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  address: z.string().min(5, { message: "Address is required." }),
  city: z.string().min(2, { message: "City is required." }),
  state: z.string().min(2, { message: "State is required." }),
  zip: z.string().min(4, { message: "ZIP code is required." }),
  paymentMethod: z.enum(["upi", "card", "netbanking", "cod"], {
    required_error: "Please select a payment method.",
  }),
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: addresses } = useAddresses();
  const shipping = subtotal === 0 ? 0 : subtotal >= 999 ? 0 : 79;
  const total = subtotal + shipping;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      state: "",
      zip: "",
      paymentMethod: "upi",
    },
  });

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
      form.reset({
        ...form.getValues(),
        fullName: defaultAddress.full_name,
        phone: defaultAddress.phone,
        address: defaultAddress.address,
        city: defaultAddress.city,
        state: defaultAddress.state,
        zip: defaultAddress.zip,
      });
    }
  }, [addresses, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        full_name: values.fullName,
        phone: values.phone,
        address: values.address,
        city: values.city,
        state: values.state,
        zip: values.zip,
        payment_method: values.paymentMethod,
        total_amount: total,
        shipping_amount: shipping,
        items: items.map(it => ({
          product_variant_id: it.variant_id,
          quantity: it.qty,
          unit_price: it.price
        }))
      };

      const res = await fetch(`${API_URL}/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create order");
      }

      // Success
      clear();
      navigate({ to: "/order-success" });
    } catch (error: any) {
      alert(error.message || "Something went wrong during checkout.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-display text-3xl text-cocoa">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add some items before checking out.</p>
        <button onClick={() => navigate({ to: "/shop" })} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop">
          Go to Shop <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl text-cocoa md:text-5xl">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Left Form Column */}
        <div className="rounded-3xl bg-card p-6 shadow-cute md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Shipping Details */}
              <div>
                <h2 className="font-display text-2xl text-cocoa mb-4">Shipping Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} className="rounded-xl border-border bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@example.com" {...field} className="rounded-xl border-border bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+91 98765 43210" {...field} className="rounded-xl border-border bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Playful Lane, Apt 4B" {...field} className="rounded-xl border-border bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Mumbai" {...field} className="rounded-xl border-border bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Maharashtra" {...field} className="rounded-xl border-border bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP / Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="400001" {...field} className="rounded-xl border-border bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="font-display text-2xl text-cocoa mb-4">Payment Method (Razorpay)</h2>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                        >
                          <FormItem 
                            onClick={() => field.onChange("upi")}
                            className={`flex items-center space-x-3 space-y-0 rounded-2xl border bg-background p-4 shadow-sm hover:border-primary transition-colors cursor-pointer ${field.value === 'upi' ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                          >
                            <FormControl>
                              <RadioGroupItem value="upi" />
                            </FormControl>
                            <div className="flex flex-1 items-center gap-3">
                              <SmartphoneNfc className="h-5 w-5 text-muted-foreground" />
                              <FormLabel className="font-semibold text-cocoa cursor-pointer pointer-events-none">UPI / QR</FormLabel>
                            </div>
                          </FormItem>
                          <FormItem 
                            onClick={() => field.onChange("card")}
                            className={`flex items-center space-x-3 space-y-0 rounded-2xl border bg-background p-4 shadow-sm hover:border-primary transition-colors cursor-pointer ${field.value === 'card' ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                          >
                            <FormControl>
                              <RadioGroupItem value="card" />
                            </FormControl>
                            <div className="flex flex-1 items-center gap-3">
                              <CreditCard className="h-5 w-5 text-muted-foreground" />
                              <FormLabel className="font-semibold text-cocoa cursor-pointer pointer-events-none">Credit / Debit Card</FormLabel>
                            </div>
                          </FormItem>
                          <FormItem 
                            onClick={() => field.onChange("netbanking")}
                            className={`flex items-center space-x-3 space-y-0 rounded-2xl border bg-background p-4 shadow-sm hover:border-primary transition-colors cursor-pointer ${field.value === 'netbanking' ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                          >
                            <FormControl>
                              <RadioGroupItem value="netbanking" />
                            </FormControl>
                            <div className="flex flex-1 items-center gap-3">
                              <Landmark className="h-5 w-5 text-muted-foreground" />
                              <FormLabel className="font-semibold text-cocoa cursor-pointer pointer-events-none">Net Banking</FormLabel>
                            </div>
                          </FormItem>
                          <FormItem 
                            onClick={() => field.onChange("cod")}
                            className={`flex items-center space-x-3 space-y-0 rounded-2xl border bg-background p-4 shadow-sm hover:border-primary transition-colors cursor-pointer ${field.value === 'cod' ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                          >
                            <FormControl>
                              <RadioGroupItem value="cod" />
                            </FormControl>
                            <div className="flex flex-1 items-center gap-3">
                              <Banknote className="h-5 w-5 text-muted-foreground" />
                              <FormLabel className="font-semibold text-cocoa cursor-pointer pointer-events-none">Cash on Delivery</FormLabel>
                            </div>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit handled by the Order Summary section for better UX */}
              <button type="submit" id="checkout-submit" className="hidden">Submit</button>
            </form>
          </Form>
        </div>

        {/* Right Order Summary Column */}
        <aside className="h-max rounded-3xl bg-card p-6 shadow-cute">
          <h2 className="font-display text-2xl text-cocoa">Order summary</h2>
          
          <ul className="mt-6 mb-6 space-y-4 divide-y divide-border">
            {items.map((it) => (
              <li key={it.slug + it.size} className="flex gap-4 pt-4 first:pt-0">
                <img src={it.image} alt={it.name} className="h-16 w-16 rounded-xl object-cover" />
                <div className="flex flex-1 flex-col justify-center">
                  <h3 className="font-display text-base text-cocoa">{it.name}</h3>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Qty {it.qty} (Size {it.size})</span>
                    <span className="font-bold text-cocoa">{formatINR(it.price * it.qty)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-sm border-t border-border pt-4">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold text-cocoa">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-semibold text-cocoa">
                {shipping === 0 ? "Free" : formatINR(shipping)}
              </dd>
            </div>
          </dl>
          
          <div className="mt-4 border-t border-border pt-4 flex justify-between text-lg font-bold text-cocoa">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
          
          <button
            onClick={() => document.getElementById("checkout-submit")?.click()}
            disabled={items.some(it => it.qty === 0)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            Place Order <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </div>
    </div>
  );
}
