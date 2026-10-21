# Contributing to Altrex GMS

Thank you for contributing to the **Altrex GMS** repository. To maintain high code quality and consistency across the codebase, please review and adhere to the following standards.

---

## 📋 Table of Contents
1. [Development Setup](#development-setup)
2. [Git Workflow & Branching](#git-workflow--branching)
3. [Commit Message Conventions](#commit-message-conventions)
4. [Coding Standards](#coding-standards)
5. [Quality Checks & Testing](#quality-checks--testing)

---

## 💻 Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/altrex-gms.git
   cd altrex-gms
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *Note: This automatically initializes Husky git hooks (`npm run prepare`).*

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase, Razorpay, and WhatsApp credentials in `.env.local`.

4. **Start development server:**
   ```bash
   npm run dev
   ```

---

## 🌿 Git Workflow & Branching

- Use descriptive branch names:
  - `feat/feature-name` (e.g., `feat/whatsapp-reports`)
  - `fix/bug-description` (e.g., `fix/attendance-cooldown`)
  - `refactor/scope` (e.g., `refactor/payment-tables`)
  - `docs/topic` (e.g., `docs/setup-guide`)
- Never push directly to `main` without creating a pull request.

---

## 📝 Commit Message Conventions

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) via **Husky** and **Commitlint**. Commits that do not match the conventional format will be rejected by the pre-commit hook.

### Format
```
<type>(<optional scope>): <description>
```

### Allowed Types
| Type | Purpose | Example |
|---|---|---|
| `feat` | A new feature | `feat(members): add biometric face id linking` |
| `fix` | A bug fix | `fix(payments): prevent negative due amounts` |
| `docs` | Documentation changes | `docs: update environment variable guide` |
| `style` | Formatting or styling without logic change | `style(dashboard): polish stat card spacing` |
| `refactor` | Code restructuring without feature change | `refactor(attendance): simplify cooldown filter` |
| `perf` | Performance improvement | `perf(db): add index on attendance timestamps` |
| `test` | Adding or updating tests | `test(api): add webhook signature validation test` |
| `chore` | Build process, tooling, or dependencies | `chore: update dependencies` |

---

## 📐 Coding Standards

- **TypeScript Strict Mode**: Ensure all types are properly declared. Avoid using `any` unless strictly necessary for dynamic external payloads.
- **Next.js App Router Conventions**:
  - Keep client components (`"use client"`) at the leaves of your component tree.
  - Server Actions must be placed in dedicated `actions.ts` files or marked with `"use server"`.
- **Database & RLS**:
  - Never disable Row Level Security on production tables.
  - Keep all schema definitions organized within the `supabase/` directory.
- **Imports**:
  - Use the `@/*` alias for imports originating in `src/`.

---

## 🧪 Quality Checks & Testing

Before committing or opening a pull request, verify that all automated checks pass locally:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Linting (Must pass with 0 errors and 0 warnings)
npm run lint

# 3. Production build verification
npm run build
```
