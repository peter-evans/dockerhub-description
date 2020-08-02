#!/bin/sh -l
set -eo pipefail
IFS=$'\n\t'

# Allow DOCKERHUB_* variables to be set from their DOCKER_* variant
DOCKERHUB_USERNAME=${DOCKERHUB_USERNAME:-${DOCKER_USERNAME}}
DOCKERHUB_PASSWORD=${DOCKERHUB_PASSWORD:-${DOCKER_PASSWORD}}
DOCKERHUB_REPOSITORY=${DOCKERHUB_REPOSITORY:-${DOCKER_REPOSITORY}}

# If the repository isn't explicitly defined, infer it from GitHub if possible
DOCKERHUB_REPOSITORY=${DOCKERHUB_REPOSITORY:-${GITHUB_REPOSITORY}}

# Validate we can authenticate
if [ -z "$DOCKERHUB_USERNAME" ] || [ -z "$DOCKERHUB_PASSWORD" ]; then
  echo 'Unable to authenticate with Docker Hub, set a valid $DOCKERHUB_USERNAME and $DOCKERHUB_PASSWORD'
  exit 1
fi

# Validate we have the repository name
if [ -z "$DOCKERHUB_REPOSITORY" ]; then
  echo 'Unable to determine Docker Hub repository name, set with $DOCKERHUB_REPOSITORY'
  exit 1
fi

# Set the default path to README.md
README_FILEPATH=${README_FILEPATH:="./README.md"}

# Check the file size
if [ $(wc -c <${README_FILEPATH}) -gt 25000 ]; then
  echo "File size exceeds the maximum allowed 25000 bytes"
  exit 1
fi

# Acquire a token for the Docker Hub API
echo "Acquiring token"
LOGIN_PAYLOAD="{\"username\": \"${DOCKERHUB_USERNAME}\", \"password\": \"${DOCKERHUB_PASSWORD}\"}"
TOKEN=$(curl -s -H "Content-Type: application/json" -X POST -d ${LOGIN_PAYLOAD} https://hub.docker.com/v2/users/login/ | jq -r .token)

# Send a PATCH request to update the description of the repository
echo "Sending PATCH request"
REPO_URL="https://hub.docker.com/v2/repositories/${DOCKERHUB_REPOSITORY}/"
RESPONSE_CODE=$(curl -s --write-out %{response_code} --output /dev/null -H "Authorization: JWT ${TOKEN}" -X PATCH --data-urlencode full_description@${README_FILEPATH} ${REPO_URL})
echo "Received response code: $RESPONSE_CODE"

if [ $RESPONSE_CODE -eq 200 ]; then
  echo "Request successful"
  exit 0
else
  echo "Request failed"
  exit 1
fi
