---
title: Build
sidebar_position: 3
---

# How to Build an OSH Node

This page guides you through building an OSH Node from source using the command line.

## Getting the Code
The `git` command is used to download the code from the GitHub repositories hosting **OpenSensorHub**. 

For example, you can download the code for an OSH Node Development Template using the following command:

```git 
git clone --recursive https://github.com/opensensorhub/osh-node-dev-template.git
```

:::note
The `--recursive` flag is required because the repository contains submodules.
:::

## Building from the Command Line
You can the build the code from source using Gradle on the command line.

Change into the directory where you cloned the repository:

```sh
cd path/to/osh-node-dev-template
```
To build, run the following:   
```sh
./gradlew build -x test
```
:::note
`-x test` excludes the tests from the build process 
:::



The resulting build will be contained in:

`/osh-node-template/build/distributions/osh-node-..*.zip`
