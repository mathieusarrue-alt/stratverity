import type { JSX } from "react";
import styles from "./ProductMark.module.css";

export type ProductMarkName = "audit" | "marketplace" | "optimizer";
export type ProductMarkSize = "sm" | "md" | "lg";

type ProductMarkProps = {
  className?: string;
  label?: string;
  product: ProductMarkName;
  size?: ProductMarkSize;
};

function AuditMark() {
  return (
    <>
      <circle cx="60" cy="53" r="39" opacity=".34" strokeDasharray="3 7" />
      <circle cx="60" cy="53" r="31" opacity=".72" />
      <path d="m45 53 10 10 21-22" strokeWidth="4" />
      <path d="m44 81-4 23 20-10 20 10-4-23" opacity=".72" />
      <path d="M60 14V8M20 53h-6M106 53h-6" opacity=".52" />
    </>
  );
}

function MarketplaceMark() {
  return (
    <>
      <path d="M39 38 51 52M81 38 69 52M60 83V72" opacity=".48" />
      <rect x="12" y="15" width="33" height="27" rx="6" />
      <rect x="75" y="15" width="33" height="27" rx="6" />
      <rect x="43.5" y="82" width="33" height="27" rx="6" />
      <circle cx="60" cy="61" r="13" opacity=".82" />
      <path d="m54 61 4 4 8-9" strokeWidth="3.5" />
      <path d="M21 25h15M84 25h15M52 92h16" opacity=".64" />
      <path d="M21 32h9M84 32h9M52 99h9" opacity=".32" />
    </>
  );
}

function OptimizerMark() {
  return (
    <>
      <path d="M20 31h80M20 60h80M20 89h80" opacity=".42" />
      <path d="m38 31 40 29-26 29" opacity=".55" />
      <circle cx="38" cy="31" r="8" />
      <circle cx="78" cy="60" r="10" />
      <circle cx="78" cy="60" r="16" opacity=".34" strokeDasharray="3 6" />
      <circle cx="52" cy="89" r="8" />
      <path d="M38 27v8M78 55v10M52 85v8" strokeWidth="3.5" />
    </>
  );
}

const MARKS: Record<ProductMarkName, () => JSX.Element> = {
  audit: AuditMark,
  marketplace: MarketplaceMark,
  optimizer: OptimizerMark,
};

export default function ProductMark({
  className = "",
  label,
  product,
  size = "md",
}: ProductMarkProps) {
  const Mark = MARKS[product];

  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={`${styles.root} ${styles[size]} ${className}`.trim()}
      data-product-mark={product}
      fill="none"
      focusable="false"
      role={label ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Mark />
    </svg>
  );
}
