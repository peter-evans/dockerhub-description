workflow "Update Docker Hub Description" {
  resolves = ["Docker Hub Description"]
  on = "push"
}

action "Docker Hub Description" {
  uses = "./"
  secrets = ["DOCKERHUB_USERNAME", "DOCKERHUB_PASSWORD", "DOCKERHUB_REPOSITORY"]
}
