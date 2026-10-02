import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface AnimatedNumberProps {
  value: number;
  formatValue?: (val: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, formatValue = (v) => v.toString(), className }: AnimatedNumberProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const valueObj = useRef({ val: value });

  useEffect(() => {
    // If the value changed from the initial render
    if (valueObj.current.val !== value) {
      gsap.to(valueObj.current, {
        val: value,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: () => {
          setDisplayValue(Math.round(valueObj.current.val));
        }
      });

      if (containerRef.current) {
        gsap.fromTo(containerRef.current, 
          { scale: 0.94, opacity: 0.6 },
          { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
        );
      }
    }
  }, [value]);

  return (
    <span ref={containerRef} className={`inline-block origin-left ${className || ""}`}>
      {formatValue(displayValue)}
    </span>
  );
}
