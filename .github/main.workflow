workflow "Docker Hub Description Workflow" {
  on = "push"
  resolves = ["Docker Hub Description"]
}

action "Filter master branch" {
  uses = "actions/bin/filter@v1.0.0"
  args = "branch master"
}

action "Docker Hub Description" {
  needs = ["Filter master branch"]
  uses = "./"
  secrets = ["DOCKERHUB_USERNAME", "DOCKERHUB_PASSWORD", "DOCKERHUB_REPOSITORY"]
}
