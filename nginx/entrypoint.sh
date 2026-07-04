#!/bin/bash
set -e

DOMAIN_FILE="/etc/nginx/conf.d/.domain"
CERT_TYPE_FILE="/etc/nginx/conf.d/.cert_type"
CONFIG_FILE="/etc/nginx/conf.d/default.conf"

# Writes the appropriate nginx config based on what certs exist
apply_config() {
  local domain cert_type

  domain=$(cat "$DOMAIN_FILE" 2>/dev/null || echo "localhost")
  cert_type=$(cat "$CERT_TYPE_FILE" 2>/dev/null || echo "none")

  local new_config

  if [ "$cert_type" = "letsencrypt" ] && [ -f "/etc/letsencrypt/live/${domain}/fullchain.pem" ]; then
    new_config=$(DOMAIN="$domain" envsubst '${DOMAIN}' < /templates/https-letsencrypt.conf.template)
  elif [ "$cert_type" = "selfsigned" ] && [ -f "/etc/letsencrypt/selfsigned/fullchain.pem" ]; then
    new_config=$(DOMAIN="$domain" envsubst '${DOMAIN}' < /templates/https-selfsigned.conf.template)
  else
    new_config=$(cat /templates/http.conf.template)
  fi

  # Only reload nginx if the config actually changed
  if [ "$new_config" != "$(cat "$CONFIG_FILE" 2>/dev/null)" ]; then
    echo "$new_config" > "$CONFIG_FILE"
    echo "nginx: config updated (cert_type=${cert_type}, domain=${domain})"
    return 0  # signal: reload needed
  fi

  return 1  # no change
}

# Write initial config and start nginx
apply_config || true
nginx -g 'daemon off;' &
NGINX_PID=$!

# Poll every 30 seconds — when certs appear (written by the setup wizard)
# the config swaps to HTTPS and nginx reloads without dropping connections
while kill -0 "$NGINX_PID" 2>/dev/null; do
  sleep 30
  if apply_config; then
    nginx -s reload
  fi
done
