import React, { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  LANDING_CLOSING_COPY,
  LANDING_HERO_COPY,
  LANDING_SHOWCASE_COPY,
  LANDING_SHOWCASE_SITES,
  LANDING_TEAM_COPY,
  LANDING_TEAM_MEMBERS,
  LANDING_TESTIMONIAL,
  ShowcaseSite,
} from '../../utils/landing';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface BuildGridLandingPageProps {
  onOpenPortals: () => void;
  onOpenWorkspace: () => void;
}

export const BuildGridLandingPage: React.FC<BuildGridLandingPageProps> = ({
  onOpenPortals,
  onOpenWorkspace,
}) => {
  const { roleSession, showToast } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<ShowcaseSite | null>(null);
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [briefOrg, setBriefOrg] = useState('');
  const [briefLocation, setBriefLocation] = useState('');
  const [briefScope, setBriefScope] = useState('');

  const featuredSite = LANDING_SHOWCASE_SITES[0];
  const stripSites = LANDING_SHOWCASE_SITES.slice(1);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBriefSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefOrg.trim()) return;
    showToast(`Site brief registered for ${briefOrg.trim()}. Select a role portal to inspect operations.`, 'success');
    setBriefModalOpen(false);
    setBriefOrg('');
    setBriefLocation('');
    setBriefScope('');
  };

  return (
    <div
      className="min-h-screen bg-[#000000] text-[#f9f8f9] antialiased selection:bg-[#6ee3ad]/20 selection:text-[#f9f8f9]"
      style={{ fontFamily: 'var(--font-grotesk)' }}
    >
      {/* 1. Site Header */}
      <header className="sticky top-0 z-40 border-b border-[#1d1d1d]/80 bg-[#000000]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f9f8f9]/50"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="shrink-0 text-[#f9f8f9]"
            >
              <rect x="1.5" y="1.5" width="17" height="17" stroke="currentColor" strokeWidth="1.4" />
              <line x1="7.2" y1="1.5" x2="7.2" y2="18.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="12.8" y1="1.5" x2="12.8" y2="18.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="1.5" y1="7.2" x2="18.5" y2="7.2" stroke="currentColor" strokeWidth="1.2" />
              <line x1="1.5" y1="12.8" x2="18.5" y2="12.8" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span
              className="text-[19px] font-medium tracking-[-0.01em] text-[#f9f8f9]"
              style={{ fontFamily: 'var(--font-editorial)' }}
            >
              BuildGrid
            </span>
          </button>

          {/* Center 3 links */}
          <nav aria-label="Landing navigation" className="hidden items-center gap-8 md:flex">
            <button
              type="button"
              onClick={() => scrollToSection('sites')}
              className="text-[14px] text-[#d6d6d5] transition-colors hover:text-[#f9f8f9] focus:outline-none focus-visible:underline"
            >
              Sites
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('testimonial')}
              className="text-[14px] text-[#d6d6d5] transition-colors hover:text-[#f9f8f9] focus:outline-none focus-visible:underline"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('team')}
              className="text-[14px] text-[#d6d6d5] transition-colors hover:text-[#f9f8f9] focus:outline-none focus-visible:underline"
            >
              Team
            </button>
          </nav>

          {/* Right Actions + Narrow Screen Menu Button */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenPortals}
              className="hidden text-[14px] font-medium text-[#e5e5e4] transition-colors hover:text-[#f9f8f9] sm:inline-flex"
            >
              Portal login
            </button>
            <button
              type="button"
              onClick={onOpenWorkspace}
              className="hidden whitespace-nowrap rounded-full bg-[#1c1c1c] px-4 py-2 text-[13px] font-medium text-[#fcfcfd] transition-colors hover:bg-[#2a2a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f9f8f9] sm:inline-flex"
            >
              {roleSession ? 'Return to dashboard' : 'Open workspace'}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1d1d1d] bg-[#0b0b0b] text-[#f9f8f9] md:hidden"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-[#1d1d1d] bg-[#0b0b0b] px-6 py-5 md:hidden">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('sites')}
                className="py-1.5 text-left text-[15px] text-[#e5e5e4] hover:text-[#f9f8f9]"
              >
                Sites
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('testimonial')}
                className="py-1.5 text-left text-[15px] text-[#e5e5e4] hover:text-[#f9f8f9]"
              >
                Platform
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('team')}
                className="py-1.5 text-left text-[15px] text-[#e5e5e4] hover:text-[#f9f8f9]"
              >
                Team
              </button>
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#1d1d1d] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPortals();
                  }}
                  className="rounded-full border border-[#1d1d1d] px-4 py-2 text-[13px] font-medium text-[#f9f8f9]"
                >
                  Portal login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenWorkspace();
                  }}
                  className="rounded-full bg-[#1c1c1c] px-4 py-2 text-[13px] font-medium text-[#fcfcfd]"
                >
                  {roleSession ? 'Return to dashboard' : 'Open workspace'}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* 2. Hero */}
        <section
          aria-label="Hero"
          className="mx-auto max-w-[1200px] px-6 pt-16 pb-12 lg:pt-24 lg:pb-16"
        >
          <h1
            className="max-w-[1040px] text-[72px] leading-[0.98] font-medium tracking-[-0.03em] text-[#f9f8f9] lg:text-[96px]"
            style={{ fontFamily: 'var(--font-editorial)' }}
          >
            <span className="block">{LANDING_HERO_COPY.headlineLine1}</span>
            <span className="block">{LANDING_HERO_COPY.headlineLine2}</span>
          </h1>

          <div className="mt-12 flex flex-col justify-between gap-8 border-b border-[#1d1d1d] pb-12 lg:mt-16 lg:flex-row lg:items-start lg:pb-16">
            <p className="max-w-[430px] text-[16px] leading-[1.6] text-[#e5e5e4]">
              {LANDING_HERO_COPY.intro}
            </p>

            <div className="flex flex-col items-start gap-4 lg:items-start">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenWorkspace}
                  className="whitespace-nowrap rounded-full bg-[#1c1c1c] px-5 py-2.5 text-[14px] font-medium text-[#fcfcfd] transition-colors hover:bg-[#2a2a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f9f8f9]"
                >
                  {roleSession ? 'Return to dashboard' : LANDING_HERO_COPY.primaryCta}
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('sites')}
                  className="whitespace-nowrap rounded-full border border-[#1d1d1d] bg-transparent px-5 py-2.5 text-[14px] font-medium text-[#f9f8f9] transition-colors hover:bg-[#0b0b0b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f9f8f9]"
                >
                  {LANDING_HERO_COPY.secondaryCta}
                </button>
              </div>

              {/* Trust avatars + caption */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {LANDING_TEAM_MEMBERS.slice(0, 3).map((member) => (
                    <ImageWithFallback
                      key={member.id}
                      src={member.imageUrl}
                      alt={member.name}
                      fallbackLabel={member.name}
                      className="h-7 w-7 rounded-full border border-[#000000] object-cover"
                    />
                  ))}
                </div>
                <span className="text-[13px] text-[#d6d6d5]">
                  {LANDING_HERO_COPY.trustCaption}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Showcase: 1 Full-width project above 3-column strip (4 projects, full-bleed photos) */}
        <section
          id="sites"
          aria-label="Selected construction sites"
          className="mx-auto max-w-[1200px] px-6 pt-12 pb-12 lg:pt-16 lg:pb-16"
        >
          <div className="max-w-[520px]">
            <h2
              className="text-[36px] leading-[1.1] font-medium tracking-[-0.02em] text-[#f9f8f9] sm:text-[44px]"
              style={{ fontFamily: 'var(--font-editorial)' }}
            >
              {LANDING_SHOWCASE_COPY.heading}
            </h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-[#d6d6d5]">
              {LANDING_SHOWCASE_COPY.introLine1}
            </p>
            <p className="mt-1 text-[15px] leading-[1.6] text-[#d6d6d5]">
              {LANDING_SHOWCASE_COPY.introLine2}
            </p>
          </div>

          {/* Featured Full-Width Project */}
          <div className="mt-10">
            <button
              type="button"
              onClick={() => setSelectedSite(featuredSite)}
              className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f9f8f9]"
            >
              <div className="overflow-hidden bg-[#0b0b0b]">
                <ImageWithFallback
                  src={featuredSite.imageUrl}
                  alt={featuredSite.title}
                  fallbackLabel={featuredSite.title}
                  className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                />
              </div>
              <div className="mt-3.5 flex items-baseline justify-between gap-4">
                <h3
                  className="text-[24px] font-medium tracking-[-0.015em] text-[#f9f8f9] sm:text-[28px]"
                  style={{ fontFamily: 'var(--font-editorial)' }}
                >
                  {featuredSite.title}
                </h3>
                <span className="shrink-0 text-[13px] text-[#d6d6d5]">
                  {featuredSite.caption}
                </span>
              </div>
            </button>
          </div>

          {/* 3-Column Strip of Remaining Projects */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {stripSites.map((site) => (
              <button
                key={site.id}
                type="button"
                onClick={() => setSelectedSite(site)}
                className="group block text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f9f8f9]"
              >
                <div className="overflow-hidden bg-[#0b0b0b]">
                  <ImageWithFallback
                    src={site.imageUrl}
                    alt={site.title}
                    fallbackLabel={site.title}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="mt-3">
                  <h3
                    className="text-[20px] font-medium tracking-[-0.01em] text-[#f9f8f9]"
                    style={{ fontFamily: 'var(--font-editorial)' }}
                  >
                    {site.title}
                  </h3>
                  <p className="mt-0.5 text-[13px] text-[#d6d6d5]">{site.caption}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 4. Testimonials: One large centred quote with avatar */}
        <section
          id="testimonial"
          aria-label="Client testimonial"
          className="mx-auto max-w-[1200px] px-6 py-20 lg:py-28"
        >
          <div className="mx-auto flex max-w-[820px] flex-col items-center text-center">
            <span
              aria-hidden="true"
              className="text-[52px] leading-none font-medium text-[#f9f8f9]"
              style={{ fontFamily: 'var(--font-editorial)' }}
            >
              &ldquo;
            </span>
            <blockquote
              className="mt-4 text-[30px] leading-[1.22] font-medium tracking-[-0.02em] text-[#f9f8f9] sm:text-[42px]"
              style={{ fontFamily: 'var(--font-editorial)' }}
            >
              {LANDING_TESTIMONIAL.quote}
            </blockquote>

            <div className="mt-8 flex items-center gap-3.5 text-left">
              <ImageWithFallback
                src={LANDING_TESTIMONIAL.avatarUrl}
                alt={LANDING_TESTIMONIAL.author}
                fallbackLabel={LANDING_TESTIMONIAL.author}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-[#1d1d1d]"
              />
              <div>
                <p className="text-[14px] font-medium text-[#f9f8f9]">
                  {LANDING_TESTIMONIAL.author}
                </p>
                <p className="text-[13px] text-[#d6d6d5]">{LANDING_TESTIMONIAL.role}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Team: Portraits with 4 people and roles */}
        <section
          id="team"
          aria-label="Engineering leadership team"
          className="mx-auto max-w-[1200px] px-6 pt-12 pb-16 lg:pt-20 lg:pb-24"
        >
          <div className="max-w-[560px]">
            <h2
              className="text-[36px] leading-[1.1] font-medium tracking-[-0.02em] text-[#f9f8f9] sm:text-[44px]"
              style={{ fontFamily: 'var(--font-editorial)' }}
            >
              {LANDING_TEAM_COPY.heading}
            </h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-[#d6d6d5]">
              {LANDING_TEAM_COPY.intro}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LANDING_TEAM_MEMBERS.map((member) => (
              <article key={member.id} className="group">
                <div className="overflow-hidden rounded-[16px] bg-[#0b0b0b] ring-1 ring-[#1d1d1d]">
                  <ImageWithFallback
                    src={member.imageUrl}
                    alt={`${member.name} — ${member.role}`}
                    fallbackLabel={member.name}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <h3 className="mt-3.5 text-[15px] font-medium text-[#f9f8f9]">
                  {member.name}
                </h3>
                <p className="mt-0.5 text-[13px] text-[#d6d6d5]">{member.role}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 6. Closing: Copy beside a full-bleed photo */}
        <section
          id="closing"
          aria-label="Start a project"
          className="mx-auto max-w-[1200px] px-6 py-16 lg:py-24"
        >
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <h2
                className="text-[44px] leading-[1.04] font-medium tracking-[-0.025em] text-[#f9f8f9] sm:text-[56px]"
                style={{ fontFamily: 'var(--font-editorial)' }}
              >
                <span className="block">{LANDING_CLOSING_COPY.headingLine1}</span>
                <span className="block">{LANDING_CLOSING_COPY.headingLine2}</span>
              </h2>
              <p className="mt-5 max-w-[380px] text-[15px] leading-[1.6] text-[#e5e5e4]">
                {LANDING_CLOSING_COPY.intro}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBriefModalOpen(true)}
                  className="whitespace-nowrap rounded-full bg-[#1c1c1c] px-5 py-2.5 text-[14px] font-medium text-[#fcfcfd] transition-colors hover:bg-[#2a2a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f9f8f9]"
                >
                  {LANDING_CLOSING_COPY.ctaLabel}
                </button>
                <button
                  type="button"
                  onClick={onOpenPortals}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#1d1d1d] px-5 py-2.5 text-[14px] font-medium text-[#f9f8f9] transition-colors hover:bg-[#0b0b0b]"
                >
                  <span>Role portals</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="overflow-hidden bg-[#0b0b0b]">
                <ImageWithFallback
                  src={LANDING_CLOSING_COPY.imageUrl}
                  alt={LANDING_CLOSING_COPY.imageAlt}
                  fallbackLabel="BuildGrid Studio"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer: 3 grouped link columns above, full-width brand name, bottom bar */}
      <footer className="border-t border-[#1d1d1d] pt-16 pb-10">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:max-w-[640px]">
            <div>
              <h3 className="text-[13px] font-medium text-[#f9f8f9]">Sites</h3>
              <ul className="mt-3 space-y-2 text-[14px] text-[#d6d6d5]">
                <li>
                  <button
                    type="button"
                    onClick={() => setSelectedSite(LANDING_SHOWCASE_SITES[0])}
                    className="transition-colors hover:text-[#f9f8f9]"
                  >
                    Whitefield Towers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setSelectedSite(LANDING_SHOWCASE_SITES[1])}
                    className="transition-colors hover:text-[#f9f8f9]"
                  >
                    Cauvery Tech Hub
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setSelectedSite(LANDING_SHOWCASE_SITES[2])}
                    className="transition-colors hover:text-[#f9f8f9]"
                  >
                    NH-48 Corridor
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] font-medium text-[#f9f8f9]">Platform</h3>
              <ul className="mt-3 space-y-2 text-[14px] text-[#d6d6d5]">
                <li>
                  <button
                    type="button"
                    onClick={onOpenWorkspace}
                    className="transition-colors hover:text-[#f9f8f9]"
                  >
                    Operations Dashboard
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenPortals}
                    className="transition-colors hover:text-[#f9f8f9]"
                  >
                    4 Role Login Portals
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('team')}
                    className="transition-colors hover:text-[#f9f8f9]"
                  >
                    Engineering Leadership
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] font-medium text-[#f9f8f9]">Contact</h3>
              <ul className="mt-3 space-y-2 text-[14px] text-[#d6d6d5]">
                <li>
                  <button
                    type="button"
                    onClick={() => setBriefModalOpen(true)}
                    className="transition-colors hover:text-[#f9f8f9]"
                  >
                    Start a site brief
                  </button>
                </li>
                <li>
                  <span className="text-[#d6d6d5]">MG Road, Bengaluru</span>
                </li>
                <li>
                  <a
                    href="mailto:operations@buildgrid.in"
                    className="transition-colors hover:text-[#f9f8f9]"
                  >
                    operations@buildgrid.in
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Full-width brand wordmark */}
          <div className="mt-14 overflow-hidden py-2">
            <p
              className="select-none text-center font-medium tracking-[-0.035em] text-[#f9f8f9]"
              style={{
                fontFamily: 'var(--font-editorial)',
                fontSize: 'clamp(4.5rem, 19.5vw, 16.5rem)',
                lineHeight: 0.88,
              }}
            >
              BuildGrid
            </p>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-[#1d1d1d] pt-6 text-[13px] text-[#d6d6d5] sm:flex-row sm:items-center">
            <p>© 2026 BuildGrid Infra &amp; Civil Works · Bengaluru</p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => scrollToSection('sites')}
                className="transition-colors hover:text-[#f9f8f9]"
              >
                Field Journal
              </button>
              <button
                type="button"
                onClick={onOpenPortals}
                className="transition-colors hover:text-[#f9f8f9]"
              >
                Portal Login
              </button>
              <a
                href="mailto:operations@buildgrid.in"
                className="transition-colors hover:text-[#f9f8f9]"
              >
                Mail
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Site Detail Modal (uses #6ee3ad exclusively as product active status indicator) */}
      {selectedSite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="landing-site-modal-title"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-[16px] border border-[#1d1d1d] bg-[#0b0b0b]">
            <ImageWithFallback
              src={selectedSite.imageUrl}
              alt={selectedSite.title}
              fallbackLabel={selectedSite.title}
              className="aspect-[16/9] w-full object-cover"
            />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[12px] text-[#d6d6d5]">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 rounded-full bg-[#6ee3ad]"
                    />
                    <span>{selectedSite.caption}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedSite.location}</span>
                  </div>
                  <h3
                    id="landing-site-modal-title"
                    className="mt-1.5 text-[28px] font-medium text-[#f9f8f9]"
                    style={{ fontFamily: 'var(--font-editorial)' }}
                  >
                    {selectedSite.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSite(null)}
                  aria-label="Close site preview"
                  className="rounded-full border border-[#1d1d1d] p-2 text-[#d6d6d5] hover:bg-[#1c1c1c] hover:text-[#f9f8f9]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#e5e5e4]">{selectedSite.scope}</p>
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSite(null)}
                  className="rounded-full border border-[#1d1d1d] px-4 py-2 text-[13px] font-medium text-[#e5e5e4] hover:bg-[#1c1c1c]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSite(null);
                    onOpenWorkspace();
                  }}
                  className="rounded-full bg-[#1c1c1c] px-5 py-2 text-[13px] font-medium text-[#fcfcfd] hover:bg-[#2a2a2a]"
                >
                  Inspect in BuildGrid Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Site Brief Inquiry Modal */}
      {briefModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="landing-brief-title"
        >
          <div className="w-full max-w-md rounded-[16px] border border-[#1d1d1d] bg-[#0b0b0b] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  id="landing-brief-title"
                  className="text-[28px] font-medium text-[#f9f8f9]"
                  style={{ fontFamily: 'var(--font-editorial)' }}
                >
                  Start a site brief
                </h3>
                <p className="mt-1 text-[14px] text-[#d6d6d5]">
                  Register a new construction package or jump directly into a role portal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBriefModalOpen(false)}
                aria-label="Close site brief dialog"
                className="rounded-full border border-[#1d1d1d] p-2 text-[#d6d6d5] hover:bg-[#1c1c1c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBriefSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="brief-org"
                  className="block text-[13px] font-medium text-[#e5e5e4]"
                >
                  Client or Contractor Name
                </label>
                <input
                  id="brief-org"
                  type="text"
                  required
                  value={briefOrg}
                  onChange={(e) => setBriefOrg(e.target.value)}
                  placeholder="e.g., Prestige Horizon Infra"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#1d1d1d] bg-[#000000] px-3 text-[14px] text-[#f9f8f9] placeholder:text-[#7a7a78] focus:border-[#f9f8f9] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="brief-location"
                  className="block text-[13px] font-medium text-[#e5e5e4]"
                >
                  Site Location
                </label>
                <input
                  id="brief-location"
                  type="text"
                  value={briefLocation}
                  onChange={(e) => setBriefLocation(e.target.value)}
                  placeholder="e.g., Whitefield, Bengaluru"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#1d1d1d] bg-[#000000] px-3 text-[14px] text-[#f9f8f9] placeholder:text-[#7a7a78] focus:border-[#f9f8f9] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="brief-scope"
                  className="block text-[13px] font-medium text-[#e5e5e4]"
                >
                  Structural Scope
                </label>
                <textarea
                  id="brief-scope"
                  rows={2}
                  value={briefScope}
                  onChange={(e) => setBriefScope(e.target.value)}
                  placeholder="Commercial campus, residential towers, or highway works..."
                  className="mt-1.5 w-full rounded-lg border border-[#1d1d1d] bg-[#000000] p-3 text-[14px] text-[#f9f8f9] placeholder:text-[#7a7a78] focus:border-[#f9f8f9] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBriefModalOpen(false);
                    onOpenPortals();
                  }}
                  className="text-[13px] font-medium text-[#d6d6d5] underline underline-offset-4 hover:text-[#f9f8f9]"
                >
                  Enter Role Portals instead
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBriefModalOpen(false)}
                    className="rounded-full border border-[#1d1d1d] px-4 py-2 text-[13px] font-medium text-[#e5e5e4] hover:bg-[#1c1c1c]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#1c1c1c] px-5 py-2 text-[13px] font-medium text-[#fcfcfd] hover:bg-[#2a2a2a]"
                  >
                    Submit brief
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
