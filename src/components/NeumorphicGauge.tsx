export default function NeumorphicGauge({
  score,
  gradeTier,
  size = "md",
}: {
  score: number;
  gradeTier?: string;
  size?: "sm" | "md" | "lg";
}) {
  const value = Number.isFinite(score)
    ? Math.min(100, Math.max(0, Math.round(score)))
    : 0;
  const dimension = size === "lg" ? 112 : size === "sm" ? 64 : 80;
  return (
    <div
      className="nm-flat-sm relative shrink-0 rounded-full grid place-items-center"
      style={{ width: dimension, height: dimension }}
      role="img"
      aria-label={
        value +
        " out of 100 match score" +
        (gradeTier ? ", grade " + gradeTier : "")
      }
    >
      <svg
        width={dimension - 10}
        height={dimension - 10}
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="-rotate-90"
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#d7e0ed"
          strokeWidth="7"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={value >= 70 ? "#10b981" : value >= 50 ? "#a67c25" : "#be4563"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="251.33"
          strokeDashoffset={251.33 * (1 - value / 100)}
        />
      </svg>
      <span
        className="absolute font-bold text-slate-900"
        style={{ fontSize: size === "lg" ? 26 : 18 }}
      >
        {value}
        <span className="text-[10px] muted">/100</span>
      </span>
    </div>
  );
}
