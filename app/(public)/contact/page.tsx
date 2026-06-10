'use client';

import { Navbar } from '@/components/Navbar';
import { Logo } from '@/components/Logo';
import { Phone, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONTACTS = [
  { label: 'Customer Support', number: '+233202960578', display: '+233 20 296 0578' },
  { label: 'General Enquiries', number: '+233552887039', display: '+233 55 288 7039' },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 px-4">
        <div className="max-w-lg mx-auto text-center space-y-3 mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold">Contact Us</h1>
          <p className="text-muted-foreground text-base">We're here to help. Reach out anytime.</p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          {CONTACTS.map((c) => (
            <div key={c.number} className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.display}</p>
              </div>
              <div className="flex gap-3">
                <a href={`tel:${c.number}`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl gap-2">
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                </a>
                <a
                  href={`https://wa.me/${c.number.replace(/\+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full rounded-xl gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-12">
          © {new Date().getFullYear()} Rapid Wash · Powered by Lider Technologies LTD
        </p>
      </div>
    </div>
  );
}
