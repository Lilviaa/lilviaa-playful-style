import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Hammer } from "lucide-react";

export function MaintenancePage() {
  // Set target date for 2 days from now
  const [targetDate] = useState(() => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).getTime());
  
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

    // Calculate immediately
    calculateTimeLeft();
    
    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-8 rounded-full bg-primary/10 p-4">
        <Hammer className="h-12 w-12 text-primary" />
      </div>
      <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
        We're Under Maintenance
      </h1>
      <p className="mx-auto mb-8 max-w-[600px] text-lg text-muted-foreground sm:text-xl">
        We're currently upgrading our website to bring you an even better shopping experience. 
        We'll be back online shortly. Thank you for your patience!
      </p>

      <div className="mb-12 flex flex-wrap justify-center gap-4 sm:gap-6">
        <TimeBox value={timeLeft.days} label="Days" />
        <TimeBox value={timeLeft.hours} label="Hours" />
        <TimeBox value={timeLeft.minutes} label="Minutes" />
        <TimeBox value={timeLeft.seconds} label="Seconds" />
      </div>

      <div className="mt-8">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
          Admin Login
        </Link>
      </div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10 sm:h-24 sm:w-24">
        <span className="text-3xl font-bold text-primary sm:text-4xl">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  );
}
