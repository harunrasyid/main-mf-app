import React, { useState, useEffect } from "react";
import { NextPageContext } from "next";
import { loadRemote } from "@module-federation/runtime";
import { matchFederatedPage } from "@/navigation";

interface FederatedCatchAllProps {
  FederatedPage?: React.ComponentType;
  render404?: boolean;
  renderError?: boolean;
  needsReload?: boolean;
}

function removeFirstDot(path: string): string {
  if (path.startsWith("./")) {
    return path.slice(1); // Remove the first dot by slicing the string
  }
  return path;
}

const FederatedCatchAll = (initialProps: FederatedCatchAllProps) => {
  const [lazyProps, setProps] = useState<FederatedCatchAllProps>({});
  const { FederatedPage, render404, renderError, needsReload, ...props } = {
    ...lazyProps,
    ...initialProps,
  };

  useEffect(() => {
    if (needsReload) {
      const runUnderlyingGIP = async () => {
        const federatedProps = await FederatedCatchAll.getInitialProps!(
          props as NextPageContext,
        );
        setProps(federatedProps);
      };
      runUnderlyingGIP();
    }
  }, [needsReload, props]);

  if (render404) {
    return <h1>404 Not Found</h1>;
  }

  if (renderError) {
    return <h1>Oops, something went wrong.</h1>;
  }

  if (FederatedPage) {
    return <FederatedPage {...props} />;
  }

  return null;
};

FederatedCatchAll.getInitialProps = async (ctx: NextPageContext) => {
  const { err, req, asPath } = ctx;

  if (err) {
    return { renderError: true };
  }

  const path = asPath || req?.url || "";

  if (!path) {
    return { render404: true };
  }

  // Match the federated page
  const matchedPage = await matchFederatedPage(path);

  if (!matchedPage) {
    return { render404: true };
  }

  const { remote, module, params } = matchedPage;

  if (!remote || !module) {
    return { render404: true };
  }

  // Load the federated page component
  const FederatedPage = await loadRemote<any>(
    `${remote}${removeFirstDot(module)}`,
  ).then((factory) => factory?.default);

  if (!FederatedPage) {
    return { render404: true };
  }

  // Ensure params are passed to query
  const modifiedContext = {
    ...ctx,
    query: {
      ...ctx.query,
      ...params, // Add the matched dynamic params to the query
    },
  };

  // Get federated page props, with modified context (including dynamic params)
  const federatedPageProps =
    (await FederatedPage.getInitialProps?.(modifiedContext)) || {};

  // Return the federated page and its props
  return { ...federatedPageProps, FederatedPage };
};

export default FederatedCatchAll;
