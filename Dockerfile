FROM node:12-alpine

LABEL \
  maintainer="devops-team@parity.io" \
  io.parity.image.title="dockerhub-description" \
  io.parity.image.description="An action to update a Docker Hub repository description from README.md" \
  io.parity.image.authors="devops-team@parity.io" \
  io.parity.image.source="https://github.com/paritytech-stg/dockerhub-description/blob/main/Dockerfile" \
  io.parity.image.vendor="Parity Technologies" \
  org.opencontainers.image.licenses="MIT"

COPY LICENSE README.md /

COPY dist/index.js /index.js

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
