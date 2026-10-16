"use client";

import React, { useState } from "react";
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Cookie,
  Users,
  Lock,
  Gavel,
  HeartPulse,
} from "lucide-react";

type TabId =
  | "risk-disclosure"
  | "terms"
  | "privacy"
  | "cookies"
  | "community";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "risk-disclosure", label: "Risk Disclosure", icon: AlertTriangle },
  { id: "terms", label: "Terms of Service", icon: FileText },
  { id: "privacy", label: "Privacy Policy", icon: Lock },
  { id: "cookies", label: "Cookie Policy", icon: Cookie },
  { id: "community", label: "Community Guidelines", icon: Users },
];

export default function LegalHub() {
  const [active, setActive] = useState<TabId>("risk-disclosure");

  return (
    <div className="legal-container">
      <div className="legal-hero">
        <div className="legal-hero-left">
          <div className="kicker-badge"><Scale size={15} /> LEGAL & COMPLIANCE</div>
          <h1>Transparency, in writing<span className="title-dot">.</span></h1>
          <p>
            Atlas Academy is an <strong>educational platform only</strong>. Every trade you see
            here uses <strong>virtual funds</strong> with zero real-money execution. The documents
            below explain what we do, what we don&apos;t do, and how we handle your data.
          </p>
        </div>
        <div className="legal-hero-right">
          <div className="legal-hero-emblem">
            <Gavel size={32} strokeWidth={1.4} />
            <span>v1.0 · Updated {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Compliance banner */}
      <div className="legal-compliance-banner">
        <ShieldCheck size={20} />
        <div>
          <strong>Nothing on this platform constitutes financial advice.</strong>
          All examples are educational simulations using virtual funds. Past performance does not
          guarantee future results. Trading foreign exchange and binary options carries a high
          level of risk and may not be suitable for all investors.
        </div>
      </div>

      {/* Tab navigation */}
      <div className="legal-tabs-row" role="tablist">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              className={`legal-tab ${isActive ? "active" : ""}`}
              onClick={() => setActive(t.id)}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="legal-tab-body">
        {active === "risk-disclosure" && <RiskDisclosure />}
        {active === "terms" && <TermsOfService />}
        {active === "privacy" && <PrivacyPolicy />}
        {active === "cookies" && <CookiePolicy />}
        {active === "community" && <CommunityGuidelines />}
      </div>

      <div className="legal-foot-note">
        <HeartPulse size={14} />
        <span>
          These documents are provided for educational transparency and are not legal advice. For
          formal guidance, consult a licensed attorney in your jurisdiction.
        </span>
      </div>
    </div>
  );
}

// ============================
// Section: Risk Disclosure
// ============================

function RiskDisclosure() {
  return (
    <LegalSection
      title="Risk Disclosure Statement"
      intro="Foreign exchange margin trading and binary options carry substantial risk and are not appropriate for every investor. Please read this disclosure in full before using any simulation on Atlas Academy."
    >
      <Block heading="Educational purpose only">
        Atlas Academy is an <strong>educational platform</strong>. All trading activity conducted
        on this platform — including the Trading Lab, Backtest Arena, Monte Carlo simulator, and
        Binary Options Lab — uses <strong>virtual funds only</strong>. No real money is deposited,
        held, or transacted. The platform cannot execute, route, or settle any real-world trade.
      </Block>
      <Block heading="Not financial advice">
        All content, lessons, simulations, AI Coach responses, and analytics are provided for
        general informational and educational purposes only. Nothing on this platform constitutes
        financial, investment, legal, tax, or trading advice. You should consult a qualified
        financial professional before making any investment decision.
      </Block>
      <Block heading="Leverage can amplify losses">
        Forex trading involves leverage, which allows you to control positions larger than your
        initial margin. While leverage can amplify gains, it <strong>magnifies losses to the same
        degree</strong>. A small adverse market move can result in the loss of your entire account
        balance and, in a live account, may exceed your initial deposit.
      </Block>
      <Block heading="Past performance does not guarantee future results">
        Backtests, strategy audits, and equity-curve simulations presented in this platform are
        based on historical data. Historical performance is <strong>not a reliable indicator</strong>{" "}
        of future returns. Market structure, volatility regimes, liquidity conditions, and
        correlations change over time.
      </Block>
      <Block heading="Binary options are statistically unfavourable">
        The Binary Options Lab demonstrates mathematically that retail binary options have a
        negative expected value due to asymmetric payouts (e.g. risking 100% to win 70–85%). The
        house edge is structural. Most retail traders lose money trading binary options.
      </Block>
      <Block heading="Psychological risk">
        Trading can become addictive. The simulated environment on Atlas Academy is intentionally
        designed to teach disciplined process over profit-chasing. If you find yourself compulsively
        checking markets or trading to recover losses, please seek help from a qualified mental
        health professional.
      </Block>
      <Block heading="Regulatory status">
        Atlas Academy is <strong>not</strong> a registered broker-dealer, futures commission
        merchant, or investment adviser. The platform does not facilitate real-money trading
        and is not regulated as a financial institution.
      </Block>
    </LegalSection>
  );
}

