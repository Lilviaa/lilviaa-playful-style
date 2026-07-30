import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export function CustomSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.v === value) || options[0];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        className="flex w-full items-center justify-between rounded-[1.25rem] bg-card px-4 py-1.5 text-sm font-normal text-cocoa shadow-cute transition-colors hover:text-primary focus:outline-none"
      >
        <span className="truncate">{selected?.l || "Select..."}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] z-50 max-h-60 w-max min-w-full overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-cute [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {options.map((o) => (
            <button
              key={o.v}
              onClick={(e) => {
                e.preventDefault();
                onChange(o.v);
                setIsOpen(false);
              }}
              className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                value === o.v
                  ? "bg-primary text-primary-foreground font-medium"
                  : "font-normal text-cocoa/70 hover:bg-muted hover:text-cocoa"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
