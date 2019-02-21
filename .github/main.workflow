workflow "Build and Test on push" {
  on = "push"
  resolves = [
    "Linter",
    "Test (node 10)",
    "Test (node 8)",
    "Test (node 6)",
  ]
}

action "Install yarn" {
  uses = "docker://node:10"
  args = "install"
  runs = "yarn"
}

action "Install (node 10)" {
  uses = "docker://node:10"
  runs = "yarn"
  needs = ["Install yarn"]
}

action "Test (node 10)" {
  uses = "docker://node:10"
  runs = "yarn"
  args = "test"
  needs = ["Install (node 10)"]
}

action "Linter" {
  uses = "docker://node:10"
  runs = "yarn"
  args = "linter"
  needs = ["Install (node 10)"]
}

action "Install (node 8)" {
  uses = "docker://node:8"
  needs = ["Install yarn"]
  runs = "yarn"
  args = "install"
}

action "Install (node 6)" {
  uses = "docker://node:6"
  needs = ["Install yarn"]
  runs = "yarn"
  args = "install"
}

action "Test (node 8)" {
  uses = "docker://node:8"
  needs = ["Install (node 8)"]
  runs = "yarn "
  args = "test"
}

action "Test (node 6)" {
  uses = "docker://node:6"
  needs = ["Install (node 6)"]
  runs = "yarn"
  args = "test"
}