// ============================
// Section: Terms of Service
// ============================

function TermsOfService() {
  return (
    <LegalSection
      title="Terms of Service"
      intro="These terms govern your use of Atlas Academy. By creating an account or browsing the platform, you agree to the terms below."
    >
      <Block heading="1. Acceptance of terms">
        By accessing Atlas Academy (the &quot;Service&quot;), you agree to be bound by these Terms
        of Service and our Privacy Policy. If you do not agree, do not use the Service.
      </Block>
      <Block heading="2. Eligibility">
        You must be at least <strong>18 years of age</strong> (or the age of legal majority in
        your jurisdiction) to create an account. By registering, you represent that you meet this
        requirement.
      </Block>
      <Block heading="3. Educational licence, not brokerage">
        Atlas Academy grants you a limited, non-exclusive, non-transferable licence to use the
        Service for personal educational purposes. The Service is <strong>not</strong> a brokerage,
        exchange, or money transmitter. No real-money accounts are offered.
      </Block>
      <Block heading="4. Virtual funds">
        All balances, trades, P&amp;L, and equity curves displayed on the Service represent
        <strong> virtual, simulated data</strong>. Virtual funds have no monetary value, cannot be
        withdrawn, exchanged, or redeemed for any real currency or asset.
      </Block>
      <Block heading="5. Account responsibilities">
        You are responsible for safeguarding your password and for all activity under your
        account. Notify us immediately of any unauthorised use. We are not liable for losses from
        compromised credentials.
      </Block>
      <Block heading="6. Acceptable use">
        You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to reverse-
        engineer, scrape, or disrupt the Service; (c) upload malicious code; (d) impersonate
        another person; (e) use the AI Coach outputs as personalised financial advice; or (f)
        resell or commercially exploit simulated trade data from the Service.
      </Block>
      <Block heading="7. Intellectual property">
        All curriculum content, lesson text, code, designs, and the Atlas Academy brand are owned
        by the platform operator and protected by applicable intellectual property laws. You may
        not redistribute, republish, or commercially licence the content without written
        permission.
      </Block>
      <Block heading="8. Disclaimers">
        The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties
        of any kind, express or implied. We do not warrant that the Service will be error-free,
        uninterrupted, or that simulations will reflect real-world market behaviour. AI Coach
        answers may be inaccurate and must not be relied upon for decisions involving real money.
      </Block>
      <Block heading="9. Limitation of liability">
        To the maximum extent permitted by law, Atlas Academy and its operators shall not be
        liable for any indirect, incidental, consequential, or punitive damages, or any loss of
        profits or data, arising from your use of the Service.
      </Block>
      <Block heading="10. Termination">
        We may suspend or terminate your account at any time, with or without cause or notice.
        Upon termination, your right to use the Service ceases immediately.
      </Block>
      <Block heading="11. Governing law">
        These Terms shall be governed by the laws of the operator&apos;s jurisdiction without
        regard to conflict-of-laws principles.
      </Block>
      <Block heading="12. Changes to terms">
        We may update these Terms from time to time. Material changes will be communicated via
        in-app notice or email. Continued use after changes take effect constitutes acceptance.
      </Block>
    </LegalSection>
  );
}

