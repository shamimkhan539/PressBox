import {
  // Status icons
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  XCircleIcon,
  // Action icons
  TrashIcon,
  PlayIcon,
  StopIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ArrowPathIcon,
  LockClosedIcon,
  // Tool icons
  CubeIcon,
  ComputerDesktopIcon,
  LightBulbIcon,
  CircleStackIcon,
  ArchiveBoxIcon,
  FolderIcon,
  PuzzlePieceIcon,
  BoltIcon,
  // Database icons
  ServerIcon,
} from '@heroicons/react/24/outline';

/**
 * Icon Components for PressBox
 * 
 * Centralized icon components to replace emoji usage throughout the app.
 * All icons are properly sized and styled.
 */

// Status Icons
export const StatusIcons = {
  Running: ({ className = "w-4 h-4" }: { className?: string }) => (
    <CheckCircleIcon className={`${className} text-green-500`} />
  ),
  Stopped: ({ className = "w-4 h-4" }: { className?: string }) => (
    <XCircleIcon className={`${className} text-gray-500`} />
  ),
  Starting: ({ className = "w-4 h-4" }: { className?: string }) => (
    <ClockIcon className={`${className} text-yellow-500`} />
  ),
  Stopping: ({ className = "w-4 h-4" }: { className?: string }) => (
    <ClockIcon className={`${className} text-yellow-500`} />
  ),
  Error: ({ className = "w-4 h-4" }: { className?: string }) => (
    <ExclamationCircleIcon className={`${className} text-red-500`} />
  ),
};

// Action Icons  
export const ActionIcons = {
  Delete: TrashIcon,
  Start: PlayIcon,
  Stop: StopIcon,
  Export: DocumentArrowDownIcon,
  Import: DocumentArrowUpIcon,
  Refresh: ArrowPathIcon,
  SSL: LockClosedIcon,
};

// Tool Icons
export const ToolIcons = {
  Docker: CubeIcon,
  System: ComputerDesktopIcon,
  Tip: LightBulbIcon,
  Database: CircleStackIcon,
  Archive: ArchiveBoxIcon,
  FileSync: FolderIcon,
  Extensions: PuzzlePieceIcon,
  Server: ServerIcon,
  Memory: CircleStackIcon,
  CPU: BoltIcon,
};

// Status text helpers
export const getStatusText = (status: string) => {
  switch (status) {
    case 'running':
      return 'Running';
    case 'stopped':
      return 'Stopped';
    case 'starting':
      return 'Starting...';
    case 'stopping':
      return 'Stopping...';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
};

// Status component with icon and text
export const StatusDisplay = ({ 
  status, 
  className = "flex items-center space-x-2" 
}: { 
  status: string; 
  className?: string; 
}) => {
  const IconComponent = StatusIcons[status as keyof typeof StatusIcons] || StatusIcons.Stopped;
  
  return (
    <div className={className}>
      <IconComponent />
      <span>{getStatusText(status)}</span>
    </div>
  );
};