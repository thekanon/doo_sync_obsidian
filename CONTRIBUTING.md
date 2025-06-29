# Contributing to doo_sync_obsidian

Thank you for your interest in contributing to doo_sync_obsidian! This document provides guidelines for contributing to this Obsidian-to-Next.js wiki service.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Firebase account (for authentication features)
- Basic knowledge of Next.js, TypeScript, and Tailwind CSS

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/DooSyncBrain.git
   cd DooSyncBrain/doo_sync_obsidian
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env_sample` to `.env`
   - Fill in required environment variables:
     - `SERVER_DOMAIN`: Your development domain
     - `REPO_PATH`: Path to your Obsidian vault
     - `OBSIDIAN_URL`: Identifier for your vault
     - Firebase configuration variables
     - `GITHUB_WEBHOOK_SECRET`: For webhook security
     - `SITE_NAME`, `SITE_URL`, `SITE_AUTHOR`: Site metadata

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:33000`

## 📝 Coding Standards

### TypeScript
- Use strict TypeScript configuration
- Define proper types for all props and function parameters
- Avoid `any` types - use specific types or `unknown` when necessary
- Use interfaces for object shapes and types for unions

### Code Style
- **Formatting**: Use Prettier for consistent formatting
- **Linting**: Follow ESLint rules configured in the project
- **File Naming**: 
  - Components: PascalCase (e.g., `UserStatus.tsx`)
  - Utilities: camelCase (e.g., `authUtils.ts`)
  - Pages: kebab-case for dynamic routes (e.g., `[...slug]`)

### React/Next.js Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Optimize performance with `React.memo` when appropriate
- Use Next.js App Router conventions
- Implement proper loading states and error handling

### CSS/Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and typography scales
- Use semantic HTML elements

## 🏗️ Project Structure

```
doo_sync_obsidian/
├── app/                 # Next.js App Router
│   ├── [...slug]/      # Dynamic route handling
│   ├── api/            # API routes
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility libraries
│   └── types/          # TypeScript type definitions
├── services/           # Server-side services
├── public/             # Static assets
└── tests/              # Test files
```

## 🔄 Pull Request Process

### Before Submitting

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Test Your Changes**
   ```bash
   npm run build
   npm run test  # if tests exist
   ```

3. **Code Quality Checks**
   - Run linting: `npm run lint`
   - Check TypeScript: `npm run type-check` (if available)
   - Test the application manually

### PR Guidelines

1. **Title**: Use descriptive titles (e.g., "Add search functionality to wiki pages")

2. **Description**: Include:
   - What changes were made and why
   - How to test the changes
   - Screenshots for UI changes
   - Any breaking changes or migration steps

3. **Code Review Checklist**:
   - [ ] Code follows project conventions
   - [ ] TypeScript types are properly defined
   - [ ] No console.log statements left in production code
   - [ ] Error handling is implemented
   - [ ] Components are properly tested
   - [ ] Documentation is updated if needed

### Commit Message Format

Follow conventional commits:
```
type(scope): description

feat(auth): add Firebase authentication
fix(api): resolve webhook parsing issue
docs(readme): update installation instructions
style(components): improve button accessibility
```

## 🧪 Testing

### Manual Testing
- Test core functionality: page rendering, authentication, search
- Test responsive design on different screen sizes
- Verify Firebase authentication flows work correctly
- Test webhook functionality if modified

### Automated Testing
- Add unit tests for utility functions
- Add integration tests for API routes
- Test components with React Testing Library when applicable

## 🚨 Issue Reporting

When reporting bugs or requesting features:

1. **Search existing issues** first
2. **Use issue templates** when available
3. **Provide detailed information**:
   - Environment details (OS, browser, Node.js version)
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots or error messages

## 📋 Areas for Contribution

### High Priority
- Improve error handling and user feedback
- Add comprehensive testing coverage
- Enhance accessibility (ARIA labels, keyboard navigation)
- Optimize performance and bundle size

### Medium Priority
- Add more customization options
- Improve mobile experience
- Add more Obsidian markdown features support
- Enhance search functionality

### Documentation
- Improve setup instructions
- Add troubleshooting guides
- Create deployment guides for different platforms
- Add API documentation

## 🤝 Community

- Be respectful and inclusive
- Help other contributors
- Share knowledge and best practices
- Follow our [Code of Conduct](./CODE_OF_CONDUCT.md)

## 📞 Getting Help

- Open an issue for bugs or feature requests
- Check existing documentation and issues first
- Join discussions in pull requests and issues

Thank you for contributing to doo_sync_obsidian! 🎉