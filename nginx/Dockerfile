FROM nginx:1.27-alpine

# bash is needed for the entrypoint script
RUN apk add --no-cache bash

# Templates are baked into the image; runtime config lands on the shared volume
COPY templates/ /templates/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
