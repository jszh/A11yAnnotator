const { html, PageShell, RightRail, NotificationTabs } = window.Folia;

function NotificationsPage() {
  const rail = html`
    <${RightRail} title="Unread Summary">
      <div className="rounded-[1.5rem] bg-white/90 p-4">
        <p className="text-sm text-slate-600">Activity: 3 new</p>
        <p className="mt-2 text-sm text-slate-600">Feedback Requests: 2 pending</p>
        <p className="mt-2 text-sm text-slate-600">Collections: 2 saves</p>
      </div>
    <//>
  `;

  return html`
    <${PageShell}
      currentPath="./notifications.html"
      kicker="Platform updates"
      title="Notifications"
      description="Track appreciations, feedback requests, and collection activity tied to your work."
      rightRail=${rail}
    >
      <${NotificationTabs} />
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${NotificationsPage} />`);
