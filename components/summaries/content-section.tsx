export default function ContentSection({
  title,
  points,
}: {
  title: string;
  points: string[];
}) {
  return (
    <div className="space-y-4">
      {points.map((point, index) => {
        return <p key={`${point}-${index}`}>{point}</p>; // Combine `point` and `index` for a unique key
      })}
    </div>
  );
}