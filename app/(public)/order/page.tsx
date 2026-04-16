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
} from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '@jordan6699/washlab-backend/dataModel';

const STEPS = ['Branch', 'Service', 'Clothes', 'Whites', 'Delivery', 'Details', 'Summary'];

// ── Heavy item definitions ────────────────────────────────────────────────────
const HEAVY_ITEMS = [
  { key: 'jeans',  label: 'Jeans / Trousers', emoji: '👖', weightPerItem: 1.0 },
  { key: 'duvet',  label: 'Duvet / Blanket',  emoji: '🛏️', weightPerItem: 4.0 },
  { key: 'towel',  label: 'Towel',            emoji: '🏊', weightPerItem: 0.8 },
] as const;

type HeavyItemKey = typeof HEAVY_ITEMS[number]['key'];
type HeavyItemCounts = Record<HeavyItemKey, number>;

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
}

interface VoucherResult {
  valid: boolean;
  voucher?: { discountType: string };
  discountAmount?: number;
  error?: string;
}

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

function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redeemLoyalty = searchParams?.get('redeem') === 'loyalty';
  const { isAuthenticated } = useConvexAuth();
  const { clerkUser, convexUser } = useCurrentCustomer();

  const [currentStep, setCurrentStep] = useState(0);
  const [branchAutoSet, setBranchAutoSet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherResult, setVoucherResult] = useState<null | { valid: boolean; discountAmount?: number; finalPrice?: number; voucher?: { code: string; name?: string; discountType: string; discountValue: number }; error?: string }>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [redeemLoyaltyInline, setRedeemLoyaltyInline] = useState(false);

  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [clothesCount, setClothesCount] = useState<number>(0);
  const [heavyItems, setHeavyItems] = useState<HeavyItemCounts>({ jeans: 0, duvet: 0, towel: 0 });
  const [hasWhites, setHasWhites] = useState<boolean | null>(null);
  const [washSeparately, setWashSeparately] = useState(true);
  const [mixDisclaimer, setMixDisclaimer] = useState(false);
  const [separateDisclaimer, setSeparateDisclaimer] = useState(false);
  const [branchId, setBranchId] = useState<string>('');
  const [branchSkipped, setBranchSkipped] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    phone: '', name: '', email: '', hall: '', room: '',
    deliveryAddress: '', deliveryPhone: '', notes: '',
  });

  const branches = (useQuery(api.branches.getActive, {}) ?? []) as Branch[];
  const customerProfile = useQuery((api as any).customers.getProfile, isAuthenticated ? {} : "skip");
  const dbServices = useQuery(
    (api as any).admin.getBranchServicesForCustomer,
    branchId ? { branchId: branchId as string } : "skip"
  ) ?? [];

  useEffect(() => {
    if ((dbServices as Service[]).length > 0) {
      console.log('WASHLAB_DEBUG', JSON.stringify(dbServices, null, 2))
    }
  }, [dbServices])
  const validateVoucher = useQuery(
    (api as any).vouchers.validate,
    voucherCode.length >= 3 && branchId ? { code: voucherCode.toUpperCase(), orderTotal: 1, branchId: branchId as string } : "skip"
  );
    const createOrder = useMutation(api.orders.createOnline);
    const redeemPointsMutation = useMutation((api as any).loyalty.redeemPoints);
  const applyVoucherMutation = useMutation((api as any).vouchers.applyToOrder);
