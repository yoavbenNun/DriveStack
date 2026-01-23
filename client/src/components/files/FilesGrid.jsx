import FileCard from "./FileCard";

export default function FilesGrid({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
      {items.map(it => <FileCard key={it.id} item={it} />)}
    </div>
  );
}
