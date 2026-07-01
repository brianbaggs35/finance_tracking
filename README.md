# Template App

A barebones Rails + Vue + TypeScript template with authentication. Fork this repo to start a new app.

## Stack

| Layer | Technology |
|-------|-----------|
| Ruby | 4.0.5 |
| Rails | 8.1.3 |
| Authentication | Devise 5 |
| Database | PostgreSQL 16 |
| Asset pipeline | Propshaft |
| Frontend bundler | Vite 8 (via vite_rails) |
| Frontend framework | Vue 3.5 |
| State management | Pinia 3 |
| Router | vue-router 5 |
| UI components | PrimeVue 4.5 (Aura theme) |
| Language | TypeScript 6 |
| Ruby tests | RSpec 7 + SimpleCov (80% minimum) |
| JS tests | Vitest 4 + @vitest/coverage-v8 (80% minimum) |
| Test factories | FactoryBot + Faker |
| Matchers | Shoulda Matchers 6 |

## Prerequisites

- Ruby 4.0.5 (managed via rbenv)
- Node 22
- PostgreSQL 16

## Setup

```bash
# Install dependencies
bundle install
npm install

# Configure environment (copy and adjust as needed)
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=       # leave blank to use OS user on local PostgreSQL
export DB_PASSWORD=

# Create databases and run migrations
bin/rails db:create db:migrate

# Start the dev server (Rails + Vite together)
bin/dev
```

Open `http://localhost:3000` — you'll be redirected to `/login`. Create a user in the Rails console to sign in:

```ruby
User.create!(email: "you@example.com", password: "Password1!", password_confirmation: "Password1!")
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | _(blank)_ | PostgreSQL user |
| `DB_PASSWORD` | _(blank)_ | PostgreSQL password |
| `DB_NAME` | `template_app_development` | Development database name |
| `DB_NAME_TEST` | `template_app_test` | Test database name |

## Running tests

```bash
# Ruby (RSpec) — unset DATABASE_URL if your shell has one set from another project
env -u DATABASE_URL bundle exec rspec

# JavaScript (Vitest)
npm run test

# JavaScript with coverage report
npm run test:coverage

# TypeScript type check only
npm run type-check
```

Coverage reports are written to:
- `coverage/` — SimpleCov HTML + LCOV (Ruby), 97%+ on current code
- `coverage/frontend/` — v8 HTML + LCOV (JS), 96%+ on current code

Both are gitignored.

## Authentication flow

Authentication uses Devise (model layer only) with a custom JSON API. Session cookies are used; CSRF tokens are managed by the Vue app.

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/sign_in` | Log in — returns `{ user, csrf_token }` |
| `DELETE /api/v1/auth/sign_out` | Log out |
| `GET /api/v1/auth/me` | Returns current user or 401 |
| `GET /api/v1/dashboard` | Authenticated dashboard data |

The Vue app:
1. Calls `GET /api/v1/auth/me` on first navigation to check session state
2. Router guards redirect unauthenticated users to `/login`
3. After login, the response `csrf_token` updates the page's meta tag so subsequent requests stay valid
4. `useApi` composable (`app/frontend/composables/useApi.ts`) handles headers and error shapes for all fetch calls

## Frontend structure

```
app/frontend/
├── entrypoints/
│   └── application.ts       # Vite entry — mounts Vue, wires Pinia/PrimeVue/Router
├── App.vue                  # Root component (Toast + RouterView)
├── vite-env.d.ts            # Vite client type reference
├── router/
│   └── index.ts             # Routes + beforeEach auth guard
├── stores/
│   └── auth.ts              # Pinia auth store (user, login, logout, fetchCurrentUser)
├── composables/
│   └── useApi.ts            # Typed fetch wrapper with CSRF + error handling
├── views/
│   ├── LoginView.vue        # Login page (PrimeVue Card/InputText/Password/Button)
│   └── DashboardView.vue    # Dashboard (Menubar/Card/ProgressSpinner)
├── components/
│   └── AppNav.vue           # Top nav (brand, email, avatar, sign-out)
├── types/
│   └── index.ts             # Shared TypeScript types
└── __tests__/               # Vitest specs mirror the directory above
```

The `@` alias resolves to `app/frontend/` in both Vite and TypeScript.

## Routing

| Pattern | Handler |
|---------|---------|
| `/login` | Vue `LoginView` (redirects to `/` if already authenticated) |
| `/` | Vue `DashboardView` (redirects to `/login` if not authenticated) |
| `/api/v1/**` | Rails API controllers |
| `/up` | Rails health check |
| `/*` (any other path) | Served as SPA shell, Vue router handles it |

## Adding API endpoints

```ruby
# config/routes.rb
namespace :api do
  namespace :v1 do
    resources :posts   # GET /api/v1/posts, POST /api/v1/posts, etc.
  end
end

# app/controllers/api/v1/posts_controller.rb
module Api
  module V1
    class PostsController < ApplicationController
      def index
        render json: { posts: [] }
      end
    end
  end
end
```

## Forking for a new app

1. Fork or copy the repo
2. Rename the app — search and replace `template_app` (and `TemplateApp` for the Ruby module) in:
   - `config/database.yml`
   - `config/deploy.yml`
   - `config/application.rb`
3. Set your database env vars (or `.env` with dotenv)
4. Run `bin/rails db:create db:migrate`
5. Update `config/deploy.yml` with your server details if deploying with Kamal

## CI

GitHub Actions runs four jobs on every PR and push to `master`:

| Job | What it checks |
|-----|---------------|
| `scan_ruby` | Brakeman static analysis + bundler-audit gem audit |
| `lint` | RuboCop |
| `test_ruby` | npm ci + Vite build + RSpec (PostgreSQL service container) |
| `test_frontend` | vue-tsc type check + Vitest with v8 coverage |
