workflow "Docker Hub Description Workflow" {
  on = "push"
  resolves = ["Docker Hub Description"]
}

action "Docker Hub Description" {
  uses = "./"
  secrets = ["DOCKERHUB_USERNAME", "DOCKERHUB_PASSWORD", "DOCKERHUB_REPOSITORY"]
}
