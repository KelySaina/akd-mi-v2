# Contributing to AKD-MI

Thank you for your interest in contributing! Here's how you can help.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature or fix

```bash
git checkout -b feature/my-feature
```

## Development Setup

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose
- PostgreSQL
- Redis
- MinIO (S3-compatible storage)

### Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Portal

```bash
cd portal
npm install
npx prisma migrate dev
npm run dev
```

## Code Style

- Use TypeScript for all new code
- Follow existing patterns and conventions in the codebase
- Use meaningful variable and function names
- Add comments for complex logic

## Commit Messages

Use clear and descriptive commit messages:

```
feat: add student enrollment notifications
fix: resolve grade calculation rounding error
docs: update API documentation
chore: upgrade dependencies
```

## Pull Requests

1. Ensure your code builds and passes any existing tests
2. Update documentation if needed
3. Describe your changes clearly in the PR description
4. Link any related issues

## Reporting Issues

- Use the GitHub issue tracker
- Include steps to reproduce the problem
- Provide environment details (OS, Node version, etc.)
- Include relevant logs or screenshots

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
