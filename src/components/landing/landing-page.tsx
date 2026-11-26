"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { OffcutLogo } from "@/components/offcut/logo";
import { OffcutShell } from "@/components/offcut/shell";
import { COPY } from "./copy";
import { ImpactPreview, MarketplacePreview, MatchingPreview, PlatformPreview } from "./previews";
import styles from "./landing.module.css";

export function LandingPage() {
  const { lang } = useI18n();
  const c = COPY[lang];

  return (
    <div className={styles.page}>
      <OffcutShell bare footer={false}>
        <section className={styles.hero} aria-labelledby="home-hero-title">
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <p className={styles.kickerLight}>{c.hero.eyebrow}</p>
                <h1 id="home-hero-title" className={styles.heroTitle}>
                  {c.hero.title}
                </h1>
                <p className={styles.heroSubtitle}>{c.hero.subtitle}</p>
                <div className={styles.actions}>
                  <Link className={`${styles.button} ${styles.buttonOnDark}`} href="/app/listings/new">
                    {c.hero.sell}
                  </Link>
                  <Link className={`${styles.button} ${styles.buttonGhostLight}`} href="/app/marketplace">
                    {c.hero.buy}
                  </Link>
                </div>
                <p className={styles.heroNote}>{c.hero.note}</p>
              </div>

              <div className={styles.heroVisual} role="group" aria-label={c.hero.previewLabel}>
                <div className={styles.visualCard}>
                  <div className={styles.visualHead}>
                    <span>{c.hero.visual.category}</span>
                    <span className={styles.status}>
                      <span className={styles.statusDot} aria-hidden="true" />
                      {c.hero.visual.status}
                    </span>
                  </div>
                  <div className={styles.visualImage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/material-carta.svg" alt={c.hero.visual.imageAlt} />
                  </div>
                  <div className={styles.visualFoot}>
                    <div>
                      <span className={styles.visualLabel}>{c.hero.visual.priceLabel}</span>
                      <strong>{c.hero.visual.price}</strong>
                    </div>
                    <span className={styles.visualFlowLabel}>{c.hero.visual.flowLabel}</span>
                  </div>
                </div>
                <ol className={styles.visualSteps}>
                  {c.hero.visual.steps.map((step, index) => (
                    <li key={step}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className={styles.visualCaption}>{c.hero.visual.caption}</p>
              </div>
            </div>

            <dl className={styles.heroStrip}>
              {c.hero.strip.map((item) => (
                <div key={item.value}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="come-funziona" className={`${styles.section} ${styles.light}`} aria-labelledby="process-title">
          <div className={styles.container}>
            <div className={styles.splitHead}>
              <div>
                <p className={styles.kicker}>{c.process.eyebrow}</p>
                <h2 id="process-title" className={styles.h2}>
                  {c.process.title}
                </h2>
              </div>
              <p className={styles.lead}>{c.process.desc}</p>
            </div>
            <ol className={styles.steps}>
              {c.process.steps.map((step) => (
                <li className={styles.step} key={step.n}>
                  <span className={styles.stepNumber}>{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="per-chi" className={`${styles.section} ${styles.parchment}`} aria-labelledby="audience-title">
          <div className={styles.container}>
            <div className={styles.splitHead}>
              <div>
                <p className={styles.kicker}>{c.audience.eyebrow}</p>
                <h2 id="audience-title" className={styles.h2}>
                  {c.audience.title}
                </h2>
              </div>
              <p className={styles.lead}>{c.audience.desc}</p>
            </div>
            <div className={styles.audienceGrid}>
              <article className={`${styles.audiencePanel} ${styles.buyerPanel}`} aria-labelledby="buyer-title">
                <p className={styles.kicker}>{c.audience.buyer.eyebrow}</p>
                <h3 id="buyer-title" className={styles.panelTitle}>
                  {c.audience.buyer.title}
                </h3>
                <p>{c.audience.buyer.body}</p>
                <ul className={styles.checkList}>
                  {c.audience.buyer.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <Link className={`${styles.button} ${styles.buttonPrimary}`} href={c.audience.buyer.href}>
                  {c.audience.buyer.cta}
                </Link>
              </article>
              <article
                id="supplier"
                className={`${styles.audiencePanel} ${styles.supplierPanel}`}
                aria-labelledby="supplier-title"
              >
                <p className={styles.kickerOnDark}>{c.audience.supplier.eyebrow}</p>
                <h3 id="supplier-title" className={styles.panelTitle}>
                  {c.audience.supplier.title}
                </h3>
                <p>{c.audience.supplier.body}</p>
                <ul className={`${styles.checkList} ${styles.checkListOnDark}`}>
                  {c.audience.supplier.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <Link className={`${styles.button} ${styles.buttonOnDark}`} href={c.audience.supplier.href}>
                  {c.audience.supplier.cta}
                </Link>
              </article>
            </div>
            <p className={styles.sharedNote}>{c.audience.shared}</p>
          </div>
        </section>

        <section id="materiali" className={`${styles.section} ${styles.light}`} aria-labelledby="materials-title">
          <div className={styles.container}>
            <div className={styles.splitHead}>
              <div>
                <p className={styles.kicker}>{c.materials.eyebrow}</p>
                <h2 id="materials-title" className={styles.h2}>
                  {c.materials.title}
                </h2>
              </div>
              <p className={styles.lead}>{c.materials.desc}</p>
            </div>
            <div className={styles.materialList}>
              {c.materials.items.map((material) => (
                <article className={styles.materialRow} key={material.name}>
                  <div className={styles.materialImage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={material.image} alt={material.alt} loading="lazy" />
                  </div>
                  <div className={styles.materialText}>
                    <h3>{material.name}</h3>
                    <p>{material.blurb}</p>
                  </div>
                  <span className={styles.materialTag}>{material.tag}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="marketplace" className={`${styles.section} ${styles.parchment}`} aria-labelledby="marketplace-title">
          <div className={styles.container}>
            <div className={styles.splitHead}>
              <div>
                <p className={styles.kicker}>{c.marketplace.eyebrow}</p>
                <h2 id="marketplace-title" className={styles.h2}>
                  {c.marketplace.title}
                </h2>
              </div>
              <p className={styles.lead}>{c.marketplace.desc}</p>
            </div>
            <MarketplacePreview c={c} />
            <Link className={styles.textLink} href={c.marketplace.href}>
              {c.marketplace.cta}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section id="matching" className={`${styles.section} ${styles.light}`} aria-labelledby="matching-title">
          <div className={styles.container}>
            <div className={styles.matchGrid}>
              <div className={styles.matchCopy}>
                <p className={styles.kicker}>{c.matching.eyebrow}</p>
                <h2 id="matching-title" className={styles.h2}>
                  {c.matching.title}
                </h2>
                <p className={styles.lead}>{c.matching.desc}</p>
                <p className={styles.inlineNote}>{c.matching.note}</p>
                <Link className={styles.textLink} href={c.matching.href}>
                  {c.matching.cta}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
              <MatchingPreview c={c} />
            </div>
          </div>
        </section>

        <section id="logistica" className={`${styles.section} ${styles.darkSection}`} aria-labelledby="logistics-title">
          <div className={styles.container}>
            <div className={styles.splitHeadLight}>
              <div>
                <p className={styles.kickerOnDark}>{c.logistics.eyebrow}</p>
                <h2 id="logistics-title" className={styles.h2OnDark}>
                  {c.logistics.title}
                </h2>
              </div>
              <p className={styles.leadOnDark}>{c.logistics.desc}</p>
            </div>
            <ol className={styles.timeline}>
              {c.logistics.steps.map((step) => (
                <li className={styles.timelineItem} key={step.n}>
                  <span className={styles.timelineNumber}>{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
            <p className={styles.timelineNote}>{c.logistics.note}</p>
          </div>
        </section>

        <section id="impatto" className={`${styles.section} ${styles.light}`} aria-labelledby="impact-title">
          <div className={styles.container}>
            <div className={styles.matchGrid}>
              <div className={styles.matchCopy}>
                <p className={styles.kicker}>{c.impact.eyebrow}</p>
                <h2 id="impact-title" className={styles.h2}>
                  {c.impact.title}
                </h2>
                <p className={styles.lead}>{c.impact.desc}</p>
                <Link className={`${styles.button} ${styles.buttonPrimary}`} href={c.impact.href}>
                  {c.impact.cta}
                </Link>
              </div>
              <ImpactPreview c={c} />
            </div>
          </div>
        </section>

        <section id="piattaforma" className={`${styles.section} ${styles.parchment}`} aria-labelledby="platform-title">
          <div className={styles.container}>
            <div className={styles.splitHead}>
              <div>
                <p className={styles.kicker}>{c.platform.eyebrow}</p>
                <h2 id="platform-title" className={styles.h2}>
                  {c.platform.title}
                </h2>
              </div>
              <p className={styles.lead}>{c.platform.desc}</p>
            </div>
            <PlatformPreview c={c} />
            <Link className={styles.textLink} href={c.platform.href}>
              {c.platform.cta}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section id="azienda" className={`${styles.section} ${styles.light}`} aria-labelledby="company-title">
          <div className={styles.container}>
            <div className={styles.companyGrid}>
              <div className={styles.companyMark}>
                <OffcutLogo href={null} large />
              </div>
              <div>
                <p className={styles.kicker}>{c.company.eyebrow}</p>
                <h2 id="company-title" className={styles.h2}>
                  {c.company.title}
                </h2>
                <p className={styles.lead}>{c.company.desc}</p>
                <p className={styles.inlineNote}>{c.company.secondary}</p>
                <Link className={styles.textLink} href={c.company.href}>
                  {c.company.cta}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className={`${styles.section} ${styles.parchment}`} aria-labelledby="faq-title">
          <div className={styles.container}>
            <div className={styles.faqGrid}>
              <div className={styles.faqIntro}>
                <p className={styles.kicker}>{c.faq.eyebrow}</p>
                <h2 id="faq-title" className={styles.h2}>
                  {c.faq.title}
                </h2>
              </div>
              <div className={styles.faqList}>
                {c.faq.items.map((item) => (
                  <details className={styles.faqItem} key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-title">
          <div className={styles.container}>
            <div className={styles.finalInner}>
              <p className={styles.kickerOnDark}>{c.final.eyebrow}</p>
              <h2 id="final-title" className={styles.h2OnDark}>
                {c.final.title}
              </h2>
              <p className={styles.leadOnDark}>{c.final.desc}</p>
              <div className={styles.actions}>
                <Link className={`${styles.button} ${styles.buttonOnDark}`} href="/app/listings/new">
                  {c.final.sell}
                </Link>
                <Link className={`${styles.button} ${styles.buttonGhostLight}`} href="/app/marketplace">
                  {c.final.buy}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </OffcutShell>

      <footer id="footer" className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <OffcutLogo href={null} large />
              <p>{c.footer.tagline}</p>
            </div>
            <nav className={styles.footerNav} aria-label={c.footer.navLabel}>
              {c.footer.groups.map((group) => (
                <div className={styles.footerGroup} key={group.title}>
                  <p>{group.title}</p>
                  <ul>
                    {group.links.map((link) => (
                      <li key={link.label}>
                        {link.href.startsWith("/") ? (
                          <Link href={link.href}>{link.label}</Link>
                        ) : (
                          <a href={link.href}>{link.label}</a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
          <div className={styles.footerBottom}>
            <span>{c.footer.rights}</span>
            <span>{c.footer.domain}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
