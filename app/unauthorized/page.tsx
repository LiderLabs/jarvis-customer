"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import { useCurrentCustomer } from "@/hooks/use-current-customer"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Mail, LogOut, User, Building2, UserCheck } from "lucide-react"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user: clerkUser } = useUser()
  const { signOut } = useClerk()
  const { convexUser, isAdminOrAttendant, isLoading } = useCurrentCustomer()

  // If user is no longer admin/attendant, redirect to dashboard
  useEffect(() => {
    if (!isLoading && !isAdminOrAttendant && convexUser) {
      router.push("/dashboard")
    }
  }, [isAdminOrAttendant, isLoading, convexUser, router])

  // Show loading while checking
  if (isLoading || isAdminOrAttendant === undefined) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Checking permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center space-y-4'>
          <div className='mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center'>
            <AlertTriangle className='h-8 w-8 text-destructive' />
          </div>
          <div>
            <CardTitle className='text-2xl'>Access Denied</CardTitle>
            <CardDescription className='mt-2'>
              You don&apos;t have permission to access the Jarvis Customer App
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* User Info */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>
                Signed in as:
              </span>
              <Badge variant='outline' className='gap-1'>
                <User className='h-3 w-3' />
                {clerkUser?.emailAddresses[0]?.emailAddress ||
                  clerkUser?.username ||
                  "Unknown"}
              </Badge>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>Role:</span>
              <Badge variant='secondary' className='gap-1'>
                {isAdminOrAttendant ? (
                  <>
                    <UserCheck className='h-3 w-3' />
                    Admin / Staff
                  </>
                ) : (
                  "Customer"
                )}
              </Badge>
            </div>
          </div>

          {/* Info message */}
          <div className='bg-muted/50 p-4 rounded-lg'>
            <h4 className='font-medium mb-2'>Customer Access Required</h4>
            <p className='text-sm text-muted-foreground'>
              This application is the <strong>Jarvis Customer App</strong>,
              designed exclusively for customers to place orders and track their
              laundry services. Admin and staff accounts have access to different
              applications.
            </p>
          </div>

          {/* Different apps info */}
          <div className='bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800'>
            <h4 className='font-medium mb-2 text-blue-900 dark:text-blue-100'>
              Looking for something else?
            </h4>
            <div className='text-sm text-blue-800 dark:text-blue-200 space-y-2'>
              <div className='flex items-start gap-2'>
                <Building2 className='h-4 w-4 mt-0.5' />
                <div>
                  <p className='font-medium'>Branch managers/staff:</p>
                  <p className='text-xs text-blue-700 dark:text-blue-300'>
                    Use the Jarvis Staff app
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <UserCheck className='h-4 w-4 mt-0.5' />
                <div>
                  <p className='font-medium'>Platform administrators:</p>
                  <p className='text-xs text-blue-700 dark:text-blue-300'>
                    Use the Jarvis Admin Panel
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='space-y-3'>
            <div className='text-center'>
              <p className='text-sm text-muted-foreground mb-3'>
                If you believe you should have customer access, please contact
                support.
              </p>
            </div>

            <div className='flex gap-2'>
              <Button
                variant='outline'
                className='flex-1'
                onClick={() =>
                  window.open("mailto:support@jarvis.com", "_blank")
                }
              >
                <Mail className='h-4 w-4 mr-2' />
                Contact Support
              </Button>

              <Button
                variant='destructive'
                className='flex-1'
                onClick={() => signOut(() => router.push("/sign-in"))}
              >
                <LogOut className='h-4 w-4 mr-2' />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
