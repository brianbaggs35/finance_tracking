# syntax=docker/dockerfile:1
# check=error=true

ARG RUBY_VERSION=4.0.5
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

WORKDIR /rails

# Install runtime dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      curl \
      libjemalloc2 \
      libvips \
      openssl \
      postgresql-client \
      python3 \
      python3-venv && \
    ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install certbot + DNS plugins in an isolated Python virtual environment
RUN python3 -m venv /opt/certbot && \
    /opt/certbot/bin/pip install --quiet \
      certbot \
      certbot-dns-cloudflare \
      certbot-dns-digitalocean \
      certbot-dns-ionos \
      certbot-dns-route53 \
      certbot-dns-godaddy && \
    ln -s /opt/certbot/bin/certbot /usr/local/bin/certbot

ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development:test" \
    LD_PRELOAD="/usr/local/lib/libjemalloc.so"


# ── Build stage ──────────────────────────────────────────────────────────────
FROM base AS build

ARG NODE_MAJOR=22

# Install build tools + Node.js (required for Vite asset compilation)
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      curl \
      git \
      libpq-dev \
      libvips \
      libyaml-dev \
      pkg-config && \
    curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - && \
    apt-get install --no-install-recommends -y nodejs && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install Ruby gems (done before copying app code so Docker can cache this layer)
COPY vendor/* ./vendor/
COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile -j 1 --gemfile

# Install JavaScript packages (cached unless package-lock.json changes)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Precompile bootsnap for faster boot
RUN bundle exec bootsnap precompile -j 1 app/ lib/

# Build frontend assets (runs vite build) and Rails assets
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile


# ── Final stage ───────────────────────────────────────────────────────────────
FROM base

# Copy built gems and compiled application from build stage
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails /rails

ENTRYPOINT ["/rails/bin/docker-entrypoint"]

EXPOSE 3000
CMD ["./bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
