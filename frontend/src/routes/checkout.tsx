import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { formatINR, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useAddresses } from "@/lib/addresses-api";
import { API_URL } from "@/lib/products-api";
import { apiFetch } from "@/lib/api";
import { useCompanySettings } from "@/lib/admin/settings-api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { ArrowRight, CreditCard, Landmark, Banknote, SmartphoneNfc, Check, Lock, ChevronLeft, ShieldCheck, Truck, ShieldAlert, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
  phone: z.string().regex(/^(\+91\s)?[0-9]{10}$/, { message: "Phone must be 10 digits, or +91 followed by 10 digits." }),
  address: z.string().min(5, { message: "Address is required." }),
  city: z.string().min(2, { message: "City is required." }),
  state: z.string().min(2, { message: "State is required." }),
  zip: z.string().min(4, { message: "ZIP code is required." }),
  paymentMethod: z.enum(["razorpay"], {
    required_error: "Please select a payment method.",
  }),
});

const STEPS = [
  { id: "step-1", title: "Address & Payment" },
  { id: "step-2", title: "Review Order" },
  { id: "step-3", title: "Secure Payment" },
];

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: addresses } = useAddresses();
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const { data: settings } = useCompanySettings();

  const [activeStep, setActiveStep] = useState("step-1");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      state: "",
      zip: "",
      paymentMethod: "razorpay",
    },
  });

  const discount = appliedCoupon?.valid ? appliedCoupon.discountAmount : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  
  const customerState = form.watch("state") || "";
  let shipping = 0;
  
  const freeShipping = appliedCoupon?.valid ? appliedCoupon.freeShipping : false;
  
  if (settings) {
    if (freeShipping || (settings.enable_free_shipping && subtotal >= (settings.free_shipping_above || 0))) {
      shipping = 0;
    } else if (customerState.trim().toLowerCase() === (settings.home_state || "").trim().toLowerCase()) {
      shipping = settings.shipping_charge_home || 0;
    } else {
      shipping = settings.shipping_charge_other || 0;
    }
  } else {
    shipping = freeShipping ? 0 : (subtotal >= 3000 ? 0 : 79);
  }

  const gstAmount = settings?.enable_gst ? (taxableAmount * (settings.gst_percentage || 0)) / 100 : 0;
  const total = taxableAmount + shipping + gstAmount;

  async function handleApplyCoupon() {
    if (!couponCodeInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError("");
    setCouponSuccess("");
    try {
      const res = await fetch(`${API_URL}/orders/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCodeInput.trim(),
          cart_total: subtotal,
          user_id: user?.id || null,
          items: items.map(it => ({
            product_variant_id: it.variant_id,
            quantity: it.qty,
            unit_price: it.price
          }))
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon(data);
        setCouponSuccess(data.message);
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message || "Invalid coupon");
      }
    } catch (err: any) {
      setCouponError(err.message || "Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError("");
    setCouponSuccess("");
  }

  // Form has been hoisted above the calculation logic to allow watch()

  useEffect(() => {
    if (user && (!addresses || addresses.length === 0)) {
      form.setValue("email", user.email || "");
      form.setValue("fullName", user.full_name || "");
      form.setValue("phone", user.phone || "");
    } else if (user) {
      if (!form.getValues("email")) form.setValue("email", user.email);
    }
  }, [user, addresses, form]);

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
    if (isPlacingOrder || isVerifyingPayment) return;
    setIsPlacingOrder(true);
    setPaymentError(null);
    try {
      const payload = {
        full_name: values.fullName,
        phone: values.phone,
        address: values.address,
        city: values.city,
        state: values.state,
        zip: values.zip,
        payment_method: values.paymentMethod,
        save_as_default: (document.getElementById("save-address") as HTMLInputElement)?.checked ?? false,
        items: items.map(it => ({
          product_variant_id: it.variant_id,
          quantity: it.qty,
          unit_price: it.price
        })),
        coupon_code: appliedCoupon?.valid ? couponCodeInput.trim() : null
      };

      const res = await apiFetch("/orders/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create order");
      }
      
      const orderData = await res.json();
      
      if (values.paymentMethod === "cod") {
        clear();
        navigate({ to: "/order-success", replace: true, search: { orderId: orderData.id, amount: orderData.total_amount } });
        return;
      }

      // Razorpay Flow
      const resLoad = await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!resLoad) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Lilviaa",
        description: "Order Payment",
        order_id: orderData.razorpay_order_id,
        handler: async function (response: any) {
          setIsVerifyingPayment(true);
          try {
            const verifyRes = await apiFetch("/orders/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                order_id: orderData.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) {
              throw new Error("Payment verification failed");
            }
            clear();
            navigate({ 
              to: "/order-success", 
              search: { 
                order_id: orderData.id, 
                amount: total 
              },
              replace: true 
            });
          } catch (err: any) {
            setPaymentError(err.message || "Failed to verify payment");
            setIsVerifyingPayment(false);
          }
        },
        prefill: {
          name: values.fullName,
          email: values.email,
          contact: values.phone,
          method: values.paymentMethod,
        },
        theme: {
          color: "#9C6644", // cocoa
        },
        modal: {
          ondismiss: function() {
            navigate({ to: "/order-failed", replace: true });
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        navigate({ to: "/order-failed", replace: true });
      });
      rzp.open();
    } catch (error: any) {
      setPaymentError(error.message || "Something went wrong during checkout.");
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (isVerifyingPayment) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center animate-in fade-in duration-500">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm mb-8">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
        <h1 className="font-display text-3xl text-cocoa animate-pulse">Verifying Payment...</h1>
        <p className="mt-2 text-muted-foreground">Please do not close this window.</p>
      </div>
    );
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
  const formData = form.watch();
  
  // Calculate estimated delivery dates
  const today = new Date();
  
  const addBusinessDays = (startDate: Date, days: number) => {
    const date = new Date(startDate);
    let count = 0;
    while (count < days) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        count++;
      }
    }
    return date;
  };

  const stateStr = (formData.state || "").toLowerCase();
  const isTamilNadu = stateStr.includes("tamil nadu") || stateStr === "tn";
  const minDays = isTamilNadu ? 2 : 3;
  const maxDays = isTamilNadu ? 4 : 7;

  const deliveryStart = addBusinessDays(today, minDays);
  const deliveryEnd = addBusinessDays(today, maxDays);
  const deliveryString = `${deliveryStart.getDate()} ${deliveryStart.toLocaleString('default', { month: 'short' })} – ${deliveryEnd.getDate()} ${deliveryEnd.toLocaleString('default', { month: 'short' })}`;

  const paymentMethodLabels: Record<string, string> = {
    upi: "UPI",
    card: "Credit / Debit Card",
    netbanking: "Net Banking",
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
                
                {/* PAGE 1: Address & Payment */}
                {activeStep === "step-1" && (
                  <div className="space-y-6">
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
                    </div>

                    <div className="rounded-3xl bg-card p-6 md:p-8 shadow-cute animate-in fade-in slide-in-from-right-4 duration-300">
                      <h2 className="font-display text-2xl text-cocoa mb-6">Payment Method</h2>
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
                                <FormItem className="space-y-0">
                                  <FormLabel 
                                    className={`flex items-center space-x-3 rounded-2xl border bg-background p-4 shadow-sm hover:border-primary transition-colors cursor-pointer ${field.value === 'razorpay' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border'}`}
                                  >
                                    <FormControl>
                                      <RadioGroupItem value="razorpay" className="mt-0.5" />
                                    </FormControl>
                                    <div className="flex flex-1 items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <SmartphoneNfc className={`h-5 w-5 ${field.value === 'razorpay' ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <div className="flex flex-col">
                                          <span className="font-bold text-cocoa text-base">Pay Online via Razorpay</span>
                                          <span className="text-xs text-muted-foreground font-medium">UPI, Credit/Debit Cards, NetBanking, Wallets</span>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 text-xs font-bold text-muted-foreground flex-wrap justify-end">
                                        <img src="/asset/Checkout_logo/upi_logo_icon_169316.png" alt="UPI" className="h-6 w-auto object-contain bg-white rounded-md p-1 border border-border shadow-sm" />
                                        <img src="/asset/Checkout_logo/VISA-logo-768x432.png" alt="Visa" className="h-6 w-auto object-contain bg-white rounded-md p-1 border border-border shadow-sm" />
                                      </div>
                                    </div>
                                  </FormLabel>
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
                            const valid = await form.trigger(["fullName", "email", "phone", "address", "city", "state", "zip", "paymentMethod"]);
                            if (valid) {
                              setCompletedSteps(prev => [...new Set([...prev, "step-1"])]);
                              setActiveStep("step-2");
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
                        >
                          Continue to Review <ArrowRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE 2: Review Order */}
                {activeStep === "step-2" && (
                  <div className="rounded-3xl bg-card p-6 md:p-8 shadow-cute animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-2xl text-cocoa">Review Order</h2>
                      <button 
                        type="button"
                        onClick={() => setActiveStep("step-1")}
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
                          <button type="button" onClick={() => setActiveStep("step-1")} className="text-sm font-bold text-primary hover:underline">Edit</button>
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
                          type="button"
                          onClick={() => {
                            setCompletedSteps(prev => [...new Set([...prev, "step-2"])]);
                            setActiveStep("step-3");
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          disabled={items.some(it => it.qty === 0)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100"
                        >
                          Proceed to Payment <ArrowRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE 3: Secure Payment */}
                {activeStep === "step-3" && (
                  <div className="rounded-3xl bg-card p-6 md:p-8 shadow-cute animate-in fade-in slide-in-from-right-4 duration-300 border border-border">
                     <div className="py-2">
                       <h2 className="font-display text-2xl text-cocoa mb-8 text-center border-b border-border pb-4">Secure Payment</h2>
                       
                       <div className="max-w-md mx-auto space-y-6">
                           
                           {/* Main Payment Panel */}
                           <div className="rounded-2xl bg-[#fcf9f2] border border-border p-8 text-center shadow-sm">
                             <div className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-widest">Amount to Pay</div>
                             <div className="text-5xl font-display font-black text-cocoa mb-2 tracking-tight">{formatINR(total)}</div>
                             <div className="text-xs text-muted-foreground mb-8">Inclusive of all taxes</div>
                             
                             <div className="border-t border-border pt-6">
                               <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Selected Method</div>
                               <div className="inline-flex items-center justify-center gap-3 bg-white border border-border px-6 py-3 rounded-xl shadow-sm mb-4">
                                 {formData.paymentMethod === 'upi' && <img src="/asset/Checkout_logo/upi_logo_icon_169316.png" alt="UPI" className="h-6 w-auto object-contain" />}
                                 {formData.paymentMethod === 'card' && <div className="flex gap-1.5"><img src="/asset/Checkout_logo/VISA-logo-768x432.png" alt="Visa" className="h-5 w-auto object-contain" /><img src="/asset/Checkout_logo/masterCard.png" alt="Mastercard" className="h-5 w-auto object-contain" /></div>}
                                 {formData.paymentMethod === 'netbanking' && <Landmark className="h-5 w-5 text-primary" />}
                                 <span className="font-bold text-cocoa text-lg">{paymentMethodLabels[formData.paymentMethod] || formData.paymentMethod}</span>
                               </div>
                               <div>
                                 <button type="button" onClick={() => setActiveStep("step-1")} className="text-sm font-bold text-primary hover:underline transition-colors">
                                   Change Payment Method
                                 </button>
                               </div>
                             </div>
                           </div>

                           {/* Billing Summary within Step 3 */}
                           <div className="rounded-2xl border border-border bg-white p-5 space-y-3 text-sm">
                              <h3 className="font-semibold text-cocoa border-b border-border pb-2 mb-3">Billing Summary</h3>
                              <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{formatINR(subtotal)}</span>
                              </div>
                              <div className="flex justify-between text-muted-foreground">
                                <span>Shipping</span>
                                <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
                              </div>
                              {discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Discount</span>
                                  <span>- {formatINR(discount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-cocoa pt-2 border-t border-border text-base">
                                <span>Total</span>
                                <span>{formatINR(total)}</span>
                              </div>
                           </div>
                           
                           {/* Security Badges */}
                           <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-xs font-bold text-green-700 py-2">
                             <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> 256-bit SSL Encryption</span>
                             <span className="flex items-center gap-1.5"><Lock className="h-4 w-4" /> Secure Checkout</span>
                             <span className="flex items-center gap-1.5 text-blue-600">Powered by Razorpay</span>
                           </div>

                           {/* CTA */}
                           <div className="space-y-4">
                             <button
                                type="submit" 
                                disabled={isPlacingOrder || isVerifyingPayment}
                                className="w-full rounded-2xl bg-[#9C6644] px-8 py-4 font-bold text-white transition-all hover:bg-[#8A5A3C] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(156,102,68,0.39)] hover:shadow-[0_6px_20px_rgba(156,102,68,0.23)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 relative overflow-hidden"
                             >
                               {isPlacingOrder ? (
                                 <>
                                   <Loader2 className="w-5 h-5 animate-spin" />
                                   <span>Processing...</span>
                                 </>
                               ) : (
                                 <>
                                   <span>Continue to Razorpay</span>
                                   <ArrowRight className="w-5 h-5" />
                                 </>
                               )}
                               {/* Glossy overlay effect */}
                               <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 hover:opacity-100 transition-opacity"></div>
                             </button>
                             
                             {paymentError && (
                               <div className="mt-4 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
                                 <ShieldAlert className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                                 <p>{paymentError}</p>
                               </div>
                             )}

                             <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-4 text-center">
                               <p className="text-xs text-muted-foreground leading-relaxed">
                                 After clicking Continue to Razorpay, a secure Razorpay payment window will open. Please do not refresh or close this page until payment is completed.
                               </p>
                             </div>
                           </div>
                           
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
              <div className="mb-6 flex gap-2 flex-col">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Coupon code" 
                    className="rounded-xl border-border bg-background uppercase" 
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isApplyingCoupon && !appliedCoupon?.valid && couponCodeInput.trim()) {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    disabled={isApplyingCoupon || appliedCoupon?.valid}
                  />
                  {appliedCoupon?.valid ? (
                    <button 
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-200"
                    >
                      Remove
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCodeInput.trim()}
                      className="rounded-xl bg-cocoa px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-cocoa/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isApplyingCoupon ? "..." : "Apply"}
                    </button>
                  )}
                </div>
                {couponError && <div className="text-xs text-red-500 font-medium px-1">{couponError}</div>}
                {couponSuccess && <div className="text-xs text-green-600 font-medium px-1">{couponSuccess}</div>}
              </div>

              <dl className="mt-4 space-y-3 text-sm text-muted-foreground border-t border-border pt-4">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-cocoa">{formatINR(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <dt>Discount</dt>
                    <dd className="font-semibold">- {formatINR(discount)}</dd>
                  </div>
                )}
                {settings?.enable_gst && (
                  <div className="flex justify-between">
                    <dt>Taxable Amount</dt>
                    <dd className="font-semibold text-cocoa">{formatINR(taxableAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd className="font-semibold text-cocoa">
                    {shipping === 0 ? (
                       <span className="text-green-600 uppercase text-xs tracking-wider">Free</span>
                    ) : formatINR(shipping)}
                  </dd>
                </div>
                {settings?.enable_gst && (
                  <div className="flex justify-between">
                    <dt>GST ({settings.gst_percentage}%)</dt>
                    <dd className="font-semibold text-cocoa">{formatINR(gstAmount)}</dd>
                  </div>
                )}
              </dl>
              
              <div className="mt-4 border-t border-border pt-4 flex justify-between text-xl font-black text-cocoa">
                <span>Grand Total</span>
                <span>{formatINR(total)}</span>
              </div>

              <div className="mt-6 rounded-2xl bg-[#fcf9f2] p-4 text-sm border border-border">
                <div className="font-bold text-cocoa mb-1">Expected Delivery</div>
                <div className="text-muted-foreground">{deliveryString}</div>
                <div className="mt-3 font-bold text-cocoa mb-1">Shipping Partner</div>
                <div className="text-muted-foreground">DTDC Courier</div>
                {shipping > 0 && settings?.enable_free_shipping && (
                  <div className="mt-3 text-primary font-bold text-xs">Free Shipping above {formatINR(settings.free_shipping_above || 0)}</div>
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
