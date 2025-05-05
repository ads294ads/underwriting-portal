interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-neutral-800">{title}</h1>
      {description && <p className="text-neutral-600">{description}</p>}
    </div>
  );
}
