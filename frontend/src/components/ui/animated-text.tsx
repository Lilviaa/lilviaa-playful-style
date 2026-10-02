import { useEffect, useRef } from "react";
import gsap from "gsap";

export function AnimatedText({ text, className }: { text: string; className?: string }) {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (textRef.current) {
      gsap.fromTo(textRef.current,
        { y: -4, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }
      );
    }
  }, [text]);

  return (
    <span ref={textRef} className={`inline-block ${className || ""}`}>
      {text}
    </span>
  );
}
