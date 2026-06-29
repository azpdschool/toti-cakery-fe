interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({
  title,
  description = 'Belum diimplementasi',
}: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="text-4xl">🎂</span>
      <h1 className="text-xl font-semibold text-gray-700">{title}</h1>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  )
}
