export function GoogleCalendarReconnectLink({
  label =
    "Reconectar Google",
}: {
  label?:
    string;
}) {
  return (
    <a
      href="/api/google-calendar/connect"
      className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-muted"
    >
      {label}
    </a>
  );
}
