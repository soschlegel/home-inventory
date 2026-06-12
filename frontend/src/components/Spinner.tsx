export default function Spinner({ fullscreen = false }: { fullscreen?: boolean }) {
  const spinner = (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
  );
  if (fullscreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">{spinner}</div>
    );
  }
  return <div className="flex justify-center py-12">{spinner}</div>;
}
