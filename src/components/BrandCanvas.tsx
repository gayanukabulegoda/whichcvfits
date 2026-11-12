import ReliefArt from "./ReliefArt";
export default function BrandCanvas() {
  return (
    <div className="brand-canvas" aria-hidden="true">
      <div className="canvas-glow" />
      <ReliefArt className="canvas-relief" variant="rings" />
    </div>
  );
}
