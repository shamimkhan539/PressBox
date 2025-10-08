# 🏗️ PressBox Architecture Reference

## 📂 Project Structure Overview

```
PressBox/
├── src/
│   ├── main/                    # Electron main process
│   ├── preload/                 # Preload scripts & IPC
│   └── renderer/                # React frontend
│       └── src/
│           ├── components/      # UI components
│           ├── data/           # Static data & configurations
│           ├── hooks/          # Custom React hooks
│           ├── pages/          # Application pages
│           └── shared/         # Shared utilities & types
├── scripts/                     # Build & utility scripts
├── assets/                      # Static assets
└── docs/                       # Documentation
```

## 🎯 Key Components Added

### Template System

- **siteTemplates.ts**: 8 predefined WordPress configurations
- **SiteTemplateSelector.tsx**: Template selection interface
- **Enhanced CreateSiteModal.tsx**: Multi-step wizard integration

### File Management

- **FileManager.tsx**: Advanced file browser with tree view
- **FileEditor.tsx**: In-app code editor with syntax highlighting
- WordPress-specific file handling and recognition

### WP-CLI Enhancement

- **WPCLITerminal.tsx**: Interactive terminal with autocomplete
- Command history, favorites, and help system
- Real-time output formatting and error handling

### Error Management

- **ErrorHandler.tsx**: Centralized error management system
- **ErrorBoundary.tsx**: React component error catching
- **AsyncWrapper.tsx**: Loading and error state management
- **NotificationSystem.tsx**: Enhanced user notifications

### Health Monitoring

- **SiteHealthDashboard.tsx**: Comprehensive site monitoring
- Performance metrics with Lighthouse integration
- WordPress-specific health checks and auto-fix capabilities

## 🔄 Data Flow

### Site Creation Flow

```
User Input → Template Selection → Configuration → IPC → Docker → WordPress Setup
```

### File Management Flow

```
File Browser → File Selection → Editor → Save → IPC → File System → WordPress
```

### Health Monitoring Flow

```
Site Selection → Health Checks → Metrics Collection → Dashboard Display → Auto-fix Actions
```

## 🔧 Integration Points

### IPC Communication

- Enhanced preload script with new API endpoints
- Secure communication between renderer and main process
- Type-safe interfaces for all operations

### Docker Integration

- Template-based WordPress configurations
- Dynamic port management and cleanup
- Container health monitoring

### WordPress Integration

- WP-CLI command execution and management
- File system access and modification
- Health check APIs and performance monitoring

## 📦 Dependencies Added

### Runtime Dependencies

- Various UI and utility libraries for enhanced functionality

### Development Dependencies

- TypeScript definitions for new components
- Enhanced build tools and configurations

## 🚀 Performance Optimizations

### Code Splitting

- Lazy loading for heavy components
- Modular architecture for tree shaking

### State Management

- Efficient React state handling
- Memoization for performance-critical components

### Build Optimization

- Vite configuration for fast development
- Production build optimization

## 🔒 Security Considerations

### File Access

- Sandboxed file operations through IPC
- Path validation and security checks

### Command Execution

- Secured WP-CLI command execution
- Input validation and sanitization

### Error Handling

- Secure error reporting without sensitive data exposure
- Graceful degradation for security failures

---

_This reference provides technical context for developers working on or extending PressBox._
