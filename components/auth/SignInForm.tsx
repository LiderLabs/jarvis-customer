'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { PasswordInput } from '@/components/ui/password-input'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

type SignInStep = 'identifier' | 'password' | 'email_code'

export default function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const router = useRouter()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<SignInStep>('identifier')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icons.spinner className="size-6 animate-spin" />
      </div>
    )
  }

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn || isLoading) return

    if (!identifier.trim()) {
      setErrors({ identifier: 'Email is required' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await signIn.create({ identifier: identifier.trim() })

      if (result.status === 'needs_first_factor') {
        const hasPassword = result.supportedFirstFactors?.some(f => f.strategy === 'password')
        const hasEmailCode = result.supportedFirstFactors?.some(f => f.strategy === 'email_code')

        if (hasPassword) {
          setStep('password')
        } else if (hasEmailCode) {
          const emailCodeFactor = result.supportedFirstFactors?.find(f => f.strategy === 'email_code')
          if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
            await signIn.prepareFirstFactor({
              strategy: 'email_code',
              emailAddressId: emailCodeFactor.emailAddressId,
            })
          }
          setStep('email_code')
          toast.success('Verification code sent to your email!')
        }
      }
    } catch (err) {
      console.error('Sign in error:', err)
      if (isClerkAPIResponseError(err)) {
        setErrors({ identifier: err.errors?.[0]?.message ?? 'Invalid email address' })
      } else {
        setErrors({ identifier: 'An unexpected error occurred. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn || isLoading) return

    if (!password) {
      setErrors({ password: 'Password is required' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'password',
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        toast.success('Welcome back!')
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Password error:', err)

      if (isClerkAPIResponseError(err)) {
        const code = err.errors?.[0]?.code

        if (code === 'strategy_for_user_invalid') {
          setErrors({ password: 'This account doesn’t have a password. Try email code instead.' })
        } else {
          setErrors({ password: err.errors?.[0]?.message ?? 'Incorrect password' })
        }

        setPassword('')
      } else {
        setErrors({ password: 'Something went wrong. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn || isLoading) return

    if (!code.trim()) {
      setErrors({ code: 'Verification code is required' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        toast.success('Welcome back!')
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Code verification error:', err)
      if (isClerkAPIResponseError(err)) {
        setErrors({ code: err.errors?.[0]?.message ?? 'Invalid verification code' })
      } else {
        setErrors({ code: 'Something went wrong. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchToEmailCode = async () => {
    if (!signIn || isLoading) return
    setIsLoading(true)
    setErrors({})

    try {
      const emailCodeFactor = signIn.supportedFirstFactors?.find(f => f.strategy === 'email_code')
      if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailCodeFactor.emailAddressId,
        })
        setStep('email_code')
        toast.success('Verification code sent to your email!')
      }
    } catch (err) {
      console.error('Switch to email code error:', err)
      toast.error('Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!signIn || isLoading) return
    setIsLoading(true)

    try {
      const emailCodeFactor = signIn.supportedFirstFactors?.find(f => f.strategy === 'email_code')
      if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailCodeFactor.emailAddressId,
        })
        toast.success('New verification code sent!')
      }
    } catch (err) {
      console.error('Resend error:', err)
      toast.error('Failed to resend code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ---- Email Code Step ----
  if (step === 'email_code') {
    return (
      <div className={cn('flex flex-col gap-6')}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Enter the verification code sent to <span className="font-medium">{identifier}</span>
          </p>
        </div>

        <form onSubmit={handleEmailCodeSubmit} className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                clearError('code')
              }}
              className={errors.code ? 'border-destructive' : ''}
              maxLength={6}
            />
            {errors.code && <div className="text-sm text-destructive">{errors.code}</div>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Icons.spinner className="size-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={handleResendCode} disabled={isLoading}>
              Resend code
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep('identifier')
                setCode('')
                setErrors({})
              }}
              disabled={isLoading}
            >
              Use different email
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // ---- Password Step ----
  if (step === 'password') {
    return (
      <div className={cn('flex flex-col gap-6')}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Enter your password for <span className="font-medium">{identifier}</span>
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearError('password')
              }}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && <div className="text-sm text-destructive">{errors.password}</div>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Icons.spinner className="size-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={handleSwitchToEmailCode} disabled={isLoading}>
              Use email code instead
            </Button>

            <Link href="/forgot-password">
              <Button type="button" variant="ghost" size="sm">
                Forgot password?
              </Button>
            </Link>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStep('identifier')
              setPassword('')
              setErrors({})
            }}
            disabled={isLoading}
          >
            Use different email
          </Button>
        </form>
      </div>
    )
  }

  // ---- Identifier Step ----
  return (
    <div className={cn('flex flex-col gap-6')}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Sign in to your Jarvis account
        </p>
      </div>

      <form onSubmit={handleIdentifierSubmit} className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="identifier">Email Address</Label>
          <Input
            id="identifier"
            type="email"
            placeholder="john@example.com"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value)
              clearError('identifier')
            }}
            className={errors.identifier ? 'border-destructive' : ''}
          />
          {errors.identifier && <div className="text-sm text-destructive">{errors.identifier}</div>}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Icons.spinner className="size-4 animate-spin mr-2" />
              Checking...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </form>

      <div className="text-center text-sm space-y-2">
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
        <p className="text-muted-foreground">
          Or{' '}
          <Link href="/order" className="text-primary hover:underline">
            place an order as guest
          </Link>
        </p>
      </div>
    </div>
  )
}
