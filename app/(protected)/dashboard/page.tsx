'use client';

import { useQuery, useConvexAuth, usePaginatedQuery } from 'convex/react';
import { api } from '@jordan6699/washlab-backend/api';
import { Doc } from '@jordan6699/washlab-backend/dataModel';
import { useCurrentCustomer } from '@/hooks/use-current-customer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { OrderTable } from '@/components/customer/OrderTable';
import {
  Package,
  TrendingUp,
  Clock,
  Star,
  Plus,
  ChevronRight,
  Sparkles,
  Bell,
  Gift,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { OrderStatus } from '@/types';

export default function DashboardPage() {
  const { clerkUser, convexUser } = useCurrentCustomer();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Doc<"orders"> | null>(null);

  const profile = useQuery(
    api.customers.getProfile,
    isAuthenticated ? {} : "skip"
  );

  const loyaltyPointsResult = useQuery(
    api.customers.getLoyaltyPoints,
    isAuthenticated ? {} : "skip"
  );
  const loyaltyPoints = loyaltyPointsResult ?? { points: 0, totalEarned: 0, totalRedeemed: 0 };
  const nextRewardAt = 10;

  const { results: recentOrdersPages } = usePaginatedQuery(
    api.customers.getOrders,
    isAuthenticated ? {} : "skip",
    { initialNumItems: 3 }
  );
  const recentOrders = recentOrdersPages?.flat().slice(0, 3) ?? [];

  const unreadNotifications = useQuery(
    api.notifications.getUnreadCount,
    isAuthenticated ? {} : "skip"
  ) ?? 0;

  const userName = convexUser?.name || clerkUser?.firstName || clerkUser?.fullName || 'Customer';
  const stats = {
    totalOrders: profile?.orderCount ?? 0,
    completedOrders: profile?.completedOrderCount ?? 0,
    pendingOrders: (profile?.orderCount ?? 0) - (profile?.completedOrderCount ?? 0),
    totalSpent: 0,
  };
  const progress = (loyaltyPoints.points / nextRewardAt) * 100;

  const mapStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "pending_dropoff",
      in_progress: "washing",
      ready_for_pickup: "ready",
      delivered: "out_for_delivery",
      completed: "completed",
      cancelled: "cancelled",
    };
    return statusMap[status] || "pending_dropoff";
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Welcome Header — emoji removed */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here&apos;s what&apos;s happening with your laundry
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">Active orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders}</div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₵{stats.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Loyalty Points Card */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Loyalty Rewards
              </CardTitle>
              <CardDescription>
                Earn points with every order and get free washes!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Points</p>
                  <p className="text-3xl font-bold">
                    {loyaltyPoints.points}
                    <span className="text-lg font-normal text-muted-foreground">
                      {' '}/ {nextRewardAt}
                    </span>
                  </p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                  <Gift className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress to next reward</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {loyaltyPoints.points >= nextRewardAt ? (
                  <div className="mt-3">
                    <p className="text-xs text-green-600 font-semibold mb-2">🎉 You have a free wash ready!</p>
                    <Link href="/order">
                      <button className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                        Redeem Free Wash
                      </button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    {nextRewardAt - loyaltyPoints.points} more points to unlock a free wash!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>What would you like to do today?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/order" className='inline-block w-full'>
                <Button className="w-full justify-between" size="lg">
                  <span className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Place New Order
                  </span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/track" className='inline-block w-full'>
                <Button variant="outline" className="w-full justify-between" size="lg">
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Track Order
                  </span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard/orders" className='inline-block w-full'>
                <Button variant="outline" className="w-full justify-between" size="lg">
                  <span className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    View All Orders
                  </span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
              {unreadNotifications > 0 && (
                <Link href="/dashboard/notifications" className='inline-block w-full'>
                  <Button variant="outline" className="w-full justify-between" size="lg">
                    <span className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      View Notifications
                    </span>
                    <Badge variant="destructive" className="ml-auto mr-2">
                      {unreadNotifications}
                    </Badge>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest laundry orders</CardDescription>
              </div>
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <OrderTable
              orders={recentOrders}
              isLoading={false}
              onViewDetails={(order) => setSelectedOrder(order)}
            />
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        {selectedOrder && (
          <Dialog open={true} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Order Details - {selectedOrder.orderNumber}
                </DialogTitle>
                <DialogDescription>{selectedOrder.orderNumber}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Status</h3>
                  <StatusBadge status={mapStatus(selectedOrder.status) as OrderStatus} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Service Type</h3>
                    <p className="text-sm capitalize">
                      {selectedOrder.serviceType.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Order Type</h3>
                    <p className="text-sm capitalize">{selectedOrder.orderType.replace(/_/g, ' ')}</p>
                  </div>
                  {selectedOrder.actualWeight && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Weight</h3>
                      <p className="text-sm">{selectedOrder.actualWeight} kg</p>
                    </div>
                  )}
                  {selectedOrder.itemCount && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Items</h3>
                      <p className="text-sm">{selectedOrder.itemCount} items</p>
                    </div>
                  )}
                </div>

                {selectedOrder.isDelivery && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Delivery Address</h3>
                    <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                      {selectedOrder.deliveryHall && <p>{selectedOrder.deliveryHall}</p>}
                      {selectedOrder.deliveryRoom && <p>Room: {selectedOrder.deliveryRoom}</p>}
                      {selectedOrder.deliveryAddress && <p>{selectedOrder.deliveryAddress}</p>}
                      {selectedOrder.deliveryPhoneNumber && <p>Phone: {selectedOrder.deliveryPhoneNumber}</p>}
                    </div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium mb-2">Pricing</h3>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Base Price</span>
                      <span>₵{selectedOrder.basePrice.toFixed(2)}</span>
                    </div>
                    {selectedOrder.deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery Fee</span>
                        <span>₵{selectedOrder.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.finalPrice < selectedOrder.totalPrice && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-₵{(selectedOrder.totalPrice - selectedOrder.finalPrice).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>₵{selectedOrder.finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium mb-1">Created</p>
                    <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedOrder.status === 'completed' && (
                    <div>
                      <p className="font-medium mb-1">Completed</p>
                      <p>
                        {selectedOrder.statusHistory
                          .filter((h) => h.status === 'completed')
                          .map((h) => new Date(h.changedAt).toLocaleString())[0] || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => router.push(`/track?order=${selectedOrder.orderNumber}`)}
                >
                  Track This Order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </CustomerLayout>
  );
}
