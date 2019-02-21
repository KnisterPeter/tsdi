workflow "Build and Test on push" {
  on = "push"
  resolves = ["Test"]
}

action "Install" {
  uses = "docker://culturehq/actions-yarn:latest"
  args = "install"
}

action "Test" {
  uses = "docker://culturehq/actions-yarn:latest"
  needs = ["Install"]
  args = "test"
}
