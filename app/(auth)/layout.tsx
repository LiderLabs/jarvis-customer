import Image from "next/image"
import Link from "next/link"

// Avoid prerendering auth pages so Clerk env is only needed at request time
export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className='grid min-h-screen lg:grid-cols-2'>
      {/* Left side - Form */}
      <div className='flex flex-col gap-4 p-6 md:p-10'>
        {/* Logo */}
        <div className='flex items-center'>
          <Link href="/">
            {/* Light mode logo */}
            <Image 
              src="/assets/washlab logo-light.png" 
              alt="Rapid Wash" 
              width={150}
              height={44}
              className="h-11 w-auto block dark:hidden"
              priority
            />
            {/* Dark mode logo */}
            <Image 
              src="/assets/washlab logo-dark.png" 
              alt="Rapid Wash" 
              width={150}
              height={44}
              className="h-11 w-auto hidden dark:block"
              priority
            />
          </Link>
        </div>
        
        {/* Form container */}
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-sm'>{children}</div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Rapid Wash · Powered by Lider Technologies LTD</p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className='relative hidden bg-muted lg:block overflow-hidden'>
        <Image
          src='/assets/hero-laundry.jpg'
          alt='Laundry Service'
          fill
          className='absolute inset-0 h-full w-full object-cover'
          priority
        />
        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
          <h2 className="text-3xl font-bold mb-2">Campus Laundry Made Easy</h2>
          <p className="text-lg text-white/80">
            Wash. Dry. Fold. Done. Professional laundry service for campus life.
          </p>
        </div>
      </div>
    </main>
  )
}
