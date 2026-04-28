"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Jadwal" },
  { href: "/classement", label: "Klasemen" },
  { href: "/roles", label: "Aturan" },
  { href: "/admin/dashboard", label: "Host" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#48c4c4]/20 bg-[#fefefe]/95 backdrop-blur supports-[backdrop-filter]:bg-[#fefefe]/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-[#282c90] rounded-xl px-3 py-1.5">
            <img src="/logo/logo.PNG" alt="Padel LiveScore" className="h-8 w-auto" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#282c90]/60 hover:text-[#282c90] transition-colors font-semibold text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-[#282c90] hover:bg-[#282c90]/5">
              <Menu className="w-6 h-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-[#fefefe] border-[#48c4c4]/20">
            <SheetTitle className="text-[#282c90]">Menu</SheetTitle>
            <nav className="flex flex-col gap-2 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-lg text-[#282c90]/60 hover:text-[#282c90] transition-colors font-semibold py-2.5 px-4 rounded-xl hover:bg-[#282c90]/5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
