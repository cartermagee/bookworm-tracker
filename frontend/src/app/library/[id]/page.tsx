type PageProps = { params: Promise<{ id: string }> };

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-2xl font-semibold">Book detail</h1>
      <p className="mt-4 text-sm text-zinc-500">
        Not Implemented — Phase 2 renders book <code>{id}</code> here.
      </p>
    </main>
  );
}
