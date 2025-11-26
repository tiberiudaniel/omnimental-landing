"use client";

type GuideCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export default function GuideCard({
  title,
  children,
  className = "",
  onClick,
}: GuideCardProps) {
  const interactive = typeof onClick === 'function';
  return (
    <div
      className={`rounded-[12px] border border-[#D8C6B6] bg-white p-5 shadow-sm ${interactive ? 'cursor-pointer transition hover:shadow-[0_14px_34px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]' : ''} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {title ? <h3 className="text-base font-semibold text-[#1F1F1F]">{title}</h3> : null}
      <div className={`${title ? 'mt-3' : ''} text-sm text-[#2C2C2C]`}>{children}</div>
    </div>
  );
}
