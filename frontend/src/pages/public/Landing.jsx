import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BarChart3, BrainCircuit, CheckCircle2, ClipboardList, Leaf,
  Menu, Quote, Scale, ShieldCheck, Snowflake, Sprout, TrendingUp, Truck,
  Users, Warehouse, X, Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../components/ui/LanguageToggle';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

/* ---- Content data ---- */

const PROBLEMS = [
  {
    icon: Snowflake,
    stat: '30–40%',
    title: 'Harvest lost after the field',
    text: 'A huge share of perishable produce spoils between harvest and market — no cooling, no buyer, no plan.',
    hi: 'फसल खेत से निकलने के बाद बर्बाद हो जाती है',
  },
  {
    icon: Scale,
    stat: 'Distress sale',
    title: 'Forced to sell at any price',
    text: 'Without storage or waiting power, farmers accept the first low offer — while better prices exist days later.',
    hi: 'मजबूरी में सस्ते दाम पर बिकवाना पड़ता है',
  },
  {
    icon: Users,
    stat: 'Fragmented',
    title: 'Buyers and sellers never meet',
    text: 'Processors hunt for quality supply; farmers with quality produce can\'t find them. The market stays blind.',
    hi: 'खरीदार और किसान एक-दूसरे को नहीं ढूंढ पाते',
  },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'Decide with data, not guesswork',
    hi: 'अनुमान नहीं, आंकड़ों से निर्णय',
    text: 'AI-assisted assessment grades your batch and weighs quality, spoilage risk and market signals into one clear recommendation: SELL, STORE, or PROCESS.',
  },
  {
    icon: Truck,
    title: 'Find the right buyer, fast',
    hi: 'सही खरीदार, जल्दी',
    text: 'A matching engine pairs your batch with processors whose demand fits your crop, quality and location — no more waiting at the mandi.',
  },
  {
    icon: Warehouse,
    title: 'Store today, sell tomorrow',
    hi: 'आज भंडारण, कल बेहतर दाम',
    text: 'When selling now isn\'t worth it, discover verified storage nearby and hold your harvest until the price works for you.',
  },
  {
    icon: Scale,
    title: 'Fair value for both sides',
    hi: 'दोनों पक्षों को उचित मूल्य',
    text: 'Transparent procurement lots show quantity, quality and price openly — so farmers and processors both know exactly what they\'re agreeing to.',
  },
];

const STEPS = [
  { icon: ClipboardList, title: 'Add your batch', text: 'Crop, quantity, harvest date — 2 minutes. AI assessment grades quality instantly.', hi: 'अपनी फसल दर्ज करें' },
  { icon: BarChart3, title: 'See your options', text: 'SELL at today\'s price, STORE for later, or PROCESS into higher-value goods — with scores.', hi: 'विकल्प देखें' },
  { icon: Users, title: 'Meet your match', text: 'Review matched processor demands and accept the lot that works for you.', hi: 'खरीदार से मिलान' },
  { icon: ShieldCheck, title: 'Close the deal', text: 'Confirm the procurement lot with clear terms for everyone. Value protected.', hi: 'सौदा पक्का करें' },
];

const TESTIMONIALS = [
  {
    quote: 'The assessment told me my tomato batch was Grade A and demand was high. I connected with a processor the same week instead of selling cheap at the mandi.',
    name: 'Farmer A',
    role: 'Tomato grower',
  },
  {
    quote: 'I used to call six traders to source 5 tonnes. Now I post my demand once and matched batches come to me with quality already verified.',
    name: 'Processor',
    role: 'Food processing unit',
  },
];

