interface StampBadgeProps {
  active: boolean;
  label?: string;
}

/**
 * عنصر امضادار طراحی: مهر دایره‌ای الهام‌گرفته از مهر تایید در دفاتر رسمی/بازار.
 * وقتی بات فعال است، مهر «تأیید» رنگی و کامل نمایش داده می‌شود؛
 * وقتی غیرفعال است، فقط طرح‌کلی خاکستری آن دیده می‌شود.
 */
export function StampBadge({ active, label }: StampBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`relative flex h-9 w-9 items-center justify-center rounded-stamp border-2 font-display text-[10px] font-bold ${
          active ? 'border-seal text-seal rotate-[-8deg]' : 'border-line text-line rotate-0'
        }`}
        style={{ letterSpacing: '0.5px' }}
      >
        <span className="absolute inset-[3px] rounded-stamp border border-dotted border-current opacity-60" />
        {active ? 'فعال' : 'خاموش'}
      </div>
      {label && <span className="text-sm text-ink/70">{label}</span>}
    </div>
  );
}
