export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="h-8 w-48 rounded-lg bg-surface border border-border/30 shimmer-bg mb-10" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map((i) => (
          <div key={i} className="rounded-xl bg-surface border border-border/30 p-6 h-28 shimmer-bg" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {[1,2,3].map((i) => (
          <div key={i} className="rounded-xl bg-surface border border-border/30 p-8 h-24 shimmer-bg" />
        ))}
      </div>
    </div>
  );
}
