workflow "Build and Test (node 12)" {
  on = "push"
  resolves = [
    "Linter",
    "Coverage (node 12)",
  ]
}

workflow "Build and Test (node 10)" {
  on = "push"
  resolves = [
    "Coverage (node 10)",
  ]
}

action "Linter" {
  uses = "docker://node:12"
  runs = "yarn"
  args = "linter"
  needs = ["Install (node 12)"]
}

action "Install (node 12)" {
  uses = "docker://node:12"
  runs = "yarn"
}

action "Test (node 12)" {
  uses = "docker://node:12"
  runs = "yarn"
  args = "test --maxWorkers=2"
  needs = ["Install (node 12)"]
}

action "Coverage (node 12)" {
  uses = "docker://node:12"
  runs = "bash -c"
  args = ["yarn codecov --disable=detect --commit=$GITHUB_SHA --branch=${GITHUB_REF#refs/heads/}"]
  needs = ["Test (node 12)"]
  secrets = ["CODECOV_TOKEN"]
}

action "Install (node 10)" {
  uses = "docker://node:10"
  runs = "yarn"
}

action "Test (node 10)" {
  uses = "docker://node:10"
  runs = "yarn"
  args = "test --maxWorkers=2"
  needs = ["Install (node 10)"]
}

action "Coverage (node 10)" {
  uses = "docker://node:10"
  runs = "bash -c"
  args = ["yarn codecov --disable=detect --commit=$GITHUB_SHA --branch=${GITHUB_REF#refs/heads/}"]
  needs = ["Test (node 10)"]
  secrets = ["CODECOV_TOKEN"]
}
