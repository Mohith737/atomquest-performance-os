export default function ProgressBar({ value, showLabel = false }) {
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div className="w-full">
      {showLabel ? (
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span>{safeValue}%</span>
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all duration-1000 ease-out"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}
