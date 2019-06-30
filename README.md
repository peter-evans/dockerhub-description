# Docker Hub Description
[![CircleCI](https://circleci.com/gh/peter-evans/dockerhub-description/tree/master.svg?style=svg)](https://circleci.com/gh/peter-evans/dockerhub-description/tree/master)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Docker%20Hub%20Description-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAM6wAADOsB5dZE0gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAERSURBVCiRhZG/SsMxFEZPfsVJ61jbxaF0cRQRcRJ9hlYn30IHN/+9iquDCOIsblIrOjqKgy5aKoJQj4O3EEtbPwhJbr6Te28CmdSKeqzeqr0YbfVIrTBKakvtOl5dtTkK+v4HfA9PEyBFCY9AGVgCBLaBp1jPAyfAJ/AAdIEG0dNAiyP7+K1qIfMdonZic6+WJoBJvQlvuwDqcXadUuqPA1NKAlexbRTAIMvMOCjTbMwl1LtI/6KWJ5Q6rT6Ht1MA58AX8Apcqqt5r2qhrgAXQC3CZ6i1+KMd9TRu3MvA3aH/fFPnBodb6oe6HM8+lYHrGdRXW8M9bMZtPXUji69lmf5Cmamq7quNLFZXD9Rq7v0Bpc1o/tp0fisAAAAASUVORK5CYII=)](https://github.com/marketplace/actions/docker-hub-description)

A GitHub action to update a Docker Hub repository description from `README.md`.

This is useful if you `docker push` your images to Docker Hub. It provides an easy, automated way to keep your Docker Hub repository description in sync with your GitHub repository `README.md` file.

## Usage

```
action "Docker Hub Description" {
  uses = "peter-evans/dockerhub-description@v1.0.1"
  secrets = ["DOCKERHUB_USERNAME", "DOCKERHUB_PASSWORD", "DOCKERHUB_REPOSITORY"]
}
```

#### Required secrets

- `DOCKERHUB_USERNAME` - Docker Hub username
- `DOCKERHUB_PASSWORD` - Docker Hub password
- `DOCKERHUB_REPOSITORY` - The name of the Docker Hub repository to update. The action combines this with the username to locate the repository. i.e. `username/repository`

Note that `DOCKERHUB_USERNAME` and `DOCKERHUB_REPOSITORY` may also be environment variables if not considered sensitive.

#### Optionally specifying the file path

The action assumes that there is a file called `README.md` located at the root of the repository.
If this is not the case, the path can be overridden with an environment variable.

```
action "Docker Hub Description" {
  uses = "peter-evans/dockerhub-description@v1.0.1"
  secrets = ["DOCKERHUB_USERNAME", "DOCKERHUB_PASSWORD", "DOCKERHUB_REPOSITORY"]
  env = {
    README_FILEPATH = "./some-path/README.md"
  }
}
```

#### Examples

Updates the Docker Hub repository description whenever there is a `git push` to the `master` branch.
```
workflow "Update Docker Hub Description" {
  resolves = ["Docker Hub Description"]
  on = "push"
}

action "Filter master branch" {
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Docker Hub Description" {
  needs = ["Filter master branch"]
  uses = "peter-evans/dockerhub-description@v1.0.1"
  secrets = ["DOCKERHUB_USERNAME", "DOCKERHUB_PASSWORD", "DOCKERHUB_REPOSITORY"]
}
```

Updates the Docker Hub repository description whenever a new release is created.
```
workflow "Update Docker Hub Description" {
  resolves = ["Docker Hub Description"]
  on = "release"
}

action "Docker Hub Description" {
  uses = "peter-evans/dockerhub-description@v1.0.1"
  secrets = ["DOCKERHUB_USERNAME", "DOCKERHUB_PASSWORD", "DOCKERHUB_REPOSITORY"]
}
```

## Using the Docker image independently of GitHub Actions

The image can be executed in other environments independently of GitHub Actions.
Simply volume mount the location of the `README.md` file to the container and set environment variables as follows.

```bash
docker run -v $PWD:/workspace \
  -e DOCKERHUB_USERNAME='user1' \
  -e DOCKERHUB_PASSWORD='xxxxx' \
  -e DOCKERHUB_REPOSITORY='my-docker-image' \
  -e README_FILEPATH='/workspace/README.md' \
  peterevans/dockerhub-description:1.0.1
```

## License

MIT License - see the [LICENSE](LICENSE) file for details
