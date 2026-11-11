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
  const circumference = 2 * Math.PI * 43;
  return (
    <div
      className="score-gauge nm-flat-sm relative shrink-0 rounded-full grid place-items-center"
      style={{ width: dimension, height: dimension }}
      data-size={size}
      role="img"
      aria-label={
        value +
        " out of 100 match score" +
        (gradeTier ? ", grade " + gradeTier : "")
      }
    >
      <svg
        width={dimension - 4}
        height={dimension - 4}
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="-rotate-90"
      >
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="#d7e0ed"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke={
            value >= 85
              ? "#10b981"
              : value >= 70
                ? "#3457b1"
                : value >= 50
                  ? "#a67c25"
                  : "#be4563"
          }
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <span className="score-gauge-label" aria-hidden="true">
        <span className="score-gauge-value">{value}</span>
        <span className="score-gauge-total">/100</span>
      </span>
    </div>
  );
}
