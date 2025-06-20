/**
 * Panel Components Barrel Export
 *
 * Used in: frontend/components/ChatSidebarPanel.tsx and other components needing panel functionality
 * Purpose: Centralized export point for panel-related components and hooks.
 * Provides clean imports for headers, footers, thread management, and list items.
 */

// Panel components barrel export - now consolidated
export { PanelHeader, PanelFooter, default as ThreadListItem } from './PanelComponents';
export { DeleteThreadDialog } from './DeleteThreadDialog';
export { ThreadSearch } from './ThreadSearch';
export { ThreadMenuDropdown } from './ThreadMenuDropdown';
export { ThreadRenameDialog } from './ThreadRenameDialog';
export { ThreadTagsDialog } from './ThreadTagsDialog';
export { useThreadManager } from './ThreadManager';
export type { ThreadData, ThreadOperations } from './ThreadManager';
