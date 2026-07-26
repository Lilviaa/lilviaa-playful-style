import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { formatINR, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useAddresses } from "@/lib/addresses-api";
import { API_URL } from "@/lib/products-api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { ArrowRight, CreditCard, Landmark, Banknote, SmartphoneNfc, Check, Lock, ChevronLeft, ShieldCheck, Truck, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
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
      { title: "Secure Checkout — lilviaa" },
      { name: "description", content: "Complete your purchase securely." },
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

const STEPS = [
  { id: "step-1", title: "Address" },
  { id: "step-2", title: "Payment" },
  { id: "step-3", title: "Review" },
];

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: addresses } = useAddresses();
  const shipping = subtotal === 0 ? 0 : subtotal >= 3000 ? 0 : 79;
  const discount = 0; // Future enhancement: Apply coupon logic here
  const total = subtotal + shipping - discount;

  const [activeStep, setActiveStep] = useState("step-1");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

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
      setIsPlacingOrder(true);
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

      clear();
      navigate({ to: "/order-success" });
    } catch (error: any) {
      alert(error.message || "Something went wrong during checkout.");
    } finally {
      setIsPlacingOrder(false);
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

  const activeStepIndex = STEPS.findIndex(s => s.id === activeStep);
  const formData = form.getValues();
  
  // Calculate estimated delivery dates
  const today = new Date();
  const deliveryStart = new Date(today);
  deliveryStart.setDate(deliveryStart.getDate() + 2);
  const deliveryEnd = new Date(today);
  deliveryEnd.setDate(deliveryEnd.getDate() + 4);
  const deliveryString = `${deliveryStart.getDate()} ${deliveryStart.toLocaleString('default', { month: 'short' })} – ${deliveryEnd.getDate()} ${deliveryEnd.toLocaleString('default', { month: 'short' })}`;

  const paymentMethodLabels: Record<string, string> = {
    upi: "UPI / QR",
    card: "Credit / Debit Card",
    netbanking: "Net Banking",
    cod: "Cash on Delivery"
  };

  return (
    <div className="min-h-screen bg-[#fcf9f2]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-24 pt-8">
        
        {/* Mobile Order Summary Toggle */}
        <div className="lg:hidden mb-6">
          <button 
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            className="w-full flex items-center justify-between bg-card p-4 rounded-2xl border border-border text-cocoa font-semibold shadow-sm"
          >
            <span className="flex items-center gap-2">Order Summary {isSummaryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
            <span>{formatINR(total)}</span>
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          
          {/* Left Content Column (Progressive Form) */}
          <div className="space-y-6">
            
            {/* Horizontal Stepper */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-full max-w-md flex items-center justify-between">
                <div className="absolute left-0 top-1/2 -z-10 h-[2px] w-full -translate-y-1/2 bg-border"></div>
                {STEPS.map((step, index) => {
                  const isCompleted = completedSteps.includes(step.id);
                  const isActive = activeStep === step.id;
                  const isPast = index < activeStepIndex;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2 bg-[#fcf9f2] px-2">
                      <button
                        type="button"
                        disabled={!isCompleted && !isActive && !isPast}
                        onClick={() => {
                          if (isCompleted || isPast) setActiveStep(step.id);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-full font-bold transition-all ${
                          isActive 
                            ? 'bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/20' 
                            : isCompleted || isPast
                              ? 'bg-primary text-primary-foreground cursor-pointer'
                              : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                        }`}
                      >
                        {isCompleted || isPast ? <Check className="h-4 w-4" /> : (index + 1)}
                      </button>
                      <span className={`text-xs font-bold ${isActive || isCompleted || isPast ? 'text-cocoa' : 'text-muted-foreground'}`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* PAGE 1: Delivery Address */}
                {activeStep === "step-1" && (
                  <div className="rounded-3xl bg-card p-6 md:p-8 shadow-cute animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="font-display text-2xl text-cocoa mb-6">Delivery Address</h2>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="text-cocoa">Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe" {...field} className="rounded-xl border-border bg-background focus-visible:ring-primary" />
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
                            <FormLabel className="text-cocoa">Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="jane@example.com" {...field} className="rounded-xl border-border bg-background focus-visible:ring-primary" />
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
                            <FormLabel className="text-cocoa">Phone Number</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+91 98765 43210" {...field} className="rounded-xl border-border bg-background focus-visible:ring-primary" />
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
                            <FormLabel className="text-cocoa">Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Playful Lane, Apt 4B" {...field} className="rounded-xl border-border bg-background focus-visible:ring-primary" />
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
                            <FormLabel className="text-cocoa">City</FormLabel>
                            <FormControl>
                              <Input placeholder="Mumbai" {...field} className="rounded-xl border-border bg-background focus-visible:ring-primary" />
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
                            <FormLabel className="text-cocoa">State</FormLabel>
                            <FormControl>
                              <Input placeholder="Maharashtra" {...field} className="rounded-xl border-border bg-background focus-visible:ring-primary" />
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
                            <FormLabel className="text-cocoa">ZIP / Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="400001" {...field} className="rounded-xl border-border bg-background focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-5 flex items-center space-x-2">
                      <input type="checkbox" id="save-address" className="rounded text-primary focus:ring-primary h-4 w-4 border-gray-300" defaultChecked />
                      <label htmlFor="save-address" className="text-sm text-cocoa cursor-pointer font-medium">Save this address as default</label>
                    </div>

                    <div className="mt-8 pt-6">
                      <button
                        type="button"
                        onClick={async () => {
                          const valid = await form.trigger(["fullName", "email", "phone", "address", "city", "state", "zip"]);
                          if (valid) {
                            setCompletedSteps(prev => [...new Set([...prev, "step-1"])]);
                            setActiveStep("step-2");
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
                      >
                        Proceed to Payment <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* PAGE 2: Payment Method */}
                {activeStep === "step-2" && (
                  <div className="rounded-3xl bg-card p-6 md:p-8 shadow-cute animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-2xl text-cocoa">Payment Method</h2>
                      <button 
                        type="button"
                        onClick={() => setActiveStep("step-1")}
                        className="text-sm font-semibold text-muted-foreground hover:text-cocoa flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" /> Back
                      </button>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-1 gap-3"
                            >
                              <FormItem 
                                onClick={() => field.onChange("upi")}
                                className={`flex items-center space-x-3 space-y-0 rounded-2xl border bg-background p-4 shadow-sm hover:border-primary transition-colors cursor-pointer ${field.value === 'upi' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border'}`}
                              >
                                <FormControl>
                                  <RadioGroupItem value="upi" className="pointer-events-none mt-0.5" />
                                </FormControl>
                                <div className="flex flex-1 items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <SmartphoneNfc className={`h-5 w-5 ${field.value === 'upi' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <FormLabel className="font-bold text-cocoa cursor-pointer pointer-events-none text-base">UPI</FormLabel>
                                  </div>
                                  <div className="flex gap-2 text-xs font-bold text-muted-foreground">
                                    <span className="bg-muted px-2 py-1 rounded">GPay</span>
                                    <span className="bg-muted px-2 py-1 rounded">PhonePe</span>
                                    <span className="bg-muted px-2 py-1 rounded">Paytm</span>
                                  </div>
                                </div>
                              </FormItem>

                              <FormItem 
                                onClick={() => field.onChange("card")}
                                className={`flex items-center space-x-3 space-y-0 rounded-2xl border bg-background p-4 shadow-sm hover:border-primary transition-colors cursor-pointer ${field.value === 'card' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border'}`}
                              >
                                <FormControl>
                                  <RadioGroupItem value="card" className="pointer-events-none mt-0.5" />
                                </FormControl>
                                <div className="flex flex-1 items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <CreditCard className={`h-5 w-5 ${field.value === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <FormLabel className="font-bold text-cocoa cursor-pointer pointer-events-none text-base">Credit / Debit Card</FormLabel>
                                  </div>
                                  <div className="flex gap-1 text-xs font-bold text-muted-foreground">
                                    <span className="bg-muted px-2 py-1 rounded">Visa</span>
                                    <span className="bg-muted px-2 py-1 rounded">Mastercard</span>
                                    <span className="bg-muted px-2 py-1 rounded">RuPay</span>
                                  </div>
                                </div>
                              </FormItem>

                              <FormItem 
                                onClick={() => field.onChange("netbanking")}
                                className={`flex items-center space-x-3 space-y-0 rounded-2xl border bg-background p-4 shadow-sm hover:border-primary transition-colors cursor-pointer ${field.value === 'netbanking' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border'}`}
                              >
                                <FormControl>
                                  <RadioGroupItem value="netbanking" className="pointer-events-none mt-0.5" />
                                </FormControl>
                                <div className="flex flex-1 items-center gap-3">
                                  <Landmark className={`h-5 w-5 ${field.value === 'netbanking' ? 'text-primary' : 'text-muted-foreground'}`} />
                                  <FormLabel className="font-bold text-cocoa cursor-pointer pointer-events-none text-base">Net Banking</FormLabel>
                                </div>
                              </FormItem>

                              <FormItem 
                                onClick={() => field.onChange("cod")}
                                className={`flex items-center space-x-3 space-y-0 rounded-2xl border bg-background p-4 shadow-sm hover:border-primary transition-colors cursor-pointer ${field.value === 'cod' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border'}`}
                              >
                                <FormControl>
                                  <RadioGroupItem value="cod" className="pointer-events-none mt-0.5" />
                                </FormControl>
                                <div className="flex flex-1 items-center gap-3">
                                  <Banknote className={`h-5 w-5 ${field.value === 'cod' ? 'text-primary' : 'text-muted-foreground'}`} />
                                  <FormLabel className="font-bold text-cocoa cursor-pointer pointer-events-none text-base">Cash on Delivery</FormLabel>
                                </div>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-8 pt-6 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                      <div className="flex flex-col items-center sm:items-start text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1 mb-1"><Lock className="h-3 w-3 text-green-600" /> Secure checkout powered by Razorpay</span>
                        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-green-600" /> 256-bit SSL Encrypted</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const valid = await form.trigger(["paymentMethod"]);
                          if (valid) {
                            setCompletedSteps(prev => [...new Set([...prev, "step-2"])]);
                            setActiveStep("step-3");
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
                      >
                        Review Order <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* PAGE 3: Review Order */}
                {activeStep === "step-3" && (
                  <div className="rounded-3xl bg-card p-6 md:p-8 shadow-cute animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-2xl text-cocoa">Review & Place Order</h2>
                      <button 
                        type="button"
                        onClick={() => setActiveStep("step-2")}
                        className="text-sm font-semibold text-muted-foreground hover:text-cocoa flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" /> Back
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Review Address */}
                      <div className="rounded-2xl border border-border p-5 bg-background">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-cocoa flex items-center gap-2"><Truck className="h-4 w-4" /> Delivery Address</h3>
                          <button type="button" onClick={() => setActiveStep("step-1")} className="text-sm font-bold text-primary hover:underline">Edit</button>
                        </div>
                        <div className="text-sm text-cocoa">
                          <p className="font-bold">{formData.fullName}</p>
                          <p className="mt-1">{formData.address}</p>
                          <p>{formData.city}, {formData.state} {formData.zip}</p>
                          <p className="mt-2 text-muted-foreground">Phone: {formData.phone}</p>
                        </div>
                      </div>

                      {/* Review Payment */}
                      <div className="rounded-2xl border border-border p-5 bg-background">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-cocoa flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Method</h3>
                          <button type="button" onClick={() => setActiveStep("step-2")} className="text-sm font-bold text-primary hover:underline">Edit</button>
                        </div>
                        <div className="text-sm font-bold text-cocoa">
                          {paymentMethodLabels[formData.paymentMethod] || formData.paymentMethod}
                        </div>
                      </div>

                      {/* Trust & Submit */}
                      <div className="rounded-2xl bg-[#fcf9f2] p-6 text-center mt-8 border border-border">
                        <div className="flex justify-center items-center gap-4 text-xs font-bold text-green-700 mb-5">
                          <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Secure checkout</span>
                          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Encrypted</span>
                          <span className="flex items-center gap-1 text-blue-600">Razorpay</span>
                        </div>
                        
                        <button
                          type="submit"
                          disabled={items.some(it => it.qty === 0) || isPlacingOrder}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100"
                        >
                          {isPlacingOrder ? "Processing..." : "Place Order Now"} <ArrowRight className="h-5 w-5" />
                        </button>
                        
                        <p className="text-xs text-muted-foreground mt-4 max-w-sm mx-auto">
                          By placing your order, you agree to our Terms of Service and Privacy Policy.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </form>
            </Form>
          </div>

          {/* Right Order Summary Column (Sticky) */}
          <div className={`lg:block ${isSummaryExpanded ? 'block' : 'hidden'}`}>
            <aside className="sticky top-6 h-max rounded-3xl bg-card p-6 shadow-cute animate-in fade-in">
              <h2 className="font-display text-2xl text-cocoa pb-4 border-b border-border">Order Summary</h2>
              
              <ul className="mt-4 mb-6 space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                {items.map((it) => (
                  <li key={it.slug + it.size} className="flex gap-4">
                    <img src={it.image} alt={it.name} className="h-20 w-16 rounded-xl object-cover bg-muted" />
                    <div className="flex flex-1 flex-col justify-center">
                      <h3 className="font-display text-base font-bold text-cocoa leading-tight">{it.name}</h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        Size: {it.size} <br />
                        Qty: {it.qty}
                      </div>
                      <div className="font-bold text-cocoa mt-1">{formatINR(it.price * it.qty)}</div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Coupon Field Enhancement */}
              <div className="mb-6 flex gap-2">
                <Input placeholder="Coupon code" className="rounded-xl border-border bg-background" />
                <button className="rounded-xl bg-cocoa px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-cocoa/90">Apply</button>
              </div>

              <dl className="mt-4 space-y-3 text-sm text-muted-foreground border-t border-border pt-4">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-cocoa">{formatINR(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd className="font-semibold text-cocoa">
                    {shipping === 0 ? "Free" : formatINR(shipping)}
                  </dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <dt>Discount</dt>
                    <dd className="font-semibold">- {formatINR(discount)}</dd>
                  </div>
                )}
              </dl>
              
              <div className="mt-4 border-t border-border pt-4 flex justify-between text-xl font-black text-cocoa">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>

              <div className="mt-6 rounded-2xl bg-[#fcf9f2] p-4 text-sm border border-border">
                <div className="font-bold text-cocoa mb-1">Expected Delivery</div>
                <div className="text-muted-foreground">{deliveryString}</div>
                <div className="mt-3 font-bold text-cocoa mb-1">Shipping Partner</div>
                <div className="text-muted-foreground">DTDC / ST Courier</div>
                {shipping > 0 && (
                  <div className="mt-3 text-primary font-bold text-xs">Free Shipping above {formatINR(3000)}</div>
                )}
              </div>

              {/* Trust Indicators Sidebar */}
              <div className="mt-6 grid grid-cols-2 gap-3 text-[10px] font-bold text-cocoa uppercase tracking-wider text-center">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-background border border-border">
                  <Lock className="h-5 w-5 text-primary mb-1" />
                  Secure Checkout
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-background border border-border">
                  <Truck className="h-5 w-5 text-primary mb-1" />
                  Fast Delivery
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-background border border-border">
                  <ShieldAlert className="h-5 w-5 text-primary mb-1" />
                  Damage Protection
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-background border border-border">
                  <span className="text-lg mb-1">🇮🇳</span>
                  Made in India
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Minimal Checkout Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-muted-foreground">
          <div>&copy; {new Date().getFullYear()} lilviaa. All rights reserved.</div>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link to="/" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            <Link to="/" className="hover:text-primary transition-colors">Shipping Policy</Link>
            <Link to="/" className="hover:text-primary transition-colors">Return & Refund</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
