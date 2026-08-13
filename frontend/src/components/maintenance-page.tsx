import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Hammer } from "lucide-react";

export function MaintenancePage() {
  // Use localStorage to persist the target date so it doesn't reset on reload
  const [targetDate] = useState(() => {
    const saved = localStorage.getItem("maintenance_target");
    if (saved) return parseInt(saved, 10);
    
    // If no saved date, set it to 2 days from now and save it
    const newTarget = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).getTime();
    localStorage.setItem("maintenance_target", newTarget.toString());
    return newTarget;
  });
  
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
      <div className="mb-8 rounded-full bg-[#fcd34d]/20 p-4">
        <Hammer className="h-12 w-12 text-[#f59e0b]" />
      </div>
      <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground font-display">
        We're Under Maintenance
      </h1>
      
      <div className="mx-auto mb-10 max-w-[650px] space-y-5 text-lg text-muted-foreground sm:text-xl">
        <p>Dear Lilviaa Family, 🤍</p>
        <p>
          Our website is currently under maintenance as we work on some exciting updates to bring you an even better shopping experience.
        </p>
        <p>
          We'll be back online soon with something beautiful for you. ✨
        </p>
        <p>
          Thank you for your patience, love, and continued support.<br />
          We can't wait to welcome you back!
        </p>
      </div>

      <div className="mb-12 flex flex-wrap justify-center gap-4 sm:gap-6">
        <TimeBox value={timeLeft.days} label="Days" />
        <TimeBox value={timeLeft.hours} label="Hours" />
        <TimeBox value={timeLeft.minutes} label="Minutes" />
        <TimeBox value={timeLeft.seconds} label="Seconds" />
      </div>

      <div className="mx-auto mb-12 max-w-[500px] rounded-2xl bg-white p-6 shadow-sm border border-border/50">
        <h3 className="mb-2 font-display text-xl font-semibold text-foreground">Need to place an order in the meantime?</h3>
        <p className="mb-4 text-muted-foreground">
          📩 DM us on Instagram and our team will be happy to assist you with your order.
        </p>
        <p className="font-medium text-foreground">
          With love,<br />
          Team Lilviaa 🤍
        </p>
      </div>

      <div className="mt-4">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
          Admin Login
        </Link>
      </div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#fcd34d]/20 sm:h-24 sm:w-24 border border-[#fcd34d]/30">
        <span className="text-3xl font-bold text-[#d97706] sm:text-4xl">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="mt-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  );
}
