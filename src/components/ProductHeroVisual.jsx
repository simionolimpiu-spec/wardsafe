import { ClinicalPathwayVisual } from './ClinicalPathwayVisual.jsx';
import { InteractiveDashboard } from './InteractiveDashboard.jsx';

export function ProductHeroVisual() {
  return (
    <figure className="product-hero-visual" aria-label="SafeFlow product visual">
      <div className="product-hero-visual__frame">
        <div className="product-hero-visual__top">
          <span>Simulation-first</span>
          <span>No live records</span>
        </div>

        <InteractiveDashboard />
        <ClinicalPathwayVisual compact />

        <div className="product-hero-visual__footer" aria-hidden="true">
          <span>Ward risk</span>
          <span>Handover</span>
          <span>Audit</span>
        </div>
      </div>
    </figure>
  );
}