const Landing = () => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const enSlogan = t('appTitle.slogan');
  const hiSlogan = t('appTitle.slogan', { lng: 'hi' });

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream text-charcoal">
      {/* ================= Header ================= */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-cream-darker/60 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-forest">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest text-white shadow-green">
              <Leaf size={22} />
            </span>
            <span>
              <strong className="block text-xl tracking-tight">{t('appTitle.m2m')}</strong>
              <small className="block -mt-1 text-xs text-charcoal/50">{t('appTitle.tagline')}</small>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <LanguageToggle />
            <a href="#problem" className="text-charcoal/70 transition hover:text-forest">The problem</a>
            <a href="#benefits" className="text-charcoal/70 transition hover:text-forest">Why M2M</a>
            <a href="#how-it-works" className="text-charcoal/70 transition hover:text-forest">How it works</a>
            <Link to="/login" className="text-forest transition hover:text-forest-dark">{t('nav.signIn')}</Link>
            <Link to="/register" className="rounded-xl bg-forest px-5 py-2.5 text-white shadow-green transition hover:-translate-y-0.5 hover:bg-forest-dark">
              {t('nav.getStarted')}
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle />
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-xl border border-cream-darker bg-white p-2.5 text-forest"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-cream-darker bg-cream px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-medium">
              <a href="#problem" onClick={() => setMenuOpen(false)} className="py-1">The problem</a>
              <a href="#benefits" onClick={() => setMenuOpen(false)} className="py-1">Why M2M</a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="py-1">How it works</a>
              <Link to="/login" className="py-1 text-forest">{t('nav.signIn')}</Link>
              <Link to="/register" className="rounded-xl bg-forest px-4 py-2.5 text-center text-white">{t('nav.getStarted')}</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ================= Hero ================= */}
        <section className="relative pb-20 pt-32 sm:pb-28 sm:pt-40">
          <div className="absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-leaf/15 blur-3xl" />
          <div className="absolute -left-32 top-48 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-leaf/20 bg-leaf/10 px-3 py-1.5 text-sm font-semibold text-leaf">
                <Zap size={15} /> {t('appTitle.sloganSub')?.split('.')[0] || 'Smarter harvest decisions'}
              </motion.div>

              <motion.h1 variants={fadeUp} className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
                {enSlogan}
                {hiSlogan !== enSlogan && (
                  <span className="mt-4 block text-2xl font-bold leading-snug text-leaf sm:text-3xl">
                    {hiSlogan}
                  </span>
                )}
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-8 text-charcoal/65 sm:text-xl">
                Most of a harvest&apos;s value is decided <em className="font-semibold not-italic text-charcoal">after</em> it leaves the
                field — in how fast you decide, where you store it, and who you sell it to.
                M2M turns those scattered signals into one clear plan.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest px-6 py-3.5 font-semibold text-white shadow-green transition hover:-translate-y-0.5 hover:bg-forest-dark">
                  {t('appTitle.startJourney')} <ArrowRight size={18} />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center rounded-2xl border border-forest/20 bg-white px-6 py-3.5 font-semibold text-forest transition hover:bg-forest/5">
                  See how it works
                </a>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-charcoal/60">
                <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-leaf" /> AI-assisted insights</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-leaf" /> Verified buyers</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-leaf" /> Storage network</span>
              </motion.div>
            </motion.div>

            {/* Hero card — the "decision" moment */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-leaf/20 via-transparent to-gold/20 blur-2xl" />
              <div className="relative rounded-[2rem] bg-forest p-5 shadow-2xl sm:p-7">
                <div className="rounded-2xl bg-white/10 p-5 text-white backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Today&apos;s harvest view</p>
                      <p className="mt-1 text-2xl font-bold">Tomato · 2,500 kg</p>
                    </div>
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="rounded-full bg-leaf-light/20 px-3 py-1 text-xs text-leaf-light"
                    >
                      Live insight
                    </motion.span>
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white/10 p-3"><p className="text-xs text-white/55">Quality</p><p className="mt-1 text-xl font-bold">Grade A</p></div>
                    <div className="rounded-xl bg-white/10 p-3"><p className="text-xs text-white/55">Market</p><p className="mt-1 flex items-center gap-1 text-xl font-bold text-leaf-light"><TrendingUp size={17} />+12.4%</p></div>
                    <div className="rounded-xl bg-white/10 p-3"><p className="text-xs text-white/55">Demand</p><p className="mt-1 text-xl font-bold">High</p></div>
                  </div>

                  <div className="mt-5 rounded-xl bg-cream p-4 text-charcoal">
                    <div className="flex items-center gap-3">
                      <span className="rounded-xl bg-gold/20 p-2 text-gold"><ShieldCheck size={20} /></span>
                      <div>
                        <p className="text-xs text-charcoal/55">Recommended next step</p>
                        <p className="font-bold">Connect with 3 nearby processors</p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-cream-darker">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '80%' }}
                        transition={{ duration: 1.4, delay: 0.9, ease: 'easeOut' }}
                        className="h-2 rounded-full bg-gradient-to-r from-leaf to-gold"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between px-1 text-sm text-white/70">
                  <span className="flex items-center gap-1.5"><Sprout size={15} /> From mitti</span>
                  <span className="mx-3 h-px flex-1 bg-white/20" />
                  <span>to market <ArrowRight size={15} className="inline" /></span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================= The problem ================= */}
        <section id="problem" className="scroll-mt-24 bg-forest py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger}
              className="max-w-3xl"
            >
              <motion.p variants={fadeUp} className="font-semibold text-leaf-light">The problem nobody sees</motion.p>
              <motion.h2 variants={fadeUp} className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                The harvest isn&apos;t the hard part.
                <span className="block text-white/60">What happens after it is.</span>
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger}
              className="mt-12 grid gap-5 md:grid-cols-3"
            >
              {PROBLEMS.map(({ icon: Icon, stat, title, text, hi }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur transition hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-light/20 text-leaf-light"><Icon size={23} /></span>
                    <span className="text-sm font-bold uppercase tracking-wide text-gold-light">{stat}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="text-sm font-medium text-leaf-light">{hi}</p>
                  <p className="mt-2 leading-7 text-white/65">{text}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="mt-10 max-w-3xl text-lg text-white/70"
            >
              M2M exists to close that gap — <span className="font-semibold text-leaf-light">between the field and the fair price.</span>
            </motion.p>
          </div>
        </section>

        {/* ================= Why M2M ================= */}
        <section id="benefits" className="scroll-mt-24 bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="max-w-2xl">
              <motion.p variants={fadeUp} className="font-semibold text-leaf">Why M2M</motion.p>
              <motion.h2 variants={fadeUp} className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                One connected harvest journey. <span className="text-leaf">Every decision covered.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-4 leading-7 text-charcoal/60">
                Sell, store, or process — M2M doesn&apos;t push one answer. It shows you every option with the numbers behind it, then connects you to make it happen.
              </motion.p>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="mt-10 grid gap-5 md:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, hi, text }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="group rounded-2xl border border-cream-darker bg-cream/50 p-6 transition hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-white transition group-hover:bg-leaf"><Icon size={23} /></div>
                    <div>
                      <h3 className="text-lg font-bold">{title}</h3>
                      <p className="text-sm font-medium text-leaf">{hi}</p>
                      <p className="mt-2 leading-7 text-charcoal/60">{text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ================= How it works ================= */}
        <section id="how-it-works" className="scroll-mt-24 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="max-w-2xl">
              <motion.p variants={fadeUp} className="font-semibold text-leaf">Simple by design</motion.p>
              <motion.h2 variants={fadeUp} className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                From mitti to market, in four steps.
              </motion.h2>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, text, hi }, i) => (
                <motion.div key={title} variants={fadeUp} className="relative">
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-full top-10 hidden h-px w-6 bg-forest/20 lg:block" />
                  )}
                  <div className="h-full rounded-2xl border border-cream-darker bg-white p-6">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-leaf/10 text-forest"><Icon size={21} /></span>
                      <span className="text-3xl font-black text-cream-darker">0{i + 1}</span>
                    </div>
                    <h3 className="mt-5 font-bold">{title}</h3>
                    <p className="text-sm font-medium text-leaf">{hi}</p>
                    <p className="mt-2 text-sm leading-6 text-charcoal/60">{text}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ================= Testimonials ================= */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="grid gap-6 md:grid-cols-2">
              {TESTIMONIALS.map(({ quote, name, role }) => (
                <motion.figure key={name} variants={fadeUp} className="rounded-2xl bg-cream p-8">
                  <Quote size={28} className="text-gold" />
                  <blockquote className="mt-4 text-lg leading-8 text-charcoal/80">“{quote}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-white"><Sprout size={18} /></span>
                    <span>
                      <span className="block font-bold">{name}</span>
                      <span className="block text-sm text-charcoal/55">{role}</span>
                    </span>
                  </figcaption>
                </motion.figure>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ================= Final CTA ================= */}
        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55 }}
            className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-forest px-6 py-16 text-center text-white sm:px-12"
          >
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-leaf-light/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
            <h2 className="relative text-3xl font-black tracking-tight sm:text-4xl">
              Your harvest deserves more than one chance.
            </h2>
            <p className="relative mt-3 text-lg text-white/70">आपकी फसल के अवसर एक नहीं होते — उन्हें पहचानने का समय आ गया है।</p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 font-semibold text-forest shadow-green transition hover:-translate-y-0.5">
                <Sprout size={18} /> I&apos;m a farmer
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-7 py-3.5 font-semibold text-white transition hover:bg-white/20">
                <Truck size={18} /> I&apos;m a processor
              </Link>
            </div>
            <p className="relative mt-6 text-sm text-white/55">
              Just exploring? <Link to="/login" className="font-semibold text-leaf-light underline underline-offset-2">Try a demo account</Link> — farmer, processor or admin, no signup needed.
            </p>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-cream-darker bg-white py-7">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-sm text-charcoal/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 M2M · Mitti to Market</span>
          <span>Better decisions. Better outcomes.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
