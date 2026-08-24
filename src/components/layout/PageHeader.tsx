interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="px-4 pb-2 pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-on-background">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      ) : null}
    </header>
  );
}
