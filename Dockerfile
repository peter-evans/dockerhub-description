FROM peterevans/curl-jq:1.0.0

LABEL \
  maintainer="Peter Evans <mail@peterevans.dev>" \
  repository="https://github.com/peter-evans/dockerhub-description" \
  homepage="https://github.com/peter-evans/dockerhub-description"

LABEL \
  com.github.actions.name="Docker Hub Description" \
  com.github.actions.description="An action to update a Docker Hub repository description from README.md" \
  com.github.actions.icon="upload" \
  com.github.actions.color="blue"

COPY LICENSE README.md

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