// ============================
// Section: Privacy Policy
// ============================

function PrivacyPolicy() {
  return (
    <LegalSection
      title="Privacy Policy"
      intro="We respect your privacy. This policy explains what we collect, why we collect it, and the controls you have over your data."
    >
      <Block heading="1. Data we collect">
        <ul>
          <li><strong>Account information:</strong> name, email, hashed password (scrypt with random per-user salt).</li>
          <li><strong>Learning activity:</strong> lesson progress, quiz attempts, diagnostic scores, skill mastery state, learning sessions, achievement unlocks.</li>
          <li><strong>Simulated trade data:</strong> orders, positions, journal entries, mood ratings, emotion check-ins you choose to record.</li>
          <li><strong>Technical data:</strong> session cookies, IP address, browser type, anonymous usage analytics.</li>
        </ul>
      </Block>
      <Block heading="2. How we use your data">
        We use your data to: (a) authenticate your account and maintain your session; (b) power
        adaptive learning recommendations; (c) compute analytics such as the learning heatmap,
        skill mastery distribution, and retention decay; (d) award achievements and XP; (e) provide
        AI Coach answers grounded in approved curriculum; (f) prevent fraud and abuse.
      </Block>
      <Block heading="3. Legal basis (GDPR)">
        For users in the European Economic Area, we rely on: (a) <strong>contract</strong> — to
        deliver the educational Service you signed up for; (b) <strong>legitimate interest</strong>{" "}
        — to prevent abuse and improve educational outcomes; (c) <strong>consent</strong> — for
        optional analytics cookies (see Cookie Policy).
      </Block>
      <Block heading="4. Data storage">
        Your data is stored in a managed PostgreSQL database hosted on a major cloud provider.
        Passwords are never stored in plaintext — we use scrypt with per-user salts. Session
        tokens are hashed with SHA-256 before storage.
      </Block>
      <Block heading="5. Data retention">
        We retain your account data for as long as your account is active. You may request
        deletion of your account at any time; we will remove personal data within 30 days, except
        where retention is required by law (e.g. audit logs).
      </Block>
      <Block heading="6. Your rights">
        Subject to your jurisdiction, you have the right to: access, correct, export, restrict
        processing of, and delete your personal data. To exercise any right, contact us using the
        details below.
      </Block>
      <Block heading="7. Sharing of data">
        We do <strong>not</strong> sell your personal data. We share data only with: (a) service
        providers (e.g. database hosting, email delivery) under written data-processing
        agreements; (b) law enforcement where legally compelled.
      </Block>
      <Block heading="8. International transfers">
        Your data may be processed in a country other than your own. Where this involves a
        transfer outside the EEA, we rely on standard contractual clauses or another valid
        transfer mechanism.
      </Block>
      <Block heading="9. Children&apos;s privacy">
        The Service is not directed to children under <strong>16</strong>. We do not knowingly
        collect personal data from anyone under 16. If you believe we have done so inadvertently,
        contact us for prompt deletion.
      </Block>
      <Block heading="10. Changes to this policy">
        We will notify users of material changes by email or in-app notice at least 14 days
        before they take effect.
      </Block>
    </LegalSection>
  );
}

// ============================
// Section: Cookie Policy
// ============================

