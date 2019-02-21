workflow "Build and Test on push" {
  on = "push"
  resolves = ["Test"]
}

action "Install yarn" {
  uses = "docker://node:10"
  args = "install"
  runs = "yarn"
}

action "Install" {
  uses = "docker://node:10"
  runs = "yarn"
  needs = ["Install yarn"]
}

action "Test" {
  uses = "docker://node:10"
  runs = "yarn"
  args = "test"
  needs = ["Install"]
}
