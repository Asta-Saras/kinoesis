import { useEffect } from 'react';
import type { WorkspaceType } from '../config/workspaces';

/** Applies the workspace accent palette (see index.css) to the whole document. */
export function useWorkspaceTheme(workspace: WorkspaceType | null | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    if (workspace) root.dataset.workspace = workspace;
    return () => {
      delete root.dataset.workspace;
    };
  }, [workspace]);
}
