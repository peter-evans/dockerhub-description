# Docker Hub Description
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Docker%20Hub%20Description-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAM6wAADOsB5dZE0gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAERSURBVCiRhZG/SsMxFEZPfsVJ61jbxaF0cRQRcRJ9hlYn30IHN/+9iquDCOIsblIrOjqKgy5aKoJQj4O3EEtbPwhJbr6Te28CmdSKeqzeqr0YbfVIrTBKakvtOl5dtTkK+v4HfA9PEyBFCY9AGVgCBLaBp1jPAyfAJ/AAdIEG0dNAiyP7+K1qIfMdonZic6+WJoBJvQlvuwDqcXadUuqPA1NKAlexbRTAIMvMOCjTbMwl1LtI/6KWJ5Q6rT6Ht1MA58AX8Apcqqt5r2qhrgAXQC3CZ6i1+KMd9TRu3MvA3aH/fFPnBodb6oe6HM8+lYHrGdRXW8M9bMZtPXUji69lmf5Cmamq7quNLFZXD9Rq7v0Bpc1o/tp0fisAAAAASUVORK5CYII=)](https://github.com/marketplace/actions/docker-hub-description)

A GitHub action to update a Docker Hub repository description from `README.md`.

This is useful if you `docker push` your images to Docker Hub. It provides an easy, automated way to keep your Docker Hub repository description in sync with your GitHub repository `README.md` file.

## Usage

```yml
    - name: Docker Hub Description
      uses: peter-evans/dockerhub-description@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_PASSWORD }}
        repository: peterevans/dockerhub-description
```

### Action inputs

**Note**: Docker Hub [Personal Access Tokens](https://docs.docker.com/docker-hub/access-tokens/) cannot be used as they are not supported by the API. See [here](https://github.com/docker/hub-feedback/issues/1927) and [here](https://github.com/docker/hub-feedback/issues/1914) for further details. Unfortunately, this means that enabling 2FA on Docker Hub will prevent the action from working.

| Name | Description | Default |
| --- | --- | --- |
| `username` | (**required**) Docker Hub username. If updating a Docker Hub repository belonging to an organization, this user must have `Admin` permissions for the repository. | |
| `password` | (**required**) Docker Hub password. | |
| `repository` | Docker Hub repository in the format `<namespace>/<name>`. | `github.repository` |
| `short-description` | Docker Hub repository short description. Input exceeding 100 characters will be truncated. | |
| `readme-filepath` | Path to the repository readme. | `./README.md` |

#### Specifying the file path

The action assumes that there is a file called `README.md` located at the root of the repository.
If this is not the case the path can be specified with the `readme-filepath` input.

```yml
    - name: Docker Hub Description
      uses: peter-evans/dockerhub-description@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_PASSWORD }}
        repository: peterevans/dockerhub-description
        readme-filepath: ./path/to/README.md
```

#### Using the GitHub repository description

The GitHub repository description can be used for the Docker Hub `short-descripton` by passing the description from the event context.

```yml
    - name: Docker Hub Description
      uses: peter-evans/dockerhub-description@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_PASSWORD }}
        repository: peterevans/dockerhub-description
        short-description: ${{ github.event.repository.description }}
```

### Examples

The following workflow updates the Docker Hub repository description whenever there are changes to `README.md` and the workflow file itself on the `main` branch. This workflow assumes its location to be `.github/workflows/dockerhub-description.yml`.

```yml
name: Update Docker Hub Description
on:
  push:
    branches:
      - main
    paths:
      - README.md
      - .github/workflows/dockerhub-description.yml
jobs:
  dockerHubDescription:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Docker Hub Description
      uses: peter-evans/dockerhub-description@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_PASSWORD }}
        repository: peterevans/dockerhub-description
        short-description: ${{ github.event.repository.description }}
```

Updates the Docker Hub repository description whenever a new release is created.

```yml
name: Update Docker Hub Description
on: release
jobs:
  dockerHubDescription:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Docker Hub Description
      uses: peter-evans/dockerhub-description@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_PASSWORD }}
        repository: peterevans/dockerhub-description
        short-description: ${{ github.event.repository.description }}
```

## Using the Docker image independently of GitHub Actions

The image can be executed in other environments independently of GitHub Actions.
Simply volume mount the location of the `README.md` file to the container and set environment variables as follows.

```bash
docker run -v $PWD:/workspace \
  -e DOCKERHUB_USERNAME='user1' \
  -e DOCKERHUB_PASSWORD='xxxxx' \
  -e DOCKERHUB_REPOSITORY='user1/my-docker-image' \
  -e README_FILEPATH='/workspace/README.md' \
  peterevans/dockerhub-description:3
```

## License

[MIT](LICENSE)
