export default function ForumLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="h-8 w-48 rounded-lg bg-surface border border-border/30 shimmer-bg mb-2" />
      <div className="h-5 w-40 rounded-lg bg-surface border border-border/30 shimmer-bg mb-8" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="rounded-xl bg-surface border border-border/30 p-6 h-40 shimmer-bg" />
        ))}
      </div>
    </div>
  );
}
