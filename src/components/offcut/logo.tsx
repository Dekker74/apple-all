import Link from "next/link";

export function OffcutLogo({
  large = false,
  href = "/",
}: {
  large?: boolean;
  href?: string | null;
}) {
  const content = large ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/images/offcut-logo.svg" alt="Offcut" className="brand-mark logo-full" />
  ) : (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/offcut-mark.svg" alt="" aria-hidden="true" className="brand-mark" />
      <span>Offcut</span>
    </>
  );

  if (href === null) return <span className="brand">{content}</span>;
  return (
    <Link className="brand" href={href} aria-label="Offcut home">
      {content}
    </Link>
  );
}
