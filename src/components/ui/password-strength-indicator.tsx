import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
}

const calculateStrength = (password: string): StrengthResult => {
  if (!password) {
    return { score: 0, label: "", color: "" };
  }

  let score = 0;
  
  // Length checks
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Normalize to 0-4 scale
  const normalizedScore = Math.min(4, Math.floor(score / 1.75));

  const strengthLevels: Record<number, { label: string; color: string }> = {
    0: { label: "Rất yếu", color: "bg-red-500" },
    1: { label: "Yếu", color: "bg-orange-500" },
    2: { label: "Trung bình", color: "bg-yellow-500" },
    3: { label: "Mạnh", color: "bg-green-500" },
    4: { label: "Rất mạnh", color: "bg-emerald-600" },
  };

  return {
    score: normalizedScore,
    ...strengthLevels[normalizedScore],
  };
};

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              index <= strength.score - 1
                ? strength.color
                : "bg-muted"
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-xs font-medium transition-colors",
          strength.score <= 1 && "text-red-500",
          strength.score === 2 && "text-yellow-600",
          strength.score >= 3 && "text-green-600"
        )}
      >
        {strength.label}
      </p>
    </div>
  );
}
