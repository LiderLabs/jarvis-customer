"use client"
import { InternationalPhoneInput } from '@/components/ui/InternationalPhoneInput'

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { StepIndicator } from '@/components/StepIndicator';
import { ServiceCard } from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceType } from '@/types';
import { useMutation, useQuery, useConvexAuth } from 'convex/react';
import { api } from '@jordan6699/washlab-backend/api';
import { useCurrentCustomer } from '@/hooks/use-current-customer';
import {
  Droplets,
  Wind,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Copy,
  Check,
  Loader2,
  Plus,
  Minus,
  Info,
  Shirt,
  Flame,
  Package,
  Truck,
  Clock,
  MapPin,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '@jordan6699/washlab-backend/dataModel';

// ── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ['Branch', 'Services', 'Clothes', 'Whites', 'Pickup', 'Details', 'Summary'];

// ── Heavy item definitions ────────────────────────────────────────────────────
const HEAVY_ITEMS = [
  { key: 'jeans',  label: 'Jeans / Trousers', emoji: '👖', weightPerItem: 1.0 },
  { key: 'duvet',  label: 'Duvet / Blanket',  emoji: '🛏️', weightPerItem: 4.0 },
  { key: 'towel',  label: 'Towel',            emoji: '🏊', weightPerItem: 0.8 },
] as const;

type HeavyItemKey = typeof HEAVY_ITEMS[number]['key'];
type HeavyItemCounts = Record<HeavyItemKey, number>;

// ── Time slots ───────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  '08:00 – 09:00', '09:00 – 10:00', '10:00 – 11:00', '11:00 – 12:00',
  '12:00 – 13:00', '13:00 – 14:00', '14:00 – 15:00', '15:00 – 16:00',
  '16:00 – 17:00', '17:00 – 18:00',
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Branch {
  _id: Id<"branches">;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  phoneNumber: string;
  email?: string;
  pricingPerKg: number;
  deliveryFee: number;
  isActive: boolean;
  createdAt: number;
}

interface Service {
  _id: string;
  name: string;
  code: string;
  price: number;
  basePrice?: number;
  description?: string;
  showOnCustomerSide?: boolean;
  imageUrl?: string;
  pricingType?: string;
  // Jarvis additions
  category?: 'core' | 'addon' | 'logistics';
  unit?: string;
}

// A selected service line-item (what we send to the backend)
interface SelectedServiceLine {
  serviceId: Id<"branchServices">;
  serviceName: string;
  serviceCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

// ── Counter component ─────────────────────────────────────────────────────────
function Counter({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 disabled:opacity-30 transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
          else if (e.target.value === "") onChange(min);
        }}
        className="w-10 h-8 text-center font-semibold text-sm tabular-nums bg-transparent border-b border-border focus:outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getServiceIcon(code: string) {
  if (code.includes('wash') && code.includes('dry')) return Sparkles;
  if (code.includes('wash')) return Droplets;
  if (code.includes('dry')) return Wind;
  if (code.includes('iron') || code.includes('press')) return Flame;
  if (code.includes('fold')) return Shirt;
  if (code.includes('pickup') || code.includes('delivery')) return Truck;
  return Package;
}

function getCategoryLabel(cat?: string) {
  if (cat === 'addon') return 'Add-ons';
  if (cat === 'logistics') return 'Pickup & Delivery';
  return 'Core Services';
}

// Next available weekdays (skip today if past 14:00)
function getAvailableDates(count = 7): { label: string; value: string }[] {
  const dates: { label: string; value: string }[] = [];
  const now = new Date();
  let d = new Date(now);
  if (now.getHours() >= 14) d.setDate(d.getDate() + 1);
  const fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  while (dates.length < count) {
    const day = d.getDay();
    if (day !== 0) { // skip Sundays — adjust as needed
      dates.push({
        label: day === new Date().getDay() && dates.length === 0 ? `Today, ${fmt.format(d)}` : fmt.format(d),
        value: d.toISOString().split('T')[0],
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

// ── Main component ────────────────────────────────────────────────────────────
function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useConvexAuth();
  const { clerkUser, convexUser } = useCurrentCustomer();

  // ── UI state ────────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [branchAutoSet, setBranchAutoSet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherResult, setVoucherResult] = useState<null | {
    valid: boolean; discountAmount?: number; finalPrice?: number;
    voucher?: { code: string; name?: string; discountType: string; discountValue: number };
    error?: string;
  }>(null);
  const [redeemLoyaltyInline, setRedeemLoyaltyInline] = useState(false);

  // ── Order state ─────────────────────────────────────────────────────────────
  const [branchId, setBranchId] = useState<string>('');

  // MULTI-SERVICE: map of serviceId → line item
  const [selectedServices, setSelectedServices] = useState<Map<string, SelectedServiceLine>>(new Map());

  // Legacy single serviceType — kept for backwards compat with backend
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);

  // Clothes
  const [clothesCount, setClothesCount] = useState<number>(0);
  const [heavyItems, setHeavyItems] = useState<HeavyItemCounts>({ jeans: 0, duvet: 0, towel: 0 });

  // Whites
  const [hasWhites, setHasWhites] = useState<boolean | null>(null);
  const [washSeparately, setWashSeparately] = useState(true);
  const [mixDisclaimer, setMixDisclaimer] = useState(false);
  const [separateDisclaimer, setSeparateDisclaimer] = useState(false);

  // Pickup / delivery
  const [pickupOption, setPickupOption] = useState<'self' | 'pickup_delivery'>('self');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');

  // Customer details
  const [customerInfo, setCustomerInfo] = useState({
    phone: '', name: '', email: '',
    hall: '', room: '',           // kept for legacy — campus orders
    deliveryAddress: '', deliveryPhone: '', notes: '',
  });

  // ── Convex data ─────────────────────────────────────────────────────────────
  const branches = (useQuery(api.branches.getActive, {}) ?? []) as Branch[];
  const customerProfile = useQuery(
    (api as any).customers.getProfile,
    isAuthenticated ? {} : "skip"
  );
  const dbServices = (useQuery(
    (api as any).admin.getBranchServicesForCustomer,
    branchId ? { branchId: branchId as string } : "skip"
  ) ?? []) as Service[];

  const validateVoucher = useQuery(
    (api as any).vouchers.validate,
    voucherCode.length >= 3 && branchId
      ? { code: voucherCode.toUpperCase(), orderTotal: 1, branchId: branchId as string }
      : "skip"
  );
  const createOrder = useMutation(api.orders.createOnline);
  const redeemPointsMutation = useMutation((api as any).loyalty.redeemPoints);
  const applyVoucherMutation = useMutation((api as any).vouchers.applyToOrder);
  const loyaltyBalance = useQuery((api as any).loyalty.getBalance, "skip");

  // ── Auto-fill from profile ──────────────────────────────────────────────────
  useEffect(() => {
    if (convexUser && isAuthenticated) {
      setCustomerInfo(prev => ({
        ...prev,
        name: convexUser.name || clerkUser?.fullName || '',
        phone: convexUser.phoneNumber || '',
        email: convexUser.email || clerkUser?.emailAddresses?.[0]?.emailAddress || '',
      }));
      const prefBranch = (convexUser as any).preferredBranchId;
      if (prefBranch && !branchAutoSet) {
        setBranchId(prefBranch);
        setBranchAutoSet(true);
        if (currentStep === 0) setCurrentStep(1);
      }
    }
  }, [convexUser, clerkUser, isAuthenticated]);

  // ── Service URL param ───────────────────────────────────────────────────────
  useEffect(() => {
    const serviceFromUrl = searchParams.get('service');
    if (serviceFromUrl && dbServices.length > 0) {
      const svc = dbServices.find(s => s.code === serviceFromUrl);
      if (svc) autoSelectService(svc);
    }
  }, [searchParams, dbServices]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const selectedServicesList = Array.from(selectedServices.values());

  // Group services by category for display
  const coreServices = dbServices.filter(s => !s.category || s.category === 'core');
  const addonServices = dbServices.filter(s => s.category === 'addon');
  const logisticsServices = dbServices.filter(s => s.category === 'logistics');

  // Weight estimation
  const heavyItemsWeight = HEAVY_ITEMS.reduce(
    (total, item) => total + heavyItems[item.key] * item.weightPerItem, 0
  );
  const estimatedWeight = clothesCount * 0.5 + heavyItemsWeight;

  // Price: sum of all selected service subtotals
  const servicesTotal = selectedServicesList.reduce((sum, s) => sum + s.subtotal, 0);

  // For display in summary — recalculate subtotals based on current weight
  const KG_PER_LOAD = 8;
  const estimatedLoads = Math.max(1, Math.ceil(estimatedWeight / KG_PER_LOAD));

  // Recompute line-item subtotals when weight changes
  const recomputedLines = selectedServicesList.map(line => {
    const svc = dbServices.find(s => s._id === line.serviceId);
    if (!svc) return line;
    let qty = line.quantity;
    let unit = line.unit;
    const pt = svc.pricingType ?? 'per_load';
    if (pt === 'per_kg') { qty = estimatedWeight; unit = 'kg'; }
    else if (pt === 'per_load') { qty = estimatedLoads; unit = 'load'; }
    const subtotal = Math.round(qty * line.unitPrice * 100) / 100;
    return { ...line, quantity: qty, unit, subtotal };
  });

  const estimatedTotal = recomputedLines.reduce((sum, l) => sum + l.subtotal, 0);

  // Legacy single serviceType string — derive from selections for backend compat
  function deriveLegacyServiceType(): ServiceType {
    const codes = selectedServicesList.map(s => s.serviceCode);
    if (codes.includes('wash_and_dry')) return 'wash_and_dry';
    if (codes.includes('wash_only') && codes.includes('dry_only')) return 'wash_and_dry';
    if (codes.includes('wash_only')) return 'wash_only';
    if (codes.includes('dry_only')) return 'dry_only';
    return (codes[0] as ServiceType) ?? 'wash_and_dry';
  }

  // ── Service selection helpers ───────────────────────────────────────────────
  function autoSelectService(svc: Service) {
    const unitPrice = svc.price ?? svc.basePrice ?? 0;
    const pt = svc.pricingType ?? 'per_load';
    const qty = pt === 'per_kg' ? estimatedWeight || 1 : estimatedLoads || 1;
    const unit = pt === 'per_kg' ? 'kg' : pt === 'per_item' ? 'item' : 'load';
    const line: SelectedServiceLine = {
      serviceId: svc._id as Id<"branchServices">,
      serviceName: svc.name,
      serviceCode: svc.code,
      quantity: qty,
      unit,
      unitPrice,
      subtotal: Math.round(qty * unitPrice * 100) / 100,
    };
    setSelectedServices(new Map([[svc._id, line]]));
    setServiceType(svc.code as ServiceType);
  }

  function toggleService(svc: Service) {
    const unitPrice = svc.price ?? svc.basePrice ?? 0;
    const pt = svc.pricingType ?? 'per_load';
    const qty = pt === 'per_kg' ? Math.max(1, estimatedWeight) : estimatedLoads || 1;
    const unit = pt === 'per_kg' ? 'kg' : pt === 'per_item' ? 'item' : 'load';

    setSelectedServices(prev => {
      const next = new Map(prev);
      if (next.has(svc._id)) {
        next.delete(svc._id);
      } else {
        next.set(svc._id, {
          serviceId: svc._id as Id<"branchServices">,
          serviceName: svc.name,
          serviceCode: svc.code,
          quantity: qty,
          unit,
          unitPrice,
          subtotal: Math.round(qty * unitPrice * 100) / 100,
        });
      }
      // Keep legacy serviceType in sync
      const codes = Array.from(next.values()).map(l => l.serviceCode);
      if (codes.includes('wash_and_dry')) setServiceType('wash_and_dry');
      else if (codes.includes('wash_only') && codes.includes('dry_only')) setServiceType('wash_and_dry');
      else if (codes.includes('wash_only')) setServiceType('wash_only');
      else if (codes.includes('dry_only')) setServiceType('dry_only');
      else setServiceType((codes[0] as ServiceType) ?? null);
      return next;
    });
  }

  const updateHeavyItem = (key: HeavyItemKey, value: number) => {
    setHeavyItems(prev => ({ ...prev, [key]: value }));
  };

  // ── Proceed logic ────────────────────────────────────────────────────────────
  const canProceed = () => {
    switch (currentStep) {
      case 0: return branchId !== '';
      case 1: return selectedServices.size > 0;
      case 2: return clothesCount > 0 || Object.values(heavyItems).some(v => v > 0);
      case 3:
        if (hasWhites === null) return false;
        if (hasWhites === false) return true;
        return washSeparately ? separateDisclaimer : mixDisclaimer;
      case 4:
        if (pickupOption === 'self') return true;
        return !!(pickupDate && pickupTimeSlot && pickupAddress && pickupCity);
      case 5:
        if (isAuthenticated && convexUser) return true;
        return !!(customerInfo.phone && customerInfo.name && customerInfo.email);
      default: return true;
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmitOrder();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // ── Voucher ──────────────────────────────────────────────────────────────────
  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) return;
    if (validateVoucher === undefined) { toast.info('Checking voucher...'); return; }
    if ((validateVoucher as any)?.valid) {
      setVoucherResult(validateVoucher as any);
      if ((validateVoucher as any).voucher?.discountType === 'free_wash') toast.success('Free wash voucher applied!');
      else toast.success(`Voucher applied! You save GHS ${((validateVoucher as any)?.discountAmount ?? 0).toFixed(2)}`);
    } else {
      toast.error((validateVoucher as any)?.error ?? 'Invalid voucher code');
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      const phone = isAuthenticated && convexUser
        ? convexUser.phoneNumber
        : customerInfo.phone;
      const email = isAuthenticated && convexUser
        ? convexUser.email || clerkUser?.emailAddresses?.[0]?.emailAddress || ''
        : customerInfo.email;
      const name = isAuthenticated && convexUser
        ? convexUser.name || clerkUser?.fullName || ''
        : customerInfo.name;

      const legacyServiceType = deriveLegacyServiceType();

      // Build scheduled pickup timestamp if provided
      let scheduledPickupAt: number | undefined;
      if (pickupOption === 'pickup_delivery' && pickupDate && pickupTimeSlot) {
        const [startHour] = pickupTimeSlot.split(' – ')[0].split(':');
        const dt = new Date(`${pickupDate}T${startHour.padStart(2, '0')}:00:00`);
        scheduledPickupAt = dt.getTime();
      }

      const result = await createOrder({
        customerName: name!,
        customerPhoneNumber: phone!,
        customerEmail: email!,
        branchId: branchId as Id<"branches">,
        serviceType: legacyServiceType,
        estimatedWeight,
        itemCount: clothesCount + Object.values(heavyItems).reduce((a, b) => a + b, 0),
        whitesSeparate: hasWhites === true && washSeparately,
        isDelivery: pickupOption === 'pickup_delivery',
        deliveryAddress: pickupOption === 'pickup_delivery' ? pickupAddress : undefined,
        deliveryPhoneNumber: pickupOption === 'pickup_delivery' ? pickupPhone || phone : undefined,
        notes: customerInfo.notes || undefined,
        voucherCode: voucherResult?.valid ? voucherCode : undefined,
        // Jarvis multi-service additions
        selectedServices: recomputedLines as any,
        scheduledPickupAt,
        pickupAddress: pickupOption === 'pickup_delivery' ? pickupAddress : undefined,
        pickupCity: pickupOption === 'pickup_delivery' ? pickupCity : undefined,
        pickupPhoneNumber: pickupOption === 'pickup_delivery' ? (pickupPhone || phone) : undefined,
      } as any);

      if (redeemLoyaltyInline && isAuthenticated) {
        try {
          await redeemPointsMutation({ points: 10, orderId: result.orderId });
        } catch { /* non-fatal */ }
      }

      if (result?.isGuest) {
        toast.success('Order placed! Check your email for updates.');
      } else {
        toast.success('Order placed successfully!');
      }
      setOrderNumber(result.orderNumber);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(msg || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOrderCode = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      toast.success('Order code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (orderNumber) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl mx-auto px-4 pt-24 pb-12">
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">Order Placed!</h1>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">Your order has been created successfully</p>
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-8">
              <p className="text-sm text-muted-foreground mb-2">Your Order Number</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-display font-bold text-gradient break-all">{orderNumber}</span>
                <button onClick={copyOrderCode} className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
                  {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Services summary on success */}
            {recomputedLines.length > 0 && (
              <div className="bg-muted/50 rounded-xl border border-border p-4 mb-6 text-left">
                <p className="text-sm font-semibold mb-3">Services booked:</p>
                <div className="space-y-2">
                  {recomputedLines.map(l => (
                    <div key={l.serviceId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{l.serviceName}</span>
                      <span className="font-medium">₵{l.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                    <span>Est. Total</span>
                    <span className="text-primary">₵{estimatedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-primary/5 rounded-2xl p-4 sm:p-6 mb-8 text-left">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning flex-shrink-0" />
                Next Steps
              </h3>
              <ol className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                {(pickupOption === 'pickup_delivery'
                  ? [
                      `We'll pick up your laundry on ${pickupDate} during ${pickupTimeSlot}`,
                      `Ensure someone is available at ${pickupAddress}`,
                      'Your clothes will be weighed and final price confirmed',
                      'Payment collected on pickup or via mobile money',
                    ]
                  : [
                      'Bring your clothes to the selected branch',
                      `Show your order number ${orderNumber} to the attendant`,
                      'Your clothes will be weighed and final price calculated',
                      'Make payment and receive your bag tag',
                    ]
                ).map((step, i) => (
                  <li key={i} className="flex gap-2 sm:gap-3">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-xs">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated && (
                <Button variant="outline" onClick={() => router.push('/dashboard/orders')} className="w-full sm:w-auto">View My Orders</Button>
              )}
              <Button variant="outline" onClick={() => router.push(orderNumber ? `/track?order=${orderNumber}` : '/track')} className="w-full sm:w-auto">Track Order</Button>
              <Button onClick={() => router.push('/')} className="w-full sm:w-auto">Back to Home</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Available dates for scheduling ────────────────────────────────────────
  const availableDates = getAvailableDates(7);

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">Place Your Order</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Fill in the details below to get started</p>
        </div>

        <div className="mb-8 sm:mb-12 w-full">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 md:p-8 min-h-[400px]">

          {/* ── Step 0: Branch ─────────────────────────────────────────────── */}
          {currentStep === 0 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-2">Choose Your Branch</h2>
              <p className="text-sm text-muted-foreground mb-6">Select the Jarvis location nearest to you</p>
              {!branches || branches.length === 0 ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading branches...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {branches.map((branch: Branch) => (
                    <button
                      key={branch._id}
                      onClick={() => { setBranchId(branch._id); setCurrentStep(1); }}
                      className={`p-5 rounded-2xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 ${branchId === branch._id ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                    >
                      <p className="font-semibold text-foreground">{branch.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{branch.address}, {branch.city}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Services (MULTI-SELECT) ───────────────────────────── */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-1">Select Your Services</h2>
              <p className="text-sm text-muted-foreground mb-6">Pick one or more — mix and match as needed</p>

              {dbServices === undefined || (dbServices as any) === null ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading services...</p>
                </div>
              ) : dbServices.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-xl border border-border">
                  <p className="text-muted-foreground mb-2">No services available</p>
                  <p className="text-sm text-muted-foreground">Please check back later or contact support</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Core services */}
                  {coreServices.filter(s => s.showOnCustomerSide !== false).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Core Services</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {coreServices
                          .filter(s => s.showOnCustomerSide !== false)
                          .sort((a, b) => {
                            const order: Record<string, number> = { wash_and_dry: 0, wash_only: 1, dry_only: 2 };
                            return (order[a.code] ?? 99) - (order[b.code] ?? 99);
                          })
                          .map(svc => {
                            const isSelected = selectedServices.has(svc._id);
                            const unitPrice = svc.price ?? svc.basePrice ?? 0;
                            const priceLabel = svc.pricingType === 'per_kg'
                              ? `₵${unitPrice.toFixed(2)}/kg`
                              : svc.pricingType === 'per_item'
                              ? `₵${unitPrice.toFixed(2)}/item`
                              : `₵${unitPrice.toFixed(2)}/load`;
                            return (
                              <ServiceCard
                                key={svc._id}
                                icon={getServiceIcon(svc.code)}
                                title={svc.name}
                                description={svc.description || ''}
                                isSelected={isSelected}
                                onClick={() => toggleService(svc)}
                                code={svc.code}
                                imageUrl={svc.imageUrl}
                                price={priceLabel}
                              />
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Add-on services */}
                  {addonServices.filter(s => s.showOnCustomerSide !== false).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Add-ons</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {addonServices
                          .filter(s => s.showOnCustomerSide !== false)
                          .map(svc => {
                            const isSelected = selectedServices.has(svc._id);
                            const unitPrice = svc.price ?? svc.basePrice ?? 0;
                            return (
                              <button
                                key={svc._id}
                                onClick={() => toggleService(svc)}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                                  isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    {(() => { const Icon = getServiceIcon(svc.code); return <Icon className="w-5 h-5" />; })()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{svc.name}</p>
                                    {svc.description && <p className="text-xs text-muted-foreground">{svc.description}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                  <span className="text-sm font-semibold text-primary">₵{unitPrice.toFixed(2)}</span>
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Selected summary chip bar */}
                  {selectedServices.size > 0 && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs font-semibold text-primary mb-2">Selected ({selectedServices.size})</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedServicesList.map(l => (
                          <span key={l.serviceId} className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {l.serviceName}
                            <button onClick={() => {
                              setSelectedServices(prev => {
                                const next = new Map(prev);
                                next.delete(l.serviceId);
                                return next;
                              });
                            }} className="hover:text-destructive transition-colors">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Clothes ────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-display font-semibold mb-1">How Many Clothes?</h2>
              <div className="max-w-md mx-auto">
                <p className="text-sm font-medium text-foreground mb-3">Select your items</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">👕</span>
                      <div>
                        <p className="text-sm font-medium">Regular Clothes</p>
                        <p className="text-xs text-muted-foreground">Shirts, underwear, socks · ~0.5 kg each</p>
                      </div>
                    </div>
                    <Counter value={clothesCount} onChange={(v) => setClothesCount(Math.max(0, v))} />
                  </div>
                  {HEAVY_ITEMS.map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.emoji}</span>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">~{item.weightPerItem} kg each</p>
                        </div>
                      </div>
                      <Counter value={heavyItems[item.key]} onChange={(v) => updateHeavyItem(item.key, v)} />
                    </div>
                  ))}
                </div>

                {estimatedWeight > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="w-4 h-4 text-primary flex-shrink-0" />
                        Total items added
                      </div>
                      <span className="font-bold text-primary text-lg">{clothesCount + Object.values(heavyItems).reduce((a, b) => a + b, 0)} items</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="w-4 h-4 text-primary flex-shrink-0" />
                        Estimated total weight
                      </div>
                      <span className="font-bold text-primary text-lg">~{estimatedWeight.toFixed(1)} kg</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Whites ─────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-4 sm:mb-6">Do You Have Whites?</h2>
              <div className="max-w-md mx-auto space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => { setHasWhites(true); setSeparateDisclaimer(false); setMixDisclaimer(false); }}
                    className={`p-4 sm:p-6 rounded-xl border-2 transition-all ${hasWhites === true ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    <span className="text-3xl sm:text-4xl mb-2 block">👕</span>
                    <span className="font-medium text-sm sm:text-base">Yes, I have whites</span>
                  </button>
                  <button
                    onClick={() => { setHasWhites(false); setSeparateDisclaimer(false); setMixDisclaimer(false); }}
                    className={`p-4 sm:p-6 rounded-xl border-2 transition-all ${hasWhites === false ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    <span className="text-3xl sm:text-4xl mb-2 block">🎨</span>
                    <span className="font-medium text-sm sm:text-base">No whites</span>
                  </button>
                </div>

                {hasWhites && (
                  <div className="space-y-4 animate-fade-in">
                    <p className="text-sm text-muted-foreground">Would you like us to wash your whites separately?</p>
                    <div className="space-y-3">
                      <button
                        onClick={() => { setWashSeparately(true); setMixDisclaimer(false); setSeparateDisclaimer(false); }}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${washSeparately ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      >
                        <span className="font-medium">Wash separately</span>
                        <span className="block text-sm text-muted-foreground">Recommended to prevent color bleeding</span>
                      </button>
                      <button
                        onClick={() => { setWashSeparately(false); setSeparateDisclaimer(false); setMixDisclaimer(false); }}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${!washSeparately ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      >
                        <span className="font-medium">Mix with colors</span>
                        <span className="block text-sm text-muted-foreground">May cause color transfer</span>
                      </button>
                    </div>

                    {washSeparately && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 animate-fade-in">
                        <Checkbox id="separate-disclaimer" checked={separateDisclaimer} onCheckedChange={(c) => setSeparateDisclaimer(c as boolean)} />
                        <Label htmlFor="separate-disclaimer" className="text-sm cursor-pointer leading-relaxed">
                          I understand that washing whites separately is counted as an <strong>extra load</strong> and will <strong>incur an additional charge</strong>
                        </Label>
                      </div>
                    )}

                    {!washSeparately && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20 animate-fade-in">
                        <Checkbox id="mix-disclaimer" checked={mixDisclaimer} onCheckedChange={(c) => setMixDisclaimer(c as boolean)} />
                        <Label htmlFor="mix-disclaimer" className="text-sm cursor-pointer leading-relaxed">
                          I understand that mixing whites with colors may cause color bleeding, and I accept responsibility for any color transfer.
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 4: Pickup / Delivery (REDESIGNED) ────────────────────── */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-2">Pickup & Delivery</h2>
              <p className="text-sm text-muted-foreground mb-6">How would you like to get your laundry to us?</p>

              <div className="max-w-2xl mx-auto space-y-6">
                {/* Option selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setPickupOption('self')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${pickupOption === 'self' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${pickupOption === 'self' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <span className="font-semibold">Drop off myself</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Bring clothes to the branch. No extra fee.</p>
                  </button>

                  <button
                    onClick={() => setPickupOption('pickup_delivery')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${pickupOption === 'pickup_delivery' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${pickupOption === 'pickup_delivery' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <Truck className="w-5 h-5" />
                      </div>
                      <span className="font-semibold">Schedule pickup</span>
                    </div>
                    <p className="text-xs text-muted-foreground">We collect from your address. Delivery fee applies.</p>
                  </button>
                </div>

                {/* Pickup scheduling form */}
                {pickupOption === 'pickup_delivery' && (
                  <div className="space-y-5 animate-fade-in p-4 rounded-xl bg-muted/40 border border-border">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Schedule your pickup
                    </p>

                    {/* Date */}
                    <div>
                      <Label className="text-sm mb-2 block">Pickup Date *</Label>
                      <div className="flex gap-2 flex-wrap">
                        {availableDates.map(d => (
                          <button
                            key={d.value}
                            onClick={() => setPickupDate(d.value)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                              pickupDate === d.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50 bg-card'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time slot */}
                    <div>
                      <Label className="text-sm mb-2 block">
                        <Clock className="w-3.5 h-3.5 inline mr-1" />
                        Time Slot *
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TIME_SLOTS.map(slot => (
                          <button
                            key={slot}
                            onClick={() => setPickupTimeSlot(slot)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                              pickupTimeSlot === slot ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50 bg-card'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <Label htmlFor="pickupAddress" className="text-sm mb-1 block">
                        <MapPin className="w-3.5 h-3.5 inline mr-1" />
                        Pickup Address *
                      </Label>
                      <Input
                        id="pickupAddress"
                        value={pickupAddress}
                        onChange={e => setPickupAddress(e.target.value)}
                        placeholder="e.g. 14 Independence Ave, near Shoprite"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="pickupCity" className="text-sm mb-1 block">City *</Label>
                        <Input
                          id="pickupCity"
                          value={pickupCity}
                          onChange={e => setPickupCity(e.target.value)}
                          placeholder="e.g. Accra"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pickupPhone" className="text-sm mb-1 block">Contact Number</Label>
                        <Input
                          id="pickupPhone"
                          value={pickupPhone}
                          onChange={e => setPickupPhone(e.target.value)}
                          placeholder="Defaults to your number"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Summary chip */}
                    {pickupDate && pickupTimeSlot && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">
                          Scheduled for <strong className="text-foreground">{availableDates.find(d => d.value === pickupDate)?.label ?? pickupDate}</strong> at <strong className="text-foreground">{pickupTimeSlot}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {pickupOption === 'self' && (
                  <p className="text-xs text-muted-foreground text-center bg-muted/50 rounded-lg p-3">
                    You'll drop your laundry at the branch you selected. No delivery fee.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 5: Customer Details ────────────────────────────────────── */}
          {currentStep === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-4 sm:mb-6">Your Details</h2>
              <div className="max-w-md mx-auto space-y-4">
                {isAuthenticated && convexUser ? (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Using your account information:</p>
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {convexUser.name || clerkUser?.fullName}</p>
                      <p><strong>Phone:</strong> {convexUser.phoneNumber}</p>
                      {(convexUser.email || clerkUser?.emailAddresses?.[0]?.emailAddress) && (
                        <p><strong>Email:</strong> {convexUser.email || clerkUser?.emailAddresses?.[0]?.emailAddress}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      To update your info, visit your{' '}
                      <Link href="/dashboard/profile" className="text-primary hover:underline">profile page</Link>.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <InternationalPhoneInput id="phone" value={customerInfo.phone} onChange={(val) => setCustomerInfo({ ...customerInfo, phone: val })} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" value={customerInfo.email} onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })} placeholder="your.email@example.com" className="mt-1" required />
                      <p className="text-xs text-muted-foreground mt-1">Required for guest orders.</p>
                    </div>
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} placeholder="Enter your full name" className="mt-1" required />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea id="notes" value={customerInfo.notes} onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })} placeholder="Any special instructions?" className="mt-1" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 6: Summary ────────────────────────────────────────────── */}
          {currentStep === 6 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-2">Order Summary</h2>
              <p className="text-sm text-muted-foreground mb-5">Review everything before placing your order.</p>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30 mb-6">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-warning">Prices may differ at the station</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Estimates below are based on the information you've entered. Final price confirmed at check-in after weighing.
                  </p>
                </div>
              </div>

              <div className="max-w-md mx-auto">

                {/* Services breakdown */}
                <div className="rounded-xl border border-border overflow-hidden mb-4">
                  <div className="px-4 py-3 bg-muted/50 border-b border-border">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Services</p>
                  </div>
                  {recomputedLines.map(l => (
                    <div key={l.serviceId} className="flex justify-between items-center py-3 px-4 border-b border-border last:border-b-0 gap-4">
                      <div>
                        <p className="text-sm font-medium">{l.serviceName}</p>
                        <p className="text-xs text-muted-foreground">{l.quantity.toFixed(1)} {l.unit} × ₵{l.unitPrice.toFixed(2)}</p>
                      </div>
                      <span className="text-sm font-semibold text-right flex-shrink-0">₵{l.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Order details */}
                <div className="rounded-xl border border-border overflow-hidden mb-6">
                  {[
                    { label: 'Regular items', value: `${clothesCount} pieces (~${(clothesCount * 0.5).toFixed(1)} kg)` },
                    ...HEAVY_ITEMS.filter(item => heavyItems[item.key] > 0).map(item => ({
                      label: item.label,
                      value: `${heavyItems[item.key]} ${item.emoji} (~${(heavyItems[item.key] * item.weightPerItem).toFixed(1)} kg)`,
                    })),
                    { label: 'Est. Total Weight', value: `~${estimatedWeight.toFixed(1)} kg` },
                    { label: 'Est. Wash Cycles', value: `${estimatedLoads} cycle${estimatedLoads !== 1 ? 's' : ''}` },
                    {
                      label: 'Whites',
                      value: hasWhites ? (washSeparately ? 'Separate wash (+1 cycle)' : 'Mixed with colors') : 'None',
                    },
                    { label: 'Branch', value: branches.find(b => b._id === branchId)?.name || 'Not selected' },
                    {
                      label: 'Pickup',
                      value: pickupOption === 'pickup_delivery'
                        ? `${availableDates.find(d => d.value === pickupDate)?.label ?? pickupDate} · ${pickupTimeSlot}`
                        : 'Self drop-off',
                    },
                    ...(pickupOption === 'pickup_delivery' ? [{ label: 'Address', value: `${pickupAddress}, ${pickupCity}` }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-start py-3 px-4 border-b border-border last:border-b-0 gap-4">
                      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
                      <span className="text-sm font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Loyalty redemption */}
                {isAuthenticated && (loyaltyBalance?.points ?? 0) >= 10 && (
                  <div className="mb-4 p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">Redeem Loyalty Points</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          You have <span className="font-bold text-primary">{loyaltyBalance?.points ?? 0} pts</span> — redeem 10 for a free wash
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRedeemLoyaltyInline(!redeemLoyaltyInline)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${redeemLoyaltyInline ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${redeemLoyaltyInline ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {redeemLoyaltyInline && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">✓ 10 loyalty points will be redeemed — this wash is on us!</p>
                    )}
                  </div>
                )}

                {/* Estimated total */}
                <div className="bg-primary/5 rounded-xl p-4 mb-5 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-base font-semibold">Estimated Total</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{estimatedLoads} cycle{estimatedLoads !== 1 ? 's' : ''} across {selectedServices.size} service{selectedServices.size !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-2xl font-display font-bold text-gradient">
                      ₵{estimatedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Customer info */}
                <div className="bg-card rounded-xl border border-border p-4">
                  <h4 className="font-medium mb-2 text-sm">Contact:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isAuthenticated && convexUser
                      ? <>{convexUser.name || clerkUser?.fullName}<br />{convexUser.phoneNumber}</>
                      : <>{customerInfo.name}<br />{customerInfo.phone}</>
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0 mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              : currentStep === STEPS.length - 1 ? 'Place Order' : 'Continue'
            }
            {!isSubmitting && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-3xl mx-auto px-4 pt-24 pb-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}