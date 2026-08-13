export default function ArchitectureDiagram({ items }) {
  if (!items?.length) return null;

  return (
    <div className="architecture-flow" aria-label="Project architecture">
      {items.map((item, index) => (
        <div className="architecture-node-wrap" key={item}>
          <span className="architecture-node">{item}</span>
          {index < items.length - 1 && <span className="architecture-arrow" aria-hidden="true">↕</span>}
        </div>
      ))}
    </div>
  );
}
