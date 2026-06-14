function DealCard({ title, deals }) {
  return (
    <article className="card-shell">
      <h3 className="mb-3 text-xl font-semibold leading-tight">{title}</h3>
      <div className="space-y-2.5">
        {deals.map((deal) => (
          <div key={deal.name} className="rounded-lg border border-slate-200 p-3">
            <strong>{deal.name}</strong>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-md bg-red-600 px-2 py-1 text-xs text-white">-{deal.discount}%</span>
              <span className="text-xs font-bold text-red-600">Limited time deal</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default DealCard;
