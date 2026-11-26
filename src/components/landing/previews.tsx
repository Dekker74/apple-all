import type { LandingCopy } from "./copy";
import styles from "./landing.module.css";

export function MarketplacePreview({ c }: { c: LandingCopy }) {
  return (
    <div className={styles.preview} role="group" aria-label={c.marketplace.previewLabel}>
      <div className={styles.previewBar}>
        <span>{c.marketplace.previewTitle}</span>
        <span className={styles.previewTag}>IT / EN</span>
      </div>
      <div className={styles.marketGrid}>
        <div className={styles.filterPane}>
          <p className={styles.paneLabel}>{c.marketplace.filtersLabel}</p>
          <ul className={styles.filterList}>
            {c.marketplace.filters.map((filter) => (
              <li key={filter}>{filter}</li>
            ))}
          </ul>
        </div>
        <div className={styles.resultsPane}>
          <div className={styles.resultsHead}>
            <span>{c.marketplace.resultsLabel}</span>
          </div>
          <ul className={styles.resultList}>
            {c.marketplace.rows.map((row) => (
              <li className={styles.resultRow} key={row.title}>
                <div className={styles.resultMain}>
                  <strong>{row.title}</strong>
                  <span>{row.sub}</span>
                </div>
                <div className={styles.resultDetails}>
                  <span>{row.zone}</span>
                  <span>{row.availability}</span>
                </div>
                <span className={styles.priceTag}>{c.onRequest}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className={styles.previewNote}>{c.marketplace.note}</p>
    </div>
  );
}

export function MatchingPreview({ c }: { c: LandingCopy }) {
  return (
    <div className={styles.matchPanel} role="group" aria-label={c.matching.reasonsTitle}>
      <div className={styles.matchFlow}>
        <div className={styles.matchNode}>
          <span className={styles.paneLabel}>{c.matching.requestLabel}</span>
          <strong>{c.matching.requestValue}</strong>
        </div>
        <div className={styles.matchConnector} aria-hidden="true" />
        <div className={styles.matchNode}>
          <span className={styles.paneLabel}>{c.matching.supplyLabel}</span>
          <strong>{c.matching.supplyValue}</strong>
        </div>
      </div>
      <div className={styles.reasonBlock}>
        <p className={styles.paneLabel}>{c.matching.reasonsTitle}</p>
        <ul className={styles.reasonList}>
          {c.matching.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ImpactPreview({ c }: { c: LandingCopy }) {
  return (
    <div className={styles.impactPanel} role="group" aria-label={c.impact.previewLabel}>
      <div className={styles.impactLoop}>
        <p className={styles.paneLabel}>{c.impact.loopTitle}</p>
        <ol className={styles.loopList}>
          {c.impact.loop.map((step, index) => (
            <li key={step}>
              <span className={styles.loopIndex}>{String(index + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className={styles.impactCalc}>
        <div className={styles.fieldRow}>
          <span>{c.impact.fieldMaterial}</span>
          <strong>{c.impact.placeholderMaterial}</strong>
        </div>
        <div className={styles.fieldRow}>
          <span>{c.impact.fieldQuantity}</span>
          <strong>{c.impact.placeholderQuantity}</strong>
        </div>
        <div className={`${styles.fieldRow} ${styles.fieldRowResult}`}>
          <span>{c.impact.fieldResult}</span>
          <strong>{c.impact.placeholderResult}</strong>
        </div>
        <p className={styles.impactSource}>{c.impact.sources}</p>
      </div>
    </div>
  );
}

export function PlatformPreview({ c }: { c: LandingCopy }) {
  return (
    <div className={styles.platformPanel} role="group" aria-label={c.platform.previewLabel}>
      <div className={styles.platformSidebar}>
        <p className={styles.paneLabel}>{c.platform.sidebarLabel}</p>
        <ul className={styles.platformNav}>
          {c.platform.items.map((item, index) => (
            <li className={index === 0 ? styles.platformNavActive : undefined} key={item.label}>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.platformContent}>
        <div className={styles.platformEmptyGrid}>
          <div className={styles.platformEmptyCard}>
            <span>{c.platform.items[1].label}</span>
            <strong>{c.platform.emptyMatch}</strong>
          </div>
          <div className={styles.platformEmptyCard}>
            <span>{c.platform.items[2].label}</span>
            <strong>{c.platform.emptyOrders}</strong>
          </div>
          <div className={styles.platformEmptyCard}>
            <span>{c.platform.items[3].label}</span>
            <strong>{c.platform.emptyInbox}</strong>
          </div>
        </div>
        <p className={styles.previewNote}>{c.platform.note}</p>
      </div>
    </div>
  );
}
