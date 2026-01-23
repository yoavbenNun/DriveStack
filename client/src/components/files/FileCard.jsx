export default function FileCard({ item }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12, minHeight: 90 }}>
      <div style={{ fontWeight: 700 }}>{item.name}</div>
      <div style={{ opacity: 0.75, marginTop: 6 }}>{item.type}</div>
      {item.size != null && <div style={{ opacity: 0.6, marginTop: 6 }}>{item.size} bytes</div>}
    </div>
  );
}
