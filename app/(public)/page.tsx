'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { PhoneSlideshow } from '@/components/PhoneSlideshow';
import { ArrowRight, MapPin, Star, ArrowUp } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const SCHOOL_LOGOS = [
  '/assets/Valley View.jpg',
  '/assets/Ucc.jpg',
  '/assets/Lancaster Uni.jpg',
  '/assets/Ashesi.jpg',
];

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}

      {/* Hero Section */}
      <section className="relative flex flex-col justify-center items-center text-center min-h-[100vh] pt-20 md:pt-24">
        {/* Video Background */}
        <video
          src="/assets/4665252-hd_1920_1080_30fps.mp4"
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Enhanced Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/60 z-10" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 z-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 container px-4 md:px-6 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 pb-32 md:pb-40 mt-8 md:mt-0">
          {/* Left - Text */}
          <div className="max-w-2xl text-center lg:text-left flex flex-col gap-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold mb-4 leading-tight tracking-tight">
              <span className="block mb-2 text-white">Laundry made easy</span>

            </h1>

            <p className="text-white/90 text-lg md:text-xl lg:text-2xl mb-6 leading-relaxed font-medium">
              Wash. Dry. Fold. Done!
            </p>
            <p className="text-white/80 text-base md:text-lg mb-6 leading-relaxed">
              Drop your clothes. Pay instantly. Get notified when it&apos;s ready.
            </p>

            <div className="flex flex-row gap-3 justify-center lg:justify-start">
              <Link href="/order" className="flex-1 sm:flex-initial">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 px-6 sm:px-8 h-12 text-sm sm:text-base font-bold rounded-full shadow-2xl shadow-primary/40 transition-all hover:shadow-primary/60 hover:scale-105 w-full border-2 border-white/20"
                >
                  <span className="hidden sm:inline">Start Laundry</span>
                  <span className="sm:hidden">Order Now</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <a href="#locations" className="flex-1 sm:flex-initial scroll-smooth">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 px-6 sm:px-8 h-12 text-sm sm:text-base font-bold rounded-full border-2 border-white/40 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:border-white/60 transition-all hover:scale-105 w-full shadow-xl"
                >
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Our Locations</span>
                  <span className="sm:hidden">Locations</span>
                </Button>
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">AK</div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">EM</div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">JO</div>
                </div>
                <span className="text-white text-sm font-semibold">5,000+ Customers</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
                <span className="text-white text-sm font-semibold ml-2">4.9/5</span>
              </div>
            </div>
          </div>

          {/* Right - Phone Slideshow */}
          <div className="relative flex justify-center lg:justify-end w-full max-w-[280px] md:max-w-[320px] lg:max-w-[360px]">
            <div className="relative">
              <PhoneSlideshow />
            </div>
          </div>
        </div>

        {/* Logo Marquee */}
        <div className="absolute bottom-6 md:bottom-8 w-full z-20 overflow-hidden bg-white/5 backdrop-blur-md py-4">
          <div className="flex gap-6 md:gap-8 whitespace-nowrap animate-marquee px-4">
            {SCHOOL_LOGOS.concat(SCHOOL_LOGOS).map((logo, idx) => (
              <div
                key={idx}
                className="inline-flex items-center justify-center bg-white backdrop-blur-sm rounded-xl p-4 md:p-6 min-w-[160px] md:min-w-[200px] h-[80px] md:h-[100px] shadow-2xl flex-shrink-0 hover:scale-105 transition-transform border-2 border-gray-200"
              >
                <Image
                  src={logo}
                  alt={`School Logo ${idx}`}
                  width={160}
                  height={80}
                  className="object-contain max-h-[50px] md:max-h-[70px] w-auto"
                  quality={100}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              From order to pickup in four easy steps. We've streamlined everything so you can focus on what matters.
            </p>
          </div>

          {/* Timeline Container */}
          <div className="max-w-6xl mx-auto relative">
            {/* Vertical connecting line - hidden on mobile, visible on md+ */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/50 to-primary/20 transform -translate-x-1/2" />

            <div className="space-y-8 md:space-y-20">
              {[
                {
                  image: '/assets/photo 1.jpeg',
                  title: 'Place Your Order',
                  desc: 'Open the app and place your laundry order in seconds',
                  detail: 'Choose your services, select pickup time, and pay securely through the app',
                  time: '30 seconds',
                },
                {
                  image: '/assets/picture 2.jpeg',
                  title: 'Drop Off Your Laundry',
                  desc: 'Head to Rapid Wash with your laundry basket',
                  detail: 'Visit any of our campus locations during operating hours',
                  time: '5 minutes',
                },
                {
                  image: '/assets/pic 3.jpeg',
                  title: 'We Handle Everything',
                  desc: 'Attendant completes your laundry with care',
                  detail: 'Professional washing, drying, and folding by our expert team',
                  time: '24-48 hours',
                },
                {
                  image: '/assets/picture 4.jpeg',
                  title: 'Pick Up Fresh Clothes',
                  desc: 'Get notified and collect your fresh, clean laundry',
                  detail: 'Receive a notification when your order is ready for pickup',
                  time: 'Instant notification',
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  {/* Step Container */}
                  <div className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    {/* Image Side */}
                    <div className="w-full md:w-[45%] relative">
                      <div className="relative overflow-hidden rounded-3xl shadow-2xl group">
                        <div className="relative h-[300px] sm:h-[350px] md:h-[400px] w-full">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            quality={100}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        </div>
                      </div>
                    </div>

                    {/* Text Side */}
                    <div className={`w-full md:w-[45%] ${index % 2 === 1 ? 'md:text-right' : 'md:text-left'} text-center`}>
                      <div className="space-y-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
                        <h3 className="text-2xl md:text-3xl font-bold mt-2">{item.title}</h3>
                        <p className="text-muted-foreground text-base md:text-lg font-medium">{item.desc}</p>
                        <p className="text-sm md:text-base text-muted-foreground/80 leading-relaxed">{item.detail}</p>
                        
                        {/* Features list */}
                        <div className={`flex flex-wrap gap-2 ${index % 2 === 1 ? 'md:justify-end' : 'md:justify-start'} justify-center pt-2`}>
                          {index === 0 && (
                            <>
                              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Quick Setup</span>
                            </>
                          )}
                          {index === 1 && (
                            <>
                              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Multiple Locations</span>
                              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Flexible Hours</span>
                            </>
                          )}
                          {index === 2 && (
                            <>
                              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Expert Care</span>
                              <span className="px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">Quality Assured</span>
                            </>
                          )}
                          {index === 3 && (
                            <>
                              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Fresh & Folded</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connecting arrow - only show between steps */}
                  {index < 3 && (
                    <div className="flex justify-center my-8 md:my-0 md:absolute md:left-1/2 md:transform md:-translate-x-1/2 md:bottom-[-60px] z-20">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <ArrowRight className="w-6 h-6 text-primary rotate-90" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section id="locations" className="py-16 sm:py-20 md:py-28 overflow-hidden scroll-mt-20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Our Locations
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">Find us on your campus</p>
          </div>

          {/* Locations Slideshow */}
          <div className="relative max-w-7xl mx-auto">
            <div className="flex gap-6 animate-location-scroll">
              {[
                { 
                  name: 'Lancaster University Ghana', 
                  location: 'Lancaster Campus', 
                  image: '/assets/lancaster.jpg',
                  isOpen: true 
                },
                { 
                  name: 'University of Cape Coast', 
                  location: 'UCC Campus', 
                  image: '/assets/University of Cape coast.jpg',
                  isOpen: true 
                },
                { 
                  name: 'JJ Nortey Hall', 
                  location: 'Valley View Campus', 
                  image: '/assets/JJ Nortey hall.webp',
                  isOpen: true 
                },
                { 
                  name: 'Ashesi University', 
                  location: 'Ashesi Hostel', 
                  image: '/assets/Ashesi_hostel.webp',
                  isOpen: true 
                },
                { 
                  name: 'Academic City University', 
                  location: 'Academic City Hostel', 
                  image: '/assets/academic-city-hostel-room-1.jpg',
                  isOpen: true 
                },
                { 
                  name: 'Coming to Your Campus Soon', 
                  location: 'Stay tuned!', 
                  image: '/assets/pentagon-hostel-scaled-1.jpg',
                  isOpen: false, 
                  comingSoon: true 
                },
              ].concat([
                { 
                  name: 'Lancaster University Ghana', 
                  location: 'Lancaster Campus', 
                  image: '/assets/lancaster.jpg',
                  isOpen: true 
                },
                { 
                  name: 'University of Cape Coast', 
                  location: 'UCC Campus', 
                  image: '/assets/University of Cape coast.jpg',
                  isOpen: true 
                },
                { 
                  name: 'JJ Nortey Hall', 
                  location: 'Valley view Campus', 
                  image: '/assets/JJ Nortey hall.webp',
                  isOpen: true 
                },
                { 
                  name: 'Ashesi University', 
                  location: 'Ashesi Hostel', 
                  image: '/assets/Ashesi_hostel.webp',
                  isOpen: true 
                },
                { 
                  name: 'Academic City University', 
                  location: 'Academic City Hostel', 
                  image: '/assets/academic-city-hostel-room-1.jpg',
                  isOpen: true 
                },
                { 
                  name: 'Coming to Your Campus Soon', 
                  location: 'Stay tuned!', 
                  image: '/assets/pentagon-hostel-scaled-1.jpg',
                  isOpen: false, 
                  comingSoon: true 
                },
              ]).map((branch, idx) => (
                <div
                  key={idx}
                  className={`flex-shrink-0 w-[280px] sm:w-[320px] bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-xl ${branch.comingSoon ? 'animate-heartbeat' : ''}`}
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={branch.image}
                      alt={branch.name}
                      fill
                      className="object-cover hover:scale-110 transition-transform duration-500"
                      quality={100}
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Status badge */}
                    <div className="absolute top-4 right-4">
                      {branch.comingSoon ? (
                        <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg backdrop-blur-sm">
                          Coming Soon
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-lg">
                          Open Now
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{branch.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <p>{branch.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-br from-primary via-primary to-primary/90 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse" />
        </div>

        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
              Ready to wash smarter?
            </h2>
            
            <p className="text-base sm:text-lg text-white/90 mb-6 max-w-xl mx-auto leading-relaxed">
              Join thousands of customers who&apos;ve made the switch to hassle-free laundry.
            </p>

            <Link href="/order">
              <Button
                size="lg"
                className="gap-2 bg-white text-primary hover:bg-white/95 px-8 h-12 text-base font-bold rounded-full shadow-2xl transition-all hover:scale-105 hover:shadow-3xl group relative overflow-hidden"
              >
                <span className="relative z-10">Start Your First Wash</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 border-t border-border bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <Logo size="sm" />
            <nav className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground">
              <Link href="/order" className="hover:text-primary transition-colors">Place Order</Link>
              <Link href="/track" className="hover:text-primary transition-colors">Track Order</Link>
              <Link href="/dashboard" className="hover:text-primary transition-colors">Account</Link>
            </nav>
           <p className="text-xs text-muted-foreground">
  © {new Date().getFullYear()} Rapid Wash · Powered by Lider Technologies LTD
</p>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style jsx>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 25s linear infinite;
        }
        @keyframes location-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-320px * 6 - 24px * 6)); }
        }
        .animate-location-scroll {
          display: flex;
          animation: location-scroll 30s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 30px) scale(1.1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          10% { transform: scale(1.05); }
          20% { transform: scale(1); }
          30% { transform: scale(1.05); }
          40% { transform: scale(1); }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 25s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-heartbeat {
          animation: heartbeat 2s ease-in-out infinite;
        }
        @keyframes bubble-pop {
          0% {
            transform: scale(0) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: scale(1) translate(var(--tx), var(--ty));
            opacity: 0;
          }
        }
        .bubble {
          position: fixed;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(147, 197, 253, 0.4));
          pointer-events: none;
          animation: bubble-pop 1s ease-out forwards;
          box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.5);
          z-index: 9999;
        }
      `}</style>

      {/* Bubble animation script */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            if (typeof window === 'undefined') return;
            
            function createBubble(e) {
              const bubble = document.createElement('div');
              bubble.className = 'bubble';
              bubble.style.left = e.clientX + 'px';
              bubble.style.top = e.clientY + 'px';
              
              const tx = (Math.random() - 0.5) * 200;
              const ty = (Math.random() - 0.5) * 200;
              bubble.style.setProperty('--tx', tx + 'px');
              bubble.style.setProperty('--ty', ty + 'px');
              
              document.body.appendChild(bubble);
              
              setTimeout(() => {
                bubble.remove();
              }, 1000);
            }
            
            // Remove existing listener if any
            document.removeEventListener('click', window.bubbleHandler);
            
            // Add new listener
            window.bubbleHandler = createBubble;
            document.addEventListener('click', window.bubbleHandler);
          })();
        `
      }} />
    </div>
  );
}