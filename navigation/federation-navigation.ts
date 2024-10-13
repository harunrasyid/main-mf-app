import { loadRemote } from "@module-federation/runtime";

interface RemotePagesMap {
  [path: string]: string;
}

// Utility function to normalize paths by converting `:param` to `[param]`
function normalizeRoutePath(route: string): string {
  return route.replace(/:([^/]+)/g, "[$1]");
}

// Custom function to match paths (similar to Next.js dynamic routing)
function matchPath(
  route: string,
  urlPath: string,
): { params: Record<string, string> } | null {
  const normalizedRoute = normalizeRoutePath(route);
  const routeSegments = normalizedRoute.split("/");
  const pathSegments = urlPath.split("/");

  // Ensure route and path segments are the same length
  if (routeSegments.length !== pathSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  // Iterate over each segment and check for dynamic segments (e.g., [id])
  for (let i = 0; i < routeSegments.length; i++) {
    const routeSegment = routeSegments[i];
    const pathSegment = pathSegments[i];

    if (routeSegment.startsWith("[") && routeSegment.endsWith("]")) {
      // Handle dynamic segments like [id]
      const paramName = routeSegment.slice(1, -1);
      params[paramName] = pathSegment;
    } else if (routeSegment !== pathSegment) {
      // If it's not a dynamic segment and they don't match, return null
      return null;
    }
  }

  return { params }; // Return matched params if all segments match
}

export async function matchFederatedPage(path: string): Promise<{
  remote: (string | undefined)[];
  module: string;
  params: Record<string, string>;
} | null> {
  // Get all remote instances
  const remotes = new Set(
    __FEDERATION__.__INSTANCES__.map((instance) =>
      instance.options.remotes.map((r) => r.alias),
    ),
  );

  // Load pages-map from each remote
  const maps = await Promise.all(
    Array.from(remotes).map(async (remote) => {
      return loadRemote<any>(`${remote}/pages-map`)
        .then((factory) => ({
          remote,
          config: factory.default as RemotePagesMap,
        }))
        .catch((error) => {
          console.error(`Failed to load remote ${remote}:`, error);
          return null;
        });
    }),
  );

  // Iterate over the loaded maps and try to find a matching route
  for (const map of maps) {
    if (!map) continue; // Skip if the map failed to load

    for (const [route, module] of Object.entries(map.config)) {
      // Normalize route to ensure both [id] and :id formats are handled
      const matchResult = matchPath(route, path);
      if (matchResult) {
        return {
          remote: map.remote,
          module,
          params: matchResult.params,
        };
      }
    }
  }

  return null; // No matching route was found
}
