workflow "Build and Test (node 11)" {
  on = "push"
  resolves = [
    "Linter",
    "Coverage (node 11)",
  ]
}

workflow "Build and Test (node 10)" {
  on = "push"
  resolves = [
    "Coverage (node 10)",
  ]
}

workflow "Build and Test (node 8)" {
  on = "push"
  resolves = [
    "Coverage (node 8)",
  ]
}

action "Linter" {
  uses = "docker://node:11"
  runs = "yarn"
  args = "linter"
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

action "Coverage (node 11)" {
  uses = "docker://node:11"
  runs = "bash -c"
  args = ["yarn codecov --disable=detect --commit=$GITHUB_SHA --branch=${GITHUB_REF#refs/heads/}"]
  needs = ["Test (node 11)"]
  secrets = ["CODECOV_TOKEN"]
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

action "Coverage (node 10)" {
  uses = "docker://node:10"
  runs = "bash -c"
  args = ["yarn codecov --disable=detect --commit=$GITHUB_SHA --branch=${GITHUB_REF#refs/heads/}"]
  needs = ["Test (node 10)"]
  secrets = ["CODECOV_TOKEN"]
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

action "Coverage (node 8)" {
  uses = "docker://node:8"
  runs = "bash -c"
  args = ["yarn codecov --disable=detect --commit=$GITHUB_SHA --branch=${GITHUB_REF#refs/heads/}"]
  needs = ["Test (node 8)"]
  secrets = ["CODECOV_TOKEN"]
}
