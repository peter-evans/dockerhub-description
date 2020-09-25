FROM node:12-alpine

LABEL \
  maintainer="Peter Evans <mail@peterevans.dev>" \
  org.opencontainers.image.title="dockerhub-description" \
  org.opencontainers.image.description="An action to update a Docker Hub repository description from README.md" \
  org.opencontainers.image.authors="Peter Evans <mail@peterevans.dev>" \
  org.opencontainers.image.url="https://github.com/peter-evans/dockerhub-description" \
  org.opencontainers.image.vendor="https://peterevans.dev" \
  org.opencontainers.image.licenses="MIT"

COPY LICENSE README.md /

COPY dist/index.js /index.js

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