function CookiePolicy() {
  return (
    <LegalSection
      title="Cookie Policy"
      intro="Atlas Academy uses cookies and similar technologies to keep you signed in, remember your preferences, and understand how the platform is used."
    >
      <Block heading="1. What are cookies?">
        Cookies are small text files stored on your device by your browser when you visit a
        website. They allow the site to remember your actions and preferences over time.
      </Block>
      <Block heading="2. Cookies we use">
        <ul>
          <li>
            <strong>Essential cookie — <code>atlas_session</code></strong>: Stores your signed
            session token (HTTP-only, SHA-256 hashed server-side). Required for authentication.
            Without this cookie, you cannot stay signed in.
          </li>
          <li>
            <strong>Local-storage preferences</strong>: UI state such as the &quot;guided welcome
            seen&quot; flag, saved class IDs, and guest-mode lesson completions. These are stored
            in your browser&apos;s local storage and cleared when you sign out.
          </li>
          <li>
            <strong>Analytics (optional)</strong>: If enabled, anonymous page-view metrics may be
            collected to help us improve the curriculum. No personally identifying information is
            sent.
          </li>
        </ul>
      </Block>
      <Block heading="3. Managing cookies">
        You can control cookies through your browser settings. Most browsers allow you to refuse
        non-essential cookies, delete existing cookies, or alert you before a cookie is stored.
        Disabling the <code>atlas_session</code> cookie will sign you out and prevent
        re-authentication.
      </Block>
      <Block heading="4. Third-party services">
        We use Google Fonts to serve the Manrope, DM Sans, and JetBrains Mono typefaces. This
        request is logged by Google but not tied to your Atlas account. No advertising cookies
        are used.
      </Block>
      <Block heading="5. Updates">
        If we add new cookies in the future, we will update this policy and, where required,
        request your consent before setting them.
      </Block>
    </LegalSection>
  );
}

// ============================
// Section: Community Guidelines
// ============================

function CommunityGuidelines() {
  return (
    <LegalSection
      title="Community Guidelines"
      intro="Atlas Academy is a learning community. These guidelines apply to any user-generated content, including future discussion features, journal entry sharing, and feedback submissions."
    >
      <Block heading="1. Be honest about your learning">
        Faking achievements or skill mastery only harms you. The platform is built to give you
        accurate feedback on what you actually know — gaming the system defeats the entire purpose.
      </Block>
      <Block heading="2. No financial advice">
        Do not solicit, offer, or imply personalised financial advice in any user-generated
        content. Discussing concepts (e.g. &quot;what does the 1% rule mean?&quot;) is welcomed;
        recommending specific trades (&quot;buy EUR/USD now&quot;) is not.
      </Block>
      <Block heading="3. Respect other learners">
        Treat every member with courtesy. No harassment, discrimination, hate speech, or
        personal attacks based on race, gender, sexual orientation, religion, nationality, or
        experience level.
      </Block>
      <Block heading="4. No spam or commercial solicitation">
        Do not post promotional content, referral links, external brokerage offers, signal-group
        invitations, or unsolicited commercial messages. Atlas Academy is an educational space,
        not a marketing channel.
      </Block>
      <Block heading="5. Protect your credentials">
        Never share your password, session token, or personal data with other users. Atlas
        Academy staff will never ask for your password.
      </Block>
      <Block heading="6. Reporting violations">
        If you encounter content that violates these guidelines, please report it through the
        in-platform contact channel. We will review each report promptly and act in accordance
        with these guidelines.
      </Block>
      <Block heading="7. Enforcement">
        Violations may result in content removal, account suspension, or permanent termination.
        Serious violations (e.g. attempting to extract real-money trading functionality) will
        result in immediate termination.
      </Block>
      <Block heading="8. Attribution">
        If you reference or quote curriculum content externally, please attribute it to
        &quot;Atlas Academy&quot; and link back to the platform where possible.
      </Block>
    </LegalSection>
  );
}

// ============================
// Presentational helpers
// ============================

function LegalSection({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <article className="legal-article">
      <header className="legal-article-head">
        <h2>{title}</h2>
        <p>{intro}</p>
      </header>
      <div className="legal-blocks">{children}</div>
    </article>
  );
}

function Block({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legal-block">
      <h3>{heading}</h3>
      <div className="legal-block-body">{children}</div>
    </section>
  );
}
