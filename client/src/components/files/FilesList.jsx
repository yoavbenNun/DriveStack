export default function FilesList({ items }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: 10, opacity: 0.75 }}>
        <div>Name</div><div>Type</div><div>Size</div>
      </div>

      {items.map(it => (
        <div key={it.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: 10,
          borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div>{it.name}</div>
          <div>{it.type}</div>
          <div>{it.size ?? "-"}</div>
        </div>
      ))}
    </div>
  );
}