const loyaltyBalance = useQuery(
  (api as any).loyalty.getBalance,
  "skip"
);

  useEffect(() => {
    if (convexUser && isAuthenticated) {
      setCustomerInfo(prev => ({
        ...prev,
        name: convexUser.name || clerkUser?.fullName || '',
        phone: convexUser.phoneNumber || '',
        email: convexUser.email || clerkUser?.emailAddresses?.[0]?.emailAddress || '',
      }));
      const prefBranch = (convexUser as { preferredBranchId?: string }).preferredBranchId;
      if (prefBranch && !branchAutoSet) {
        setBranchId(prefBranch);
        setBranchAutoSet(true);
        if (currentStep === 0) setCurrentStep(1);
      }
    }
  }, [convexUser, clerkUser, isAuthenticated]);

  useEffect(() => {
    const serviceFromUrl = searchParams.get('service');
    if (serviceFromUrl && dbServices.length > 0) {
      const service = (dbServices as Service[]).find(s => s.code === serviceFromUrl);
      if (service) setServiceType(serviceFromUrl as ServiceType);
    }
  }, [searchParams, dbServices]);

  useEffect(() => {
    if ((dbServices as any[]).length > 0 && !serviceType) {
      const washAndDry = (dbServices as any[]).find((s: any) => s.code === "wash_and_dry");
      setServiceType((washAndDry || (dbServices as any[])[0]).code as ServiceType);
    }
  }, [dbServices, serviceType]);

  const selectedDbService = (dbServices as Service[]).find(s => s.code === serviceType);

  // Weight: 0.3kg per regular item + heavy item weights
  const heavyItemsWeight = HEAVY_ITEMS.reduce(
    (total, item) => total + heavyItems[item.key] * item.weightPerItem, 0
  );
  const estimatedWeight = clothesCount * 0.5 + heavyItemsWeight;

  // Whites washed separately — attendant decides if extra load needed, no auto-charge
  const extraLoadsForWhites = 0;

  let estimatedLoads = 1;
  let estimatedPrice = 0;
  if (selectedDbService) {
    const basePrice = selectedDbService.price ?? selectedDbService.basePrice ?? 0;
    if (selectedDbService.pricingType === 'per_kg') {
      estimatedPrice = estimatedWeight * basePrice;
    } else {
      estimatedLoads = Math.ceil(estimatedWeight / 8) + extraLoadsForWhites;
      estimatedLoads = Math.max(1, estimatedLoads);
      estimatedPrice = estimatedLoads * basePrice;
    }
  }

  const updateHeavyItem = (key: HeavyItemKey, value: number) => {
    setHeavyItems(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return branchId !== '';
      case 1: return serviceType !== null;
      case 2: return clothesCount > 0 || Object.values(heavyItems).some(v => v > 0);
      case 3:
        if (hasWhites === null) return false;
        if (hasWhites === false) return true;
        return washSeparately ? separateDisclaimer : mixDisclaimer;
      case 4: return true;
      case 5:
        if (isAuthenticated && convexUser) return true;
        return !!(customerInfo.phone && customerInfo.name && customerInfo.email && customerInfo.hall && customerInfo.room);
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

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) return;
    if (validateVoucher === undefined) { toast.info('Checking voucher...'); return; }
    if (validateVoucher?.valid) {
      setVoucherResult(validateVoucher as any);
      if ((validateVoucher as any).voucher?.discountType === 'free_wash') toast.success('Free wash voucher applied!');
      else toast.success(`Voucher applied! You save GHS ${((validateVoucher as any)?.discountAmount ?? 0).toFixed(2)}`);
    } else {
      setVoucherResult(null);
      toast.error((validateVoucher as { error?: string })?.error || 'Invalid voucher');
    }
  };
  const handleSubmitOrder = async () => {
    if (!serviceType || !branchId) { toast.error('Please complete all required fields'); return; }
    setIsSubmitting(true);
    try {
      const orderData = {
        customerName: customerInfo.name || convexUser?.name || clerkUser?.fullName || '',
        customerPhoneNumber: customerInfo.phone || convexUser?.phoneNumber || '',
        customerEmail: customerInfo.email || convexUser?.email || clerkUser?.emailAddresses?.[0]?.emailAddress || '',
        branchId: branchId as Id<"branches">,
        serviceType,
        estimatedWeight,
        itemCount: clothesCount,
        estimatedLoads,
        whitesSeparate: hasWhites ? washSeparately : false,
        mixWithColors: hasWhites ? !washSeparately : false,
        isDelivery,
        deliveryAddress: isDelivery ? customerInfo.deliveryAddress : undefined,
        deliveryPhoneNumber: isDelivery ? (customerInfo.deliveryPhone || customerInfo.phone) : undefined,
        deliveryHall: isDelivery ? customerInfo.hall : undefined,
        deliveryRoom: isDelivery ? customerInfo.room : undefined,
        notes: customerInfo.notes || undefined,
        voucherCode: voucherResult?.valid ? voucherCode.trim().toUpperCase() : undefined,
      };
      const result = await createOrder(orderData as Parameters<typeof createOrder>[0]);
      // Apply voucher if one was validated
      if (voucherResult?.valid && result.orderId) {
        try {
          await applyVoucherMutation({ voucherCode: voucherCode.toUpperCase(), orderId: result.orderId });
        } catch (e) {
          toast.info('Order placed but voucher could not be applied. Mention it at the station.');
        }
      }
      // Auto-redeem loyalty points if coming from dashboard redeem button
      // Auto-redeem loyalty points if coming from dashboard redeem button
      if ((redeemLoyalty || redeemLoyaltyInline) && result.orderId) {
        try {
          await redeemPointsMutation({ orderId: result.orderId, pointsToRedeem: 10 });
          toast.success('Order placed! 10 loyalty points redeemed — enjoy your free wash.');
        } catch (e) {
          toast.success('Order placed successfully!');
          toast.info('Note: Loyalty points could not be auto-applied. Visit your dashboard to redeem.');
        }
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

  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  // Auto-skip branch step if customer has saved branch
  useEffect(() => {
    if (customerProfile?.branchId && !branchSkipped) {
      setBranchId(customerProfile.branchId);
      setBranchSkipped(true);
      if (currentStep === 0) setCurrentStep(1);
    }
  }, [customerProfile, branchSkipped, currentStep]);

  const copyOrderCode = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      toast.success('Order code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
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
            <div className="bg-primary/5 rounded-2xl p-4 sm:p-6 mb-8 text-left">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning flex-shrink-0" />
                Next Steps
              </h3>
              <ol className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                {[
                  'Bring your clothes to the selected branch',
                  `Show your order number ${orderNumber} to the attendant`,
                  'Your clothes will be weighed and final price calculated',
                  'Make payment and receive your bag tag',
                ].map((step, i) => (
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

          {/* Step 0: Branch Selection */}
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

          {/* Step 1: Service */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-4 sm:mb-6">Select Your Service</h2>
              {dbServices === undefined ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading services...</p>
                </div>
              ) : (dbServices as Service[]).length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-xl border border-border">
                  <p className="text-muted-foreground mb-2">No services available</p>
                  <p className="text-sm text-muted-foreground">Please check back later or contact support</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {([...(dbServices as Service[])].sort((a, b) => {
                    const order: Record<string, number> = { wash_and_dry: 0, wash_only: 1, dry_only: 2 };
                    return (order[a.code] ?? 99) - (order[b.code] ?? 99);
                 })).filter((service) => service.showOnCustomerSide !== false).map(service => {
                    const getIcon = (code: string) => {
                      if (code.includes('wash') && code.includes('dry')) return Sparkles;
                      if (code.includes('wash')) return Droplets;
                      if (code.includes('dry')) return Wind;
                      return Sparkles;
                    };
                    return (
                      <ServiceCard
                        key={service._id}
                        icon={getIcon(service.code)}
                        title={service.name}
                        description={service.description || ''}
                        isSelected={serviceType === service.code}
                        onClick={() => setServiceType(service.code as ServiceType)}
                        code={service.code}
                        imageUrl={service.imageUrl}
                        price={service.price != null
                          ? `₵${(service.price ?? 0).toFixed(2)}`
                          : service.pricingType === 'per_kg'
                          ? `₵${(service.basePrice ?? 0).toFixed(2)}/kg`
                          : `₵${(service.basePrice ?? 0).toFixed(2)}/load`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Clothes + Heavy Items */}
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
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.emoji}</span>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">~{item.weightPerItem} kg each</p>
                        </div>
                      </div>
                      <Counter
                        value={heavyItems[item.key]}
                        onChange={(v) => updateHeavyItem(item.key, v)}
                      />
                    </div>
                  ))}
                </div>

                {estimatedWeight > 0 && (
                  <div className="space-y-2">
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
                    <span className="font-bold text-primary text-lg">~{(estimatedWeight ?? 0).toFixed(1)} kg</span>
                  </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Whites */}
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

                    {/* Separate wash disclaimer — warns about extra charge */}
                    {washSeparately && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 animate-fade-in">
                        <Checkbox
                          id="separate-disclaimer"
                          checked={separateDisclaimer}
                          onCheckedChange={(checked) => setSeparateDisclaimer(checked as boolean)}
                        />
                        <Label htmlFor="separate-disclaimer" className="text-sm cursor-pointer leading-relaxed">
                          I understand that washing whites separately is counted as an{' '}
                          <strong>extra load</strong> and will <strong>incur an additional charge</strong>{' '}
                        </Label>
                      </div>
                    )}

                    {/* Mix disclaimer — warns about color transfer */}
                    {!washSeparately && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20 animate-fade-in">
                        <Checkbox
                          id="mix-disclaimer"
                          checked={mixDisclaimer}
                          onCheckedChange={(checked) => setMixDisclaimer(checked as boolean)}
                        />
                        <Label htmlFor="mix-disclaimer" className="text-sm cursor-pointer leading-relaxed">
                          I understand that mixing whites with colors may cause color bleeding,
                          and I accept responsibility for any color transfer.
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Branch & Delivery */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-4 sm:mb-6">Delivery Option</h2>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-3">
                  <Label>Delivery Option</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsDelivery(false)}
                      className="p-4 rounded-xl border-2 transition-all text-left border-primary bg-primary/5"
                    >
                      <span className="font-medium block mb-1">Self Service</span>
                      <span className="text-xs text-muted-foreground">Drop off your laundry and pick it up yourself.</span>
                    </button>
                    {['Drop-off + Delivery', 'Pickup + Self Pick', 'Full Service'].map(option => (
                      <button key={option} disabled className="p-4 rounded-xl border-2 text-left border-border bg-muted/30 opacity-60 cursor-not-allowed relative">
                        <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/30">
                          Coming soon
                        </span>
                        <span className="font-medium block mb-1 text-muted-foreground">{option}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3 bg-muted/50 rounded-lg p-3">
                    Delivery and pickup services coming soon. Jarvis currently operates as self-service only.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Customer Details */}
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
                      <p className="text-xs text-muted-foreground mt-1">We&apos;ll use this to send you updates via WhatsApp</p>
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" value={customerInfo.email} onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })} placeholder="your.email@example.com" className="mt-1" required />
                      <p className="text-xs text-muted-foreground mt-1">Required for guest orders. Used to link your order to your account when you register.</p>
                    </div>
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} placeholder="Enter your full name" className="mt-1" required />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hall">Hall/Hostel/Residence *</Label>
                    <Input id="hall" value={customerInfo.hall} onChange={(e) => setCustomerInfo({ ...customerInfo, hall: e.target.value })} placeholder="e.g. Akuafo Hall" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="room">Room Number/House Number *</Label>
                    <Input id="room" value={customerInfo.room} onChange={(e) => setCustomerInfo({ ...customerInfo, room: e.target.value })} placeholder="e.g. A302" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea id="notes" value={customerInfo.notes} onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })} placeholder="Any special instructions?" className="mt-1" />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Summary */}
          {currentStep === 6 && (
            <div className="animate-fade-in">
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-2">Order Summary</h2>
              <p className="text-sm text-muted-foreground mb-5">Review everything before placing your order.</p>

              {/* Price may differ banner */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30 mb-6">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-warning">Prices may differ at the station</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All estimates below are based on the information you've entered. Your clothes will be
                    physically weighed at check-in and the final price confirmed.
                  </p>
                </div>
              </div>

              <div className="max-w-md mx-auto">
                {/* Details table */}
                <div className="rounded-xl border border-border overflow-hidden mb-6">
                  {[
                    { label: 'Service', value: selectedDbService?.name || serviceType?.replace('_', ' & ') },
                    { label: 'Regular items', value: `${clothesCount} pieces (${(clothesCount * 0.5).toFixed(1)} kg)` },
                    // Show each heavy item that has a count > 0
                    ...HEAVY_ITEMS.filter(item => heavyItems[item.key] > 0).map(item => ({
                      label: item.label,
                      value: `${heavyItems[item.key]} ${item.emoji} (${(heavyItems[item.key] * item.weightPerItem).toFixed(1)} kg)`,
                    })),
                    { label: 'Est. Total Weight', value: `~${(estimatedWeight ?? 0).toFixed(1)} kg` },
                    // Only show loads row for per_load pricing
                    ...(selectedDbService?.pricingType !== 'per_kg' ? [{
                      label: 'Est. Wash Cycles',
                      value: `${estimatedLoads} cycle${estimatedLoads !== 1 ? 's' : ''}${extraLoadsForWhites > 0 ? ' (incl. 1 extra for whites)' : ''}`,
                    }] : []),
                    {
                      label: 'Whites',
                      value: hasWhites
                        ? washSeparately ? 'Separate wash (+1 cycle)' : 'Mixed with colors'
                        : 'None',
                    },
                    { label: 'Branch', value: branches.find(b => b._id === branchId)?.name || 'Not selected' },
                    { label: 'Delivery', value: 'Self Service' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-start py-3 px-4 border-b border-border last:border-b-0 gap-4">
                      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
                      <span className="text-sm font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Voucher code */}
              {/* <div className="mb-4 p-4 rounded-xl border border-border bg-muted/30">
                  <p className="text-sm font-semibold mb-3">Have a voucher code?</p>
                  {voucherResult?.valid ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">{voucherResult.voucher?.code} applied!</p>
                        <p className="text-xs text-muted-foreground">
                          {voucherResult.voucher?.discountType === 'free_wash' ? 'Free wash — no payment needed at station' : `-GHS ${(voucherResult?.discountAmount ?? 0).toFixed(2)} discount`}
                        </p>
                      </div>
                      <button onClick={() => { setVoucherResult(null); setVoucherCode(''); }} className="text-xs text-muted-foreground underline hover:text-foreground">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()} placeholder="Enter voucher code" className="flex-1 uppercase text-sm" maxLength={20} />
                      <Button type="button" variant="outline" onClick={handleApplyVoucher} disabled={!voucherCode.trim()} size="sm" className="px-4">
                        Apply
                      </Button>
                    </div>
                  )}
                </div>*/}

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
                      {selectedDbService && selectedDbService.pricingType !== 'per_kg' && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {estimatedLoads} cycle{estimatedLoads !== 1 ? 's' : ''} × ₵{(selectedDbService.basePrice ?? 0).toFixed(2)}/cycle{extraLoadsForWhites > 0 ? ' (incl. +1 whites)' : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-display font-bold text-gradient">
                      ₵{(estimatedPrice ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Delivery to */}
                <div className="bg-card rounded-xl border border-border p-4">
                  <h4 className="font-medium mb-2 text-sm">Delivery To:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isAuthenticated && convexUser
                      ? <>{convexUser.name || clerkUser?.fullName}<br />{customerInfo.hall}, Room {customerInfo.room}<br />{convexUser.phoneNumber}</>
                      : <>{customerInfo.name}<br />{customerInfo.hall}, Room {customerInfo.room}<br />{customerInfo.phone}</>
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0 mt-8">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || (currentStep === 1 && isAuthenticated && !!(convexUser as { preferredBranchId?: string })?.preferredBranchId) || isSubmitting} className="w-full sm:w-auto">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <Button onClick={handleNext} disabled={!canProceed() || isSubmitting} className="w-full sm:w-auto">
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

