import FileCard from "./FileCard";

export default function FilesGrid({ items, onOpen, onDelete }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
      {items.map((it) => (
        <FileCard
          key={it.id}
          item={it}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
