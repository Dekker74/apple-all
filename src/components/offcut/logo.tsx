import Link from "next/link";

const MARK = (
  <>
    <path d="M22 3 39 13v18L22 41 5 31V13L22 3Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <path d="M13 25c7-1 12-6 17-13 1 8-2 17-11 20-4 1-7-2-6-7Z" fill="currentColor" />
    <path d="M13 31c4-5 8-9 14-13" fill="none" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" />
  </>
);

export function OffcutLogo({
  large = false,
  href = "/",
}: {
  large?: boolean;
  href?: string | null;
}) {
  const content = (
    <>
      <svg
        className={`brand-mark${large ? " large" : ""}`}
        viewBox="0 0 44 44"
        role="img"
        aria-label="Offcut logo"
      >
        {MARK}
      </svg>
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
