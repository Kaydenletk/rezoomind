export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50 animate-pulse">
      <div className="flex items-center justify-between px-7 py-3.5 border-b border-stone-200">
        <div className="flex items-center gap-5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
          </div>
          <div className="w-24 h-4 bg-stone-200 rounded" />
        </div>
        <div className="w-20 h-7 bg-stone-200 rounded" />
      </div>
      <div className="py-6 space-y-4">
        <div className="grid grid-cols-2 gap-3.5 px-7">
          <div className="h-28 bg-stone-200 rounded-[10px]" />
          <div className="h-28 bg-stone-200 rounded-[10px]" />
        </div>
        <div className="mx-7 h-64 bg-stone-200 rounded-[10px]" />
        <div className="grid grid-cols-[3fr_1.2fr_1fr] gap-3.5 px-7">
          <div className="h-56 bg-stone-200 rounded-[10px]" />
          <div className="h-56 bg-stone-200 rounded-[10px]" />
          <div className="h-56 bg-stone-200 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}
