export default function NoAccessPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-2 bg-neutral-950 text-neutral-100">
      <h1 className="text-2xl font-medium">No access</h1>
      <p className="text-sm text-neutral-500">
        You don&apos;t have permission to view this page.
      </p>
    </div>
  );
}