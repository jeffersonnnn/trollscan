"use client";

import clsx from "clsx";

export function Terminal({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("panel p-4", className)}>
      <div className="section-header">{label}</div>
      {children}
    </div>
  );
}
