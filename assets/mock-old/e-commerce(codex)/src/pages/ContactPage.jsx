function ContactPage() {
  return (
    <section className="py-6">
      <article className="card-shell">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="mt-2 text-slate-700">Need help with an order, return, or account question? Send us a message.</p>

        <form className="mt-4 rounded-xl border border-slate-200 p-4">
          <label htmlFor="name" className="text-sm font-semibold">
            Name
          </label>
          <input id="name" type="text" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Your name" />

          <label htmlFor="email" className="mt-4 block text-sm font-semibold">
            Email
          </label>
          <input id="email" type="email" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="name@email.com" />

          <label htmlFor="message" className="mt-4 block text-sm font-semibold">
            Message
          </label>
          <textarea
            id="message"
            rows="5"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="How can we help?"
          />

          <button type="submit" className="mt-4 rounded-full bg-accent px-5 py-2 font-bold text-slate-900 hover:bg-amber-500">
            Submit
          </button>
        </form>
      </article>
    </section>
  );
}

export default ContactPage;
