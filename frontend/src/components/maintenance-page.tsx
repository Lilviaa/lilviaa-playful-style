import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Hammer } from "lucide-react";

export function MaintenancePage() {
  // Use a fixed, global target date so all users and devices see the exact same countdown.
  const [targetDate] = useState(() => new Date("2026-08-15T17:00:00+05:30").getTime());
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-6 text-center overflow-hidden">
      <div className="mb-4 sm:mb-6 rounded-full bg-[#fcd34d]/20 p-3 sm:p-4">
        <Hammer className="h-8 w-8 sm:h-10 sm:w-10 text-[#f59e0b]" />
      </div>
      
      <h1 className="mb-4 sm:mb-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-foreground font-display">
        We're Under Maintenance
      </h1>
      
      <div className="mx-auto mb-6 sm:mb-8 max-w-[700px] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
        Dear Lilviaa Family, Our website is currently under maintenance as we work on some exciting updates to bring you an even better shopping experience. We'll be back online soon with something beautiful for you. Thank you for your patience, love, and continued support. We can't wait to welcome you back!
      </div>

      <div className="mb-8 flex flex-nowrap justify-center gap-2 sm:gap-4 w-full max-w-sm sm:max-w-none px-2">
        <TimeBox value={timeLeft.days} label="Days" />
        <TimeBox value={timeLeft.hours} label="Hours" />
        <TimeBox value={timeLeft.minutes} label="Mins" />
        <TimeBox value={timeLeft.seconds} label="Secs" />
      </div>

      <div className="mt-4 sm:mt-6">
        <Link to="/login" className="text-[11px] sm:text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
          Admin Login
        </Link>
      </div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center flex-1 sm:flex-none">
      <div className="flex h-14 w-full sm:h-20 sm:w-20 items-center justify-center rounded-xl bg-[#fcd34d]/20 border border-[#fcd34d]/30">
        <span className="text-2xl sm:text-3xl font-bold text-[#d97706]">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  );
}
