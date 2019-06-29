FROM peterevans/curl-jq:1.0.1

LABEL maintainer="Peter Evans <mail@peterevans.dev>"
LABEL repository="https://github.com/peter-evans/dockerhub-description"
LABEL homepage="https://github.com/peter-evans/dockerhub-description"

LABEL com.github.actions.name="Docker Hub Description"
LABEL com.github.actions.description="An action to update a Docker Hub repository description from README.md"
LABEL com.github.actions.icon="upload"
LABEL com.github.actions.color="blue"

COPY LICENSE README.md /

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
