/** Static, code-native relief artwork. No images, canvas, filters or animation loop. */
export default function ReliefArt({ className = "" }: { className?: string }) {
  return (
    <div className={"relief-art " + className} aria-hidden="true">
      <div className="relief-orbit orbit-outer">
        <div className="relief-orbit orbit-middle">
          <div className="relief-core">
            <span />
            <span />
          </div>
        </div>
      </div>
      <svg className="relief-waves" viewBox="0 0 520 300" fill="none">
        {[0, 46, 92, 138].map((offset) => (
          <g key={offset} transform={"translate(0 " + offset + ")"}>
            <path
              d="M-80 32C10-55 78 118 158 54S268-42 328 29S433 119 573 6"
              stroke="#bcc9dc"
              strokeWidth="24"
              opacity=".55"
            />
            <path
              d="M-80 27C10-60 78 113 158 49S268-47 328 24S433 114 573 1"
              stroke="#f9fbff"
              strokeWidth="18"
              opacity=".94"
            />
          </g>
        ))}
      </svg>
      <span className="relief-pebble pebble-blue" />
      <span className="relief-pebble pebble-green" />
      <span className="relief-dot-grid" />
    </div>
  );
}
