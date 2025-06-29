export default function DirectoryLoader() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="block p-2 bg-gray-50 rounded-lg animate-pulse"
        >
          <div className="h-4 bg-gray-300 rounded mb-1"></div>
          <div className="h-3 bg-gray-300 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}