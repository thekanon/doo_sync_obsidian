export function getCurrentLocationInfo(pathname: string | null) {
  if (!pathname) return { type: "directory", name: "Root", parentPath: "" };

  const currentPath = decodeURIComponent(
    pathname.startsWith("/") ? pathname.slice(1) : pathname
  );

  if (!currentPath || currentPath === "_Index_of_Root.md") {
    return { type: "directory", name: "Root", parentPath: "" };
  }

  // Extract information from path
  const pathParts = currentPath.split("/");
  const lastPart = pathParts[pathParts.length - 1];

  // Determine if it's a directory index or file
  const isDirectoryIndex = lastPart.includes("_Index_of_");
  const type = isDirectoryIndex ? "directory" : "file";

  // Clean up the name
  const cleanName = lastPart
    .replace(/_Index_of_/g, "")
    .replace(/\.md$/, "")
    .replace(/%20/g, " ");

  // Get parent directory path for breadcrumb
  const parentPath =
    pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "";

  return {
    type,
    name: cleanName || "Current Item",
    parentPath,
    fullPath: currentPath,
  };
}

export function getBreadcrumbs(pathname: string | null) {
  if (!pathname) return [];
  
  const currentPath = decodeURIComponent(pathname.startsWith('/') ? pathname.slice(1) : pathname);
  
  // If we're at root, return empty breadcrumbs
  if (!currentPath || currentPath === '_Index_of_Root.md') {
    return [];
  }
  
  const breadcrumbs = [];
  
  // Always add root link
  breadcrumbs.push({
    name: "🏠 Root",
    path: "/_Index_of_Root.md"
  });
  
  // Parse the current path to build breadcrumbs
  const pathParts = currentPath.split('/');
  
  // If current path is a file, remove the filename to get parent directories
  if (currentPath.endsWith('.md') && !currentPath.includes('_Index_of_')) {
    pathParts.pop();
  }
  
  // Build cumulative paths for each directory level
  let cumulativePath = '';
  pathParts.forEach((part, index) => {
    if (part.includes('_Index_of_')) return; // Skip index files in breadcrumbs
    
    cumulativePath = index === 0 ? part : `${cumulativePath}/${part}`;
    
    breadcrumbs.push({
      name: `📁 ${decodeURIComponent(part)}`,
      path: `/${cumulativePath}/_Index_of_${part}.md`
    });
  });
  
  return breadcrumbs;
}