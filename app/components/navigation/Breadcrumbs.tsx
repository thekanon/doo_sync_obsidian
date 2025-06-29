import Link from "next/link";
import { getBreadcrumbs } from "@/app/utils/pathUtils";

interface BreadcrumbsProps {
  pathname: string | null;
}

export default function Breadcrumbs({ pathname }: BreadcrumbsProps) {
  const breadcrumbs = getBreadcrumbs(pathname);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 pb-3 border-b border-gray-300">
      <h3 className="text-sm font-semibold text-gray-600 mb-2">📍 Navigation</h3>
      <div className="space-y-1">
        {breadcrumbs.map((crumb) => (
          <Link
            key={crumb.path}
            href={crumb.path}
            className="block text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
          >
            {crumb.name}
          </Link>
        ))}
      </div>
    </div>
  );
}