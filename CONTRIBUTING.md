# Contributing to PressBox

Thank you for your interest in contributing to PressBox! This guide will help you get started with contributing to our local WordPress development environment.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/pressbox.git
    cd pressbox
    ```
3. **Install dependencies**:
    ```bash
    npm install
    ```
4. **Start development server**:
    ```bash
    npm run dev
    ```
5. **Create a feature branch**:
    ```bash
    git checkout -b feature/your-amazing-feature
    ```

## 📋 Development Guidelines

### Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

#### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper typing for all function parameters and returns
- Avoid `any` type - use proper typing or `unknown`

#### React Guidelines

- Use functional components with hooks
- Prefer TypeScript function components over React.FC
- Use proper prop typing with interfaces
- Follow React best practices for state management

#### CSS Guidelines

- Use Tailwind CSS classes for styling
- Create reusable component classes when needed
- Maintain responsive design principles
- Follow dark/light theme patterns

### Project Structure

```
src/
├── main/                 # Electron main process
│   ├── main-quick.js    # Main application entry
│   └── handlers/        # IPC handlers
├── renderer/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── utils/       # Utility functions
│   │   └── types/       # TypeScript types
├── preload/             # Preload scripts
│   └── preload-quick.js # IPC bridge
└── shared/              # Shared types and utilities
```

### Component Guidelines

#### Creating New Components

1. Create component file in appropriate directory
2. Use TypeScript with proper prop interfaces
3. Export component as named export
4. Include JSDoc comments for complex components
5. Follow existing component patterns

Example component structure:

```typescript
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
  isActive?: boolean;
}

/**
 * MyComponent - Brief description
 *
 * Detailed description of component functionality
 */
export function MyComponent({ title, onAction, isActive = false }: MyComponentProps) {
  return (
    <div className="component-styles">
      {/* Component JSX */}
    </div>
  );
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write unit tests for utility functions
- Write integration tests for components
- Test user interactions and workflows
- Mock external dependencies (Docker, file system)

### Test Structure

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render title correctly', () => {
    render(<MyComponent title="Test Title" onAction={jest.fn()} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const mockAction = jest.fn();
    render(<MyComponent title="Test" onAction={mockAction} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});
```

## 🔧 Development Workflow

### Setting Up Development Environment

1. **Prerequisites**:
    - Node.js 18+
    - Docker Desktop (for testing WordPress functionality)
    - Git

2. **IDE Setup**:
    - VS Code with recommended extensions
    - ESLint and Prettier extensions
    - TypeScript support

3. **Environment Variables**:
    ```bash
    # Create .env file for development
    NODE_ENV=development
    DEBUG=true
    ```

### Making Changes

1. **Create feature branch**:

    ```bash
    git checkout -b feature/feature-name
    ```

2. **Make your changes** following the guidelines above

3. **Test your changes**:

    ```bash
    npm run lint
    npm run type-check
    npm test
    npm run dev  # Test in development
    ```

4. **Commit your changes**:
    ```bash
    git add .
    git commit -m "feat: add amazing new feature"
    ```

### Commit Message Guidelines

We follow conventional commits for consistent commit messages:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:

```bash
feat: add WP-CLI terminal integration
fix: resolve modal z-index conflicts
docs: update installation instructions
style: format code with prettier
refactor: extract common utility functions
test: add unit tests for site management
chore: update dependencies
```

## 🐛 Bug Reports

When reporting bugs, please include:

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
Clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**

- OS: [e.g. Windows 11, macOS 14, Ubuntu 22.04]
- PressBox Version: [e.g. 1.0.0]
- Docker Version: [e.g. 24.0.6]
- Node.js Version: [e.g. 18.17.0]

**Additional context**
Add any other context about the problem here.
```

## ✨ Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
Clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request.

**Implementation ideas**
If you have ideas about how to implement this feature, share them here.
```

## 🔍 Pull Request Process

1. **Create pull request** from your feature branch to `main`
2. **Fill out PR template** with description of changes
3. **Ensure all checks pass**:
    - Linting passes
    - Type checking passes
    - Tests pass
    - Build succeeds
4. **Request review** from maintainers
5. **Address feedback** if requested
6. **Merge** when approved

### Pull Request Template

```markdown
## Description

Brief description of changes made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested the changes in development mode

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)

Add screenshots to help explain your changes.

## Additional Notes

Any additional information about the PR.
```

## 🏷️ Issue Labels

We use labels to categorize issues and PRs:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority issue
- `priority: low` - Low priority issue
- `status: blocked` - Blocked by other issues
- `status: in progress` - Currently being worked on

## 🚀 Release Process

1. **Version Bump**: Update version in `package.json`
2. **Changelog**: Update `CHANGELOG.md` with new features and fixes
3. **Testing**: Ensure all tests pass and manual testing is complete
4. **Tag Release**: Create git tag with version number
5. **Build**: Create distribution packages for all platforms
6. **Publish**: Release to GitHub releases and package managers

## 🤝 Code of Conduct

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment of any kind
- Discriminatory language or actions
- Personal attacks or trolling
- Publishing others' private information
- Any other conduct inappropriate for a professional setting

## 📞 Getting Help

- **Documentation**: Check the README and this guide first
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Discord**: Join our community Discord server (if available)

## 🙏 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- GitHub repository insights
- Special recognition for major features or fixes

---

**Thank you for contributing to PressBox!**

_Together, we're building the best local WordPress development environment._
