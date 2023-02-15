FROM node:12-alpine

# metadata
ARG VCS_REF
ARG BUILD_DATE
ARG IMAGE_NAME

LABEL \
  maintainer="devops-team@parity.io" \
  io.parity.image.title="${IMAGE_NAME}" \
  io.parity.image.description="An action to update a Docker Hub repository description from README.md" \
  io.parity.image.authors="devops-team@parity.io" \
  io.parity.image.source="https://github.com/paritytech-stg/dockerhub-description/blob/main/Dockerfile" \
  io.parity.image.vendor="Parity Technologies" \
  io.parity.image.revision="${VCS_REF}" \
  io.parity.image.created="${BUILD_DATE}" \
  org.opencontainers.image.licenses="MIT"

COPY LICENSE README.md /

COPY dist/index.js /index.js

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
