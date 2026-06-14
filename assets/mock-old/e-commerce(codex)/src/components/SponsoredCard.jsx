function SponsoredCard({ title, productName, price }) {
  return (
    <article className="card-shell">
      <h3 className="mb-3 text-xl font-semibold leading-tight">{title}</h3>
      <div className="mb-3 rounded-lg border border-slate-200 p-3">
        <strong>Home Office Bundle</strong>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-md bg-red-600 px-2 py-1 text-xs text-white">-18%</span>
          <span className="text-xs font-bold text-red-600">Limited time deal</span>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 p-3">
        <small>Sponsored</small>
        <p className="my-2 font-semibold">{productName}</p>
        <div className="text-2xl font-extrabold">{price}</div>
        <span className="my-2 inline-block rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-900">Prime</span>
        <div>
          <button type="button" className="rounded-full bg-accent px-4 py-2 font-bold text-slate-900 hover:bg-amber-500">
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}

export default SponsoredCard;
