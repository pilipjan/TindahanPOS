"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  ShieldCheck,
  Wifi,
  WifiOff,
  BarChart3,
  Receipt,
  Package,
  ArrowRight,
  Check,
  Star,
  Menu,
  X,
  ChevronRight,
  Smartphone,
  Globe,
  Clock,
  Users,
  TrendingUp,
  CreditCard,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   LANDING PAGE — TindahanPOS
   Portfolio-ready marketing site
   ═══════════════════════════════════════════════ */

// ─── Navbar ───
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-[var(--shadow-glow)] transition-shadow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Tindahan<span className="text-primary-400">POS</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-surface-300 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="text-sm text-surface-300 hover:text-white transition-colors px-4 py-2"
          >
            Log In
          </a>
          <a
            href="/login"
            className="text-sm font-semibold text-white gradient-primary px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-lg hover:shadow-[var(--shadow-glow)]"
          >
            Get Started Free
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass mt-2 mx-4 rounded-2xl overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-3">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-surface-200 hover:text-white py-2 px-3 rounded-lg hover:bg-surface-700/50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-surface-700" />
              <a
                href="/login"
                className="text-center font-semibold text-white gradient-primary py-2.5 rounded-full"
              >
                Get Started Free
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── Hero Section ───
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light text-sm text-primary-300 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Built for Philippine MSMEs
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight text-balance"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your Sari-Sari Store,{" "}
            <span className="gradient-text">Supercharged</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-surface-300 max-w-2xl mx-auto text-balance leading-relaxed"
          >
            The cloud POS that works even without internet. BIR-compliant receipts,
            real-time inventory, GCash & Maya payments — all in one beautiful dashboard.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="/login"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 gradient-primary text-white font-semibold px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02]"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 glass-light text-white font-semibold px-8 py-4 rounded-full text-lg hover:bg-white/10 transition-all"
            >
              See Features
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-surface-400"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> BIR Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 text-amber-400" /> Works Offline
            </span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-primary-400" /> GCash & Maya Ready
            </span>
          </motion.div>
        </div>

        {/* Hero Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-surface-700/50">
            {/* Browser chrome */}
            <div className="bg-surface-800 px-4 py-3 flex items-center gap-2 border-b border-surface-700/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-coral-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-surface-700/60 rounded-lg px-4 py-1.5 text-xs text-surface-400 text-center max-w-md mx-auto">
                  app.tindahanpos.com/pos
                </div>
              </div>
            </div>
            {/* POS Interface Mockup */}
            <div className="bg-surface-900 p-6 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[340px]">
              {/* Left — product grid */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 bg-surface-800 rounded-xl px-4 py-3 text-surface-400 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Scan barcode or search...
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {["USB Cable", "Phone Case", "Earphones", "Screen Guard", "HDMI Cable", "USB Hub", "Charger", "Mouse"].map((item, i) => (
                    <div
                      key={item}
                      className="bg-surface-800 hover:bg-surface-700 border border-surface-700/50 rounded-xl p-3 text-center transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-surface-700 flex items-center justify-center text-surface-400 group-hover:text-primary-400 transition-colors">
                        <Package className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-surface-200 font-medium truncate">{item}</p>
                      <p className="text-xs text-emerald-400 mt-0.5">₱{(150 + i * 75).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right — cart */}
              <div className="bg-surface-800 rounded-xl border border-surface-700/50 p-4 flex flex-col">
                <h3 className="text-sm font-semibold text-surface-200 mb-3">Current Sale</h3>
                <div className="flex-1 space-y-2">
                  {[
                    { name: "USB Cable", qty: 2, price: 300 },
                    { name: "Phone Case", qty: 1, price: 225 },
                    { name: "Earphones", qty: 1, price: 450 },
                  ].map((item) => (
                    <div key={item.name} className="flex justify-between text-sm">
                      <span className="text-surface-300">
                        {item.name} <span className="text-surface-500">x{item.qty}</span>
                      </span>
                      <span className="text-surface-200 font-medium">₱{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-surface-700 mt-3 pt-3 space-y-1">
                  <div className="flex justify-between text-sm text-surface-400">
                    <span>VAT (12%)</span>
                    <span>₱104.46</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>Total</span>
                    <span className="text-emerald-400">₱975.00</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors">
                    💵 Cash
                  </button>
                  <button className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors">
                    📱 GCash
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect under mockup */}
          <div className="h-40 bg-gradient-to-b from-primary-600/10 to-transparent -mt-20 rounded-full blur-3xl pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Features Section ───
const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast Checkout",
    description:
      "Barcode scanning, keyboard shortcuts, and one-tap payments. Complete a transaction in under 15 seconds.",
    color: "primary",
  },
  {
    icon: <WifiOff className="w-6 h-6" />,
    title: "Works Offline",
    description:
      "Keep selling even when the internet goes down. Transactions sync automatically when you're back online.",
    color: "amber",
  },
  {
    icon: <Receipt className="w-6 h-6" />,
    title: "BIR-Compliant Receipts",
    description:
      "Official Receipts with TIN, PTU number, and non-resettable counters. Print or email — always audit-ready.",
    color: "emerald",
  },
  {
    icon: <Package className="w-6 h-6" />,
    title: "Smart Inventory",
    description:
      "Real-time stock tracking with low-stock alerts. Multi-category support and automatic stock deduction.",
    color: "primary",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "GCash & Maya Payments",
    description:
      "Accept all major Philippine e-wallets. Split payments across cash and digital. Track every reference number.",
    color: "emerald",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Owner Dashboard",
    description:
      "Sales trends, top-selling items, cashier performance, and real-time alerts — all in one beautiful view.",
    color: "primary",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "SC/PWD Discounts",
    description:
      "Built-in RA 9994 & RA 10754 compliance. Automatic 20% discount + VAT exemption with ID tracking.",
    color: "amber",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Role-Based Access",
    description:
      "Cashiers see their own sales. Owners see everything. Full audit trail with IP logging for accountability.",
    color: "emerald",
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  primary: {
    bg: "bg-primary-500/10",
    text: "text-primary-400",
    border: "border-primary-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
};

function Features() {
  return (
    <section id="features" className="py-24 bg-surface-950 relative">
      {/* Subtle top gradient */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-surface-900/50 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-primary-400 uppercase tracking-wider mb-3"
          >
            Everything You Need
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white text-balance"
            style={{ fontFamily: "var(--font-display)" }}
          >
            One POS to Run Your Entire Business
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-surface-400"
          >
            From barcode scanning to BIR compliance — TindahanPOS handles it all
            so you can focus on growing your business.
          </motion.p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => {
            const colors = colorMap[feature.color];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`group relative bg-surface-900 border border-surface-700/50 rounded-2xl p-6 hover:border-surface-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} border ${colors.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-surface-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ───
function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Sign Up in 2 Minutes",
      description:
        "Create your account, enter your store details, TIN, and BIR registration numbers. We handle the rest.",
      icon: <Globe className="w-6 h-6" />,
    },
    {
      number: "02",
      title: "Add Your Products",
      description:
        "Import via CSV or add items one by one. Set prices, barcodes, categories, and reorder points.",
      icon: <Package className="w-6 h-6" />,
    },
    {
      number: "03",
      title: "Start Selling",
      description:
        "Scan barcodes, tap products, accept payments. BIR-compliant receipts print automatically.",
      icon: <Zap className="w-6 h-6" />,
    },
    {
      number: "04",
      title: "Track Everything",
      description:
        "Monitor sales trends, stock levels, cashier performance, and more from your owner dashboard.",
      icon: <TrendingUp className="w-6 h-6" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-surface-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3"
          >
            Simple Setup
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white text-balance"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Up and Running in Minutes
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px bg-gradient-to-r from-surface-600 to-surface-700" />
              )}

              <div className="text-center">
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center text-primary-400 shadow-lg">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full gradient-primary text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-surface-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats Bar ───
function Stats() {
  const stats = [
    { value: "15s", label: "Avg. Transaction Time" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "12%", label: "Auto VAT Calculation" },
    { value: "24/7", label: "Offline Resilience" },
  ];

  return (
    <section className="py-16 bg-surface-950 border-y border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl font-extrabold gradient-text">
                {stat.value}
              </div>
              <p className="mt-1 text-sm text-surface-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ───
function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "",
      description: "Perfect for solo sari-sari stores just getting started.",
      features: [
        "1 Terminal",
        "Up to 100 products",
        "Basic sales reports",
        "BIR-compliant receipts",
        "Cash & e-wallet tracking",
        "Offline mode",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Pro",
      price: "₱999",
      period: "/mo",
      description: "For growing businesses that need more power.",
      features: [
        "Up to 3 terminals",
        "Unlimited products",
        "Advanced analytics",
        "SC/PWD discount automation",
        "Staff management",
        "Priority support",
        "CSV import/export",
        "Inventory alerts",
      ],
      cta: "Start 14-Day Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For multi-branch operations and franchises.",
      features: [
        "Unlimited terminals",
        "Multi-branch support",
        "API access",
        "PayMongo integration",
        "Custom reporting",
        "Dedicated support",
        "SLA guarantee",
        "On-site training",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-surface-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-primary-400 uppercase tracking-wider mb-3"
          >
            Simple Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white text-balance"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Start Free, Scale as You Grow
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? "bg-gradient-to-b from-primary-900/40 to-surface-800 border-2 border-primary-500/40 shadow-xl shadow-primary-500/10 scale-[1.02]"
                  : "bg-surface-800 border border-surface-700/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gradient-primary rounded-full text-xs font-semibold text-white shadow-md">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-surface-400 text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-surface-400">{plan.description}</p>
              </div>

              <ul className="flex-1 space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-surface-300">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="/login"
                className={`block text-center py-3 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? "gradient-primary text-white hover:opacity-90 shadow-lg hover:shadow-[var(--shadow-glow)]"
                    : "bg-surface-700 text-white hover:bg-surface-600"
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ Section ───
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Do I need a special POS machine?",
      a: "No! TindahanPOS runs on any device with a browser — laptop, tablet, or even your phone. Just plug in a USB barcode scanner (₱500–₱1,500 on Shopee/Lazada) and you're ready to go.",
    },
    {
      q: "What happens when the internet goes down?",
      a: "TindahanPOS keeps working offline. Your sales are stored locally and automatically sync to the cloud when your internet connection returns. No lost transactions.",
    },
    {
      q: "Is this BIR-compliant?",
      a: "Yes. Our receipts include all BIR-required fields: TIN, PTU number, Machine Identification Number, non-resettable grand total, and sequential receipt numbers. Perfect for audits.",
    },
    {
      q: "How does the SC/PWD discount work?",
      a: "Built-in compliance with RA 9994 and RA 10754. Press F8, enter the SC/PWD ID, and the system automatically computes the 20% discount on the VAT-exempt price. The log is saved for BIR reporting.",
    },
    {
      q: "Can I accept GCash and Maya?",
      a: "Yes! For now, you record e-wallet payments with the customer's reference number. We're working on direct API integration with PayMongo for automatic verification.",
    },
    {
      q: "Is my data secure?",
      a: "Absolutely. We use Supabase with Row Level Security — cashiers can only see their own transactions, while owners see everything. All data is encrypted in transit and at rest.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-surface-950 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3"
          >
            Got Questions?
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white text-balance"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Frequently Asked Questions
          </motion.h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface-900 border border-surface-700/50 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-800/50 transition-colors"
              >
                <span className="text-white font-medium pr-4">{faq.q}</span>
                <ChevronRight
                  className={`w-5 h-5 text-surface-400 flex-shrink-0 transition-transform ${
                    openIndex === i ? "rotate-90" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="px-5 pb-5 text-sm text-surface-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ───
function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-surface-900 to-emerald-900/20" />
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ready to Modernize Your Tindahan?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-lg text-surface-300 max-w-xl mx-auto"
        >
          Join hundreds of Filipino store owners who have upgraded to a smarter,
          faster, more compliant POS system.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="/login"
            className="group inline-flex items-center gap-2 gradient-primary text-white font-semibold px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02]"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
        <p className="mt-4 text-sm text-surface-500">
          No credit card required · Free forever on Starter plan
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───
function Footer() {
  return (
    <footer className="py-12 bg-surface-950 border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                Tindahan<span className="text-primary-400">POS</span>
              </span>
            </div>
            <p className="text-sm text-surface-400 leading-relaxed">
              Cloud POS built for Filipino entrepreneurs. Fast, compliant, reliable.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2.5">
              {["Features", "Pricing", "Changelog", "Documentation"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-surface-400 hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {["Help Center", "BIR Compliance Guide", "API Reference", "Blog"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-surface-400 hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {["Privacy Policy", "Terms of Service", "Data Processing", "Cookie Policy"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-surface-400 hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-surface-500">
            © {new Date().getFullYear()} TindahanPOS. Made with 🇵🇭 in the Philippines.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-surface-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              BIR Compliant
            </span>
            <span className="flex items-center gap-1.5 text-xs text-surface-500">
              <Clock className="w-3.5 h-3.5 text-primary-400" />
              99.9% Uptime
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ───
export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
