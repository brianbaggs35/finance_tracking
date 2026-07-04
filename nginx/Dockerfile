FROM nginxinc/nginx-unprivileged:stable-alpine

# bash for the entrypoint script, gettext for envsubst (variable substitution in templates)
RUN apk add --no-cache bash gettext

# Templates are baked into the image; runtime config lands on the shared volume
COPY templates/ /templates/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
