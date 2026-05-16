function Loader() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />

      <p className="mt-4 text-sm font-bold text-slate-500">Loading...</p>
    </div>
  );
}

export default Loader;
