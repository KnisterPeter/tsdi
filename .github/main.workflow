workflow "Build and Test on push" {
  on = "push"
  resolves = [
    "Linter",
    "Coverage",
    "Test (node 11)",
  ]
}

workflow "Build and Test (node 10)" {
  on = "push"
  resolves = [
    "Test (node 10)",
  ]
}

workflow "Build and Test (node 8)" {
  on = "push"
  resolves = [
    "Test (node 8)",
  ]
}

workflow "Build and Test (node 6)" {
  on = "push"
  resolves = [
    "Test (node 6)",
  ]
}

action "Linter" {
  uses = "docker://node:11"
  runs = "yarn"
  args = "linter"
  needs = ["Install (node 11)"]
}

action "Coverage" {
  uses = "docker://node:11"
  runs = "yarn"
  args = "coverage"
  needs = ["Install (node 11)"]
}

action "Install (node 11)" {
  uses = "docker://node:11"
  runs = "yarn"
}

action "Test (node 11)" {
  uses = "docker://node:11"
  runs = "yarn"
  args = "test --runInBand"
  needs = ["Install (node 11)"]
}

action "Install (node 10)" {
  uses = "docker://node:10"
  runs = "yarn"
}

action "Test (node 10)" {
  uses = "docker://node:10"
  runs = "yarn"
  args = "test --runInBand"
  needs = ["Install (node 10)"]
}

action "Install (node 8)" {
  uses = "docker://node:8"
  runs = "yarn"
  args = "install"
}

action "Test (node 8)" {
  uses = "docker://node:8"
  needs = ["Install (node 8)"]
  runs = "yarn "
  args = "test --runInBand"
}

action "Install (node 6)" {
  uses = "docker://node:6"
  runs = "yarn"
  args = "install"
}

action "Test (node 6)" {
  uses = "docker://node:6"
  needs = ["Install (node 6)"]
  runs = "yarn"
  args = "test --runInBand"
}
