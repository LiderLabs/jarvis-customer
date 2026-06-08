"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useQuery } from "convex/react"
import { api } from "@jordan6699/washlab-backend/api"
import { OrderStatus } from "@/types"
import { useCurrentCustomer } from "@/hooks/use-current-customer"
import {
  Search,
  Phone,
  MessageCircle,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  Calendar,
  MapPin,
  DollarSign,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  ChevronDown,
  List,
  Droplets,
  Wind,
  Shirt,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

// Order status stages for timeline
const ORDER_STATUSES = [
  {
    status: "pending_dropoff",
    label: "Order Placed",
    icon: ShoppingBag,
    color: "bg-orange-500",
  },
  {
    status: "checked_in",
    label: "Checked In",
    icon: Package,
    color: "bg-blue-500",
  },
  {
    status: "sorting",
    label: "Sorting",
    icon: Package,
    color: "bg-indigo-500",
  },
  {
    status: "washing",
    label: "Washing",
    icon: Droplets,
    color: "bg-cyan-500",
  },
  {
    status: "drying",
    label: "Drying",
    icon: Wind,
    color: "bg-sky-500",
  },
  {
    status: "folding",
    label: "Folding",
    icon: Shirt,
    color: "bg-teal-500",
  },
  {
    status: "ready",
    label: "Ready",
    icon: Package,
    color: "bg-emerald-500",
  },
  {
    status: "completed",
    label: "Completed",
    icon: CheckCircle2,
    color: "bg-green-600",
  },
  {
    status: "cancelled",
    label: "Cancelled",
    icon: AlertCircle,
    color: "bg-red-500",
  },
  // Legacy statuses for backward compatibility
  {
    status: "pending",
    label: "Order Placed",
    icon: ShoppingBag,
    color: "bg-orange-500",
  },
  {
    status: "in_progress",
    label: "In Progress",
    icon: Loader2,
    color: "bg-amber-500",
  },
  {
    status: "ready_for_pickup",
    label: "Ready",
    icon: Package,
    color: "bg-emerald-500",
  },
  {
    status: "delivered",
    label: "Delivered",
    icon: Truck,
    color: "bg-purple-500",
  },
] as const

// Filter to only main (non-legacy) statuses for timeline display
const MAIN_STATUSES = ORDER_STATUSES.filter(
  (s) =>
    !["pending", "in_progress", "ready_for_pickup", "delivered"].includes(
      s.status
    )
)

function TrackPageContent() {
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: isAuthLoading } = useCurrentCustomer()
  const [searchQuery, setSearchQuery] = useState("")
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showActiveOrders, setShowActiveOrders] = useState(false)
  const activeOrdersRef = useRef<HTMLDivElement | null>(null)

  // Fetch active orders for logged-in user
  const activeOrders = useQuery(
    api.customers.getActiveOrders,
    isAuthenticated ? {} : "skip"
  ) as
    | Array<{
        _id: string
        orderNumber: string
        status: string
        createdAt: number
        finalPrice: number
      }>
    | undefined

  // Fetch order from backend
  const order = useQuery(
    api.orders.getByOrderNumber,
    orderNumber ? { orderNumber } : "skip"
  )

  // Populate search query from URL parameter
  useEffect(() => {
    const orderParam = searchParams.get("order")
    if (orderParam && !orderNumber) {
      // Only set if we don't already have an order number to avoid loops
      setSearchQuery(orderParam)
      setOrderNumber(orderParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Close active orders dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showActiveOrders &&
        activeOrdersRef.current &&
        !activeOrdersRef.current.contains(event.target as Node)
      ) {
        setShowActiveOrders(false)
      }
    }

    if (showActiveOrders) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [showActiveOrders])

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter an order number")
      return
    }
    setOrderNumber(searchQuery.trim().toUpperCase())
    setShowActiveOrders(false) // Close active orders dropdown when searching
  }

  const handleSelectActiveOrder = (selectedOrderNumber: string) => {
    setSearchQuery(selectedOrderNumber)
    setOrderNumber(selectedOrderNumber)
    setShowActiveOrders(false)
    toast.success("Order number selected")
  }

  const handleCopyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber)
      setCopied(true)
      toast.success("Order number copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Map legacy statuses to new statuses for timeline
  const mapStatusForTimeline = (status: string): string => {
    const mapping: Record<string, string> = {
      pending: "pending_dropoff",
      in_progress: "washing",
      ready_for_pickup: "ready",
      delivered: "completed",
    }
    return mapping[status] || status
  }

  const getStatusIndex = (status: string) => {
    // Map legacy statuses first
    const mapped = mapStatusForTimeline(status)

    // Find index in main statuses array
    return MAIN_STATUSES.findIndex((s) => s.status === mapped)
  }

  const mappedStatus = order
    ? mapStatusForTimeline(order.status)
    : ""
  const currentStatusIndex = order ? getStatusIndex(order.status) : -1
  const isCompleted =
    order?.status === "completed" || mappedStatus === "completed"
  const isCancelled = order?.status === "cancelled"
  const isReady =
    order?.status === "ready" || order?.status === "ready_for_pickup"
  const isPending =
    order?.status === "pending_dropoff" || order?.status === "pending"

  const sendWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hi, I have a question about my Rapid Wash order ${order?.orderNumber || ""}.`
    )
    window.open(`https://wa.me/233XXXXXXXXX?text=${message}`, "_blank")
  }

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "MMM dd, yyyy â€¢ h:mm a")
  }

  const formatServiceType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Map backend status to frontend OrderStatus type
  const mapStatus = (status: string): OrderStatus => {
    const statusMap: Record<string, OrderStatus> = {
      // New statuses
      pending_dropoff: "pending_dropoff",
      checked_in: "checked_in",
      sorting: "sorting",
      washing: "washing",
      drying: "drying",
      folding: "folding",
      ready: "ready",
      completed: "completed",
      cancelled: "cancelled",
      // Legacy statuses
      pending: "pending_dropoff",
      in_progress: "washing",
      ready_for_pickup: "ready",
      delivered: "out_for_delivery",
    }
    return statusMap[status] || "pending_dropoff"
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
      <Navbar />

      <div className='container max-w-4xl mx-auto px-4 pt-24 pb-16'>
        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4'>
            <Sparkles className='w-8 h-8 text-primary' />
          </div>
          <h1 className='text-3xl sm:text-4xl font-display font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
            Track Your Order
          </h1>
          <p className='text-muted-foreground text-sm sm:text-base max-w-xl mx-auto'>
            Enter your order number to check the real-time status of your
            laundry
          </p>
        </div>

        {/* Search Box */}
        <Card className='mb-8 shadow-lg border-2'>
          <CardContent className='p-6'>
            {/* Active Orders Section for Logged-in Users */}
            {isAuthenticated && !isAuthLoading && (
              <div className='mb-4'>
                {activeOrders === undefined ? (
                  <div className='mb-3 p-3 rounded-lg bg-muted/50 border border-dashed text-center'>
                    <Loader2 className='w-4 h-4 animate-spin mx-auto mb-2 text-muted-foreground' />
                    <p className='text-sm text-muted-foreground'>
                      Loading active orders...
                    </p>
                  </div>
                ) : activeOrders.length > 0 ? (
                  <div className='relative' ref={activeOrdersRef}>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setShowActiveOrders(!showActiveOrders)}
                      className='w-full justify-between mb-3'
                    >
                      <span className='flex items-center gap-2'>
                        <List className='w-4 h-4' />
                        <span>Active Orders ({activeOrders.length})</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${showActiveOrders ? "rotate-180" : ""}`}
                      />
                    </Button>

                    {showActiveOrders && (
                      <div className='absolute z-10 w-full mt-2'>
                        <Card className='shadow-xl border-2'>
                          <CardContent className='p-0'>
                            <div className='max-h-64 overflow-y-auto'>
                              {activeOrders.map(
                                (activeOrder: {
                                  _id: string
                                  orderNumber: string
                                  status: string
                                  createdAt: number
                                  finalPrice: number
                                }) => (
                                  <button
                                    key={activeOrder._id}
                                    type='button'
                                    onClick={() =>
                                      handleSelectActiveOrder(
                                        activeOrder.orderNumber
                                      )
                                    }
                                    className='w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0'
                                  >
                                    <div className='flex items-center justify-between'>
                                      <div className='flex-1 min-w-0'>
                                        <div className='flex items-center gap-2 mb-1'>
                                          <span className='font-mono font-semibold text-sm'>
                                            {activeOrder.orderNumber}
                                          </span>
                                          <StatusBadge
                                            status={mapStatus(
                                              activeOrder.status
                                            )}
                                            size='sm'
                                          />
                                        </div>
                                        <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                                          <span className='flex items-center gap-1'>
                                            <Calendar className='w-3 h-3' />
                                            {format(
                                              new Date(activeOrder.createdAt),
                                              "MMM dd, yyyy"
                                            )}
                                          </span>
                                          <span className='flex items-center gap-1'>
                                            <DollarSign className='w-3 h-3' />â‚µ
                                            {activeOrder.finalPrice.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                      <ChevronDown className='w-4 h-4 text-muted-foreground rotate-[-90deg]' />
                                    </div>
                                  </button>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='mb-3 p-3 rounded-lg bg-muted/50 border border-dashed text-center'>
                    <p className='text-sm text-muted-foreground'>
                      You don&apos;t have any active orders at the moment.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className='flex flex-col sm:flex-row gap-3'>
              <div className='relative flex-1'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground' />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder='Enter order number (e.g. WL-2024-001234)'
                  className='pl-12 h-12 text-base'
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={
                  !searchQuery.trim() ||
                  (order === undefined && orderNumber !== null)
                }
                size='lg'
                className='h-12 px-8'
              >
                {order === undefined && orderNumber !== null ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className='w-4 h-4 mr-2' />
                    Track
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {order === undefined && orderNumber && (
          <Card className='shadow-lg'>
            <CardContent className='p-12 text-center'>
              <Loader2 className='w-12 h-12 animate-spin text-primary mx-auto mb-4' />
              <p className='text-muted-foreground'>
                Searching for your order...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order Not Found */}
        {order === null && orderNumber && (
          <Card className='shadow-lg border-destructive/50'>
            <CardContent className='p-12 text-center'>
              <div className='w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4'>
                <AlertCircle className='w-10 h-10 text-destructive' />
              </div>
              <h3 className='text-xl font-semibold mb-2'>Order Not Found</h3>
              <p className='text-muted-foreground mb-6'>
                We couldn&apos;t find an order with that number. Please check
                and try again.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setOrderNumber(null)
                }}
              >
                Try Another Order
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Order Found */}
        {order && (
          <div className='space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            {/* Order Header Card */}
            <Card className='shadow-xl border-2 overflow-hidden'>
              <div
                className={`h-2 w-full ${isCancelled ? "bg-destructive" : isCompleted ? "bg-green-600" : isReady ? "bg-emerald-500" : "bg-primary"}`}
              />
              <CardHeader className='pb-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                  <div className='flex-1 min-w-0'>
                    <CardDescription className='text-xs uppercase tracking-wider mb-2'>
                      Order Number
                    </CardDescription>
                    <div className='flex items-center gap-3'>
                      <CardTitle className='text-2xl sm:text-3xl font-mono font-bold break-all'>
                        {order.orderNumber}
                      </CardTitle>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 shrink-0'
                        onClick={handleCopyOrderNumber}
                      >
                        {copied ? (
                          <Check className='w-4 h-4 text-green-600' />
                        ) : (
                          <Copy className='w-4 h-4' />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className='shrink-0'>
                    <StatusBadge status={mapStatus(order.status)} size='lg' />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4'>
                  <div className='flex items-start gap-3'>
                    <Calendar className='w-5 h-5 text-muted-foreground shrink-0 mt-0.5' />
                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>
                        Order Date
                      </p>
                      <p className='text-sm font-medium'>
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <Clock className='w-5 h-5 text-muted-foreground shrink-0 mt-0.5' />
                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>
                        Last Updated
                      </p>
                      <p className='text-sm font-medium'>
                        {formatDate(order.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3'>
                    <DollarSign className='w-5 h-5 text-muted-foreground shrink-0 mt-0.5' />
                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>
                        Total Amount
                      </p>
                      <p className='text-sm font-medium'>
                        â‚µ{order.finalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card className='shadow-lg'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Package className='w-5 h-5' />
                  Order Status
                </CardTitle>
                <CardDescription>
                  Track your order through each stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='relative'>
                  {/* Timeline */}
                  <div className='space-y-6'>
                    {MAIN_STATUSES.map((statusInfo, index) => {
                      const StatusIcon = statusInfo.icon
                      const isActive = index <= currentStatusIndex
                      const isCurrent = index === currentStatusIndex

                      return (
                        <div
                          key={statusInfo.status}
                          className='relative flex gap-4'
                        >
                          {/* Timeline Line */}
                          {index < MAIN_STATUSES.length - 1 && (
                            <div className='absolute left-6 top-12 w-0.5 h-full'>
                              <div
                                className={`w-full transition-all duration-500 ${
                                  index < currentStatusIndex
                                    ? statusInfo.color
                                    : "bg-muted"
                                }`}
                                style={{ height: isActive ? "100%" : "0%" }}
                              />
                            </div>
                          )}

                          {/* Icon */}
                          <div
                            className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                              isCurrent
                                ? `${statusInfo.color} text-white shadow-lg scale-110`
                                : isActive
                                  ? `${statusInfo.color} text-white`
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <StatusIcon
                              className={`w-5 h-5 ${isCurrent ? "animate-pulse" : ""}`}
                            />
                          </div>

                          {/* Content */}
                          <div className='flex-1 pt-1 pb-6'>
                            <div className='flex items-center justify-between mb-1'>
                              <h4
                                className={`font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                              >
                                {statusInfo.label}
                              </h4>
                              {isCurrent && (
                                <span className='text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium'>
                                  Current
                                </span>
                              )}
                              {isActive && !isCurrent && (
                                <CheckCircle2 className='w-4 h-4 text-green-600' />
                              )}
                            </div>
                            {isCurrent && (
                              <p className='text-sm text-muted-foreground'>
                                {(order.status === "pending_dropoff" ||
                                  order.status === "pending") &&
                                  "Your order has been placed and is awaiting drop-off at the branch"}
                                {order.status === "checked_in" &&
                                  "Your order has been received and checked in at the branch"}
                                {order.status === "sorting" &&
                                  "Your items are being sorted and organized"}
                                {order.status === "washing" &&
                                  "Your laundry is being washed"}
                                {order.status === "drying" &&
                                  "Your laundry is being dried"}
                                {order.status === "folding" &&
                                  "Your laundry is being folded and prepared"}
                                {(order.status === "ready" ||
                                  order.status === "ready_for_pickup") &&
                                  "Your laundry is ready for pickup"}
                                {order.status === "delivered" &&
                                  "Your order has been delivered"}
                                {order.status === "completed" &&
                                  "Order completed successfully"}
                                {order.status === "cancelled" &&
                                  "This order has been cancelled"}
                                {order.status === "in_progress" &&
                                  "Your laundry is being processed"}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Delivery Status Card — only for delivery orders */}
            {(order as any).isDelivery && (
              <Card className={`shadow-xl border-2 ${
                (order as any).driverStatus === 'delivered' ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' :
                (order as any).driverStatus === 'picked_up' ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' :
                'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20'
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Truck className="w-5 h-5" />
                    Delivery Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    {[
                      { key: 'pending_pickup', label: 'Preparing', icon: Package },
                      { key: 'picked_up', label: 'On the way', icon: Truck },
                      { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
                    ].map((stage, i) => {
                      const driverStatus = (order as any).driverStatus
                      const stageIndex = ['pending_pickup', 'picked_up', 'delivered'].indexOf(stage.key)
                      const currentIndex = ['pending_pickup', 'picked_up', 'delivered'].indexOf(driverStatus ?? 'pending_pickup')
                      const isActive = stageIndex <= currentIndex
                      const isCurrent = stageIndex === currentIndex
                      const Icon = stage.icon
                      return (
                        <div key={stage.key} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isCurrent ? 'bg-orange-500 text-white shadow-lg scale-110' :
                            isActive ? 'bg-green-500 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            <Icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                          </div>
                          <p className={`text-xs font-medium text-center ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {stage.label}
                          </p>
                          {i < 2 && (
                            <div className={`absolute mt-5 h-0.5 w-full max-w-[60px] ${isActive ? 'bg-green-500' : 'bg-muted'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className={`p-3 rounded-xl text-sm font-medium text-center ${
                    (order as any).driverStatus === 'delivered' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    (order as any).driverStatus === 'picked_up' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}>
                    {!(order as any).driverStatus || (order as any).driverStatus === 'pending_pickup'
                      ? '🧺 Your laundry is being prepared for pickup by the driver'
                      : (order as any).driverStatus === 'picked_up'
                      ? '🚚 Driver is on the way to your location!'
                      : '✅ Your laundry has been delivered!'}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Details */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Service Details */}
              <Card className='shadow-lg'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <ShoppingBag className='w-5 h-5' />
                    Service Details
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>
                      Service Type
                    </span>
                    <span className='text-sm font-medium'>
                      {formatServiceType(order.serviceType)}
                    </span>
                  </div>
                  {order.estimatedWeight && (
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Estimated Weight
                      </span>
                      <span className='text-sm font-medium'>
                        {order.estimatedWeight} kg
                      </span>
                    </div>
                  )}
                  {order.itemCount && (
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Items
                      </span>
                      <span className='text-sm font-medium'>
                        {order.itemCount} pieces
                      </span>
                    </div>
                  )}

                  <Separator />
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>
                      Base Price
                    </span>
                    <span className='text-sm font-medium'>
                      â‚µ{order.basePrice.toFixed(2)}
                    </span>
                  </div>
                  {order.isDelivery && (
                    <>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm text-muted-foreground'>
                          Delivery Fee
                        </span>
                        <span className='text-sm font-medium'>
                          â‚µ{order.deliveryFee.toFixed(2)}
                        </span>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div className='flex justify-between items-center pt-2'>
                    <span className='font-semibold'>Total</span>
                    <span className='text-lg font-bold text-primary'>
                      â‚µ{order.finalPrice.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery & Payment */}
              <Card className='shadow-lg'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <MapPin className='w-5 h-5' />
                    {order.isDelivery ? "Delivery Info" : "Pickup Info"}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {order.isDelivery ? (
                    <>
                      {order.deliveryAddress && (
                        <div>
                          <span className='text-xs text-muted-foreground'>
                            Address
                          </span>
                          <p className='text-sm font-medium mt-1'>
                            {order.deliveryAddress}
                          </p>
                        </div>
                      )}
                      {order.deliveryHall && (
                        <div>
                          <span className='text-xs text-muted-foreground'>
                            Hall
                          </span>
                          <p className='text-sm font-medium mt-1'>
                            {order.deliveryHall}
                          </p>
                        </div>
                      )}
                      {order.deliveryRoom && (
                        <div>
                          <span className='text-xs text-muted-foreground'>
                            Room
                          </span>
                          <p className='text-sm font-medium mt-1'>
                            {order.deliveryRoom}
                          </p>
                        </div>
                      )}
                      {order.deliveryPhoneNumber && (
                        <div>
                          <span className='text-xs text-muted-foreground'>
                            Contact
                          </span>
                          <p className='text-sm font-medium mt-1'>
                            {order.deliveryPhoneNumber}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <span className='text-xs text-muted-foreground'>
                        Pickup Location
                      </span>
                      <p className='text-sm font-medium mt-1'>
                        Branch Location
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        Please bring your order number when picking up
                      </p>
                    </div>
                  )}
                  <Separator />
                  <div>
                    <span className='text-xs text-muted-foreground'>
                      Payment Status
                    </span>
                    <div className='mt-1'>
                      <StatusBadge
                        status={
                          order.paymentStatus === "paid"
                            ? "completed"
                            : order.paymentStatus === "pending"
                              ? "pending_dropoff"
                              : "completed"
                        }
                        size='sm'
                      />
                      {order.paymentMethod && (
                        <p className='text-xs text-muted-foreground mt-1'>
                          {order.paymentMethod
                            .split("_")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ready for Pickup Actions */}
            {isReady && (
              <Card className='shadow-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'>
                <CardContent className='p-6'>
                  <div className='text-center mb-6'>
                    <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 text-white mb-4'>
                      <CheckCircle2 className='w-8 h-8' />
                    </div>
                    <h3 className='text-xl font-bold mb-2'>
                      Your Laundry is Ready!
                    </h3>
                    <p className='text-muted-foreground'>
                      {order.isDelivery
                        ? "Your order will be delivered to your specified address"
                        : "You can now pick up your laundry at the branch"}
                    </p>
                  </div>
                  {!order.isDelivery && (
                    <div className='grid sm:grid-cols-2 gap-4'>
                      <Button
                        variant='outline'
                        size='lg'
                        className='h-auto py-4'
                      >
                        <Package className='w-5 h-5 mr-2' />
                        Pick Up in Store
                      </Button>
                      <Button size='lg' className='h-auto py-4'>
                        <Truck className='w-5 h-5 mr-2' />
                        Request Delivery
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pending Drop-off */}
            {(isPending || order.status === "pending_dropoff") && (
              <Card className='shadow-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'>
                <CardContent className='p-6 text-center'>
                  <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500 text-white mb-4'>
                    <Clock className='w-8 h-8' />
                  </div>
                  <h3 className='text-xl font-bold mb-2'>Awaiting Drop-off</h3>
                  <p className='text-muted-foreground mb-4'>
                    Please bring your clothes to your nearest Rapid Wash branch and
                    provide your order number
                  </p>
                  <div className='inline-flex items-center gap-2 px-4 py-2 bg-background rounded-lg border'>
                    <span className='text-2xl font-mono font-bold'>
                      {order.orderNumber}
                    </span>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      onClick={handleCopyOrderNumber}
                    >
                      {copied ? (
                        <Check className='w-4 h-4 text-green-600' />
                      ) : (
                        <Copy className='w-4 h-4' />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Support */}
            <Card className='shadow-lg'>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>Contact our support team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex flex-col sm:flex-row gap-3'>
                  <Button variant='outline' className='flex-1' size='lg'>
                    <Phone className='w-4 h-4 mr-2' />
                    Call Support
                  </Button>
                  <Button
                    variant='outline'
                    className='flex-1'
                    size='lg'
                    onClick={sendWhatsAppContact}
                  >
                    <MessageCircle className='w-4 h-4 mr-2' />
                    WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Initial Empty State */}
        {!order && !orderNumber && (
          <Card className='shadow-lg'>
            <CardContent className='p-12 text-center'>
              <div className='w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6'>
                <Package className='w-12 h-12 text-primary' />
              </div>
              <h3 className='text-xl font-semibold mb-2'>
                Start Tracking Your Order
              </h3>
              <p className='text-muted-foreground max-w-md mx-auto'>
                Enter your order number above to see the real-time status of
                your laundry order
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-background'>
          <Navbar />
          <div className='container max-w-4xl mx-auto px-4 pt-24 pb-12'>
            <div className='flex items-center justify-center min-h-[400px]'>
              <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
            </div>
          </div>
        </div>
      }
    >
      <TrackPageContent />
    </Suspense>
  )
}

