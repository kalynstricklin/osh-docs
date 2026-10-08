---
title: Build & Install OSH Android
description: Clone the OSH Android repository, configure the Android SDK, build an APK, and install it on a device.
sidebar_position: 1
---

# Building OSH Android

Build OpenSensorHub for Android from the repository using Android Studio or the included Gradle wrapper. This guide produces a debug APK for development and testing.

## Prerequisites

Install Git, JDK 17, and the Android SDK. Android Studio provides an IDE and SDK Manager for configuring the project.

The current repository uses:

| Component | Version |
| --- | --- |
| JDK | 17 |
| Android SDK Platform | 34 |
| Android SDK Build Tools | 34.0.0 |
| Gradle | 8.2, provided by the wrapper |
| Android Gradle Plugin | 8.2.2 |
| Minimum device version | Android 13, API 33 |

Install Android SDK Platform-Tools if you plan to connect a device over USB. Internet access is required to download the source, Gradle distribution, and build dependencies.

You do not need to install Gradle separately or build an OSH server before building the Android app.

## 1. Clone the repository

Clone the app and enter the project directory:

```bash
git clone https://github.com/Botts-Innovative-Research/osh-android.git
cd osh-android
```

If you are building a specific release or branch, check it out before initializing the submodules.

### Initialize submodules

The repository includes `osh-core` and `osh-addons` as Git submodules. Their source is required for the build.

```bash
git submodule update --init --recursive
git submodule status --recursive
```

The current `.gitmodules` uses GitHub SSH URLs, including an `osh-core` fork. These URLs require working GitHub SSH authentication and access to the referenced repositories.

If you use HTTPS instead of SSH, configure the submodule URLs locally before running the update:

```bash
git config submodule.include/osh-addons.url https://github.com/opensensorhub/osh-addons.git
git config submodule.include/osh-core.url https://github.com/kalynstricklin/osh-core.git
git submodule update --init --recursive
```

These commands preserve the repositories referenced by this checkout and change only the local transport configuration. HTTPS still requires authorization if a repository is private.

Use the submodule commits recorded by the app repository. Independently switching submodules to other branches can introduce incompatible dependencies. In `git submodule status`, a leading `-` indicates an uninitialized submodule and a leading `+` indicates a commit that differs from the recorded revision.

## 2. Configure the Android SDK and JDK

In Android Studio, open **SDK Manager** and install:

- Android SDK Platform 34
- Android SDK Build-Tools 34.0.0
- Android SDK Platform-Tools

Create a file named `local.properties` in the repository root and set the SDK location:

```properties
sdk.dir=/absolute/path/to/Android/sdk
```

Typical locations are:

| Operating system | Typical SDK directory |
| --- | --- |
| macOS | `/Users/YOUR_USERNAME/Library/Android/sdk` |
| Linux | `/home/YOUR_USERNAME/Android/Sdk` |
| Windows | `C:/Users/YOUR_USERNAME/AppData/Local/Android/Sdk` |

Use the actual path shown in SDK Manager. On Windows, forward slashes can be used in `local.properties`. This file contains machine-specific settings and should not be committed.

Set Android Studio's **Gradle JDK** to JDK 17. For terminal builds, make sure `JAVA_HOME` points to JDK 17 and check the Java version:

```bash
java -version
./gradlew --version
```

The Gradle output should report Gradle 8.2 and JVM 17. On Windows, replace `./gradlew` with `gradlew.bat` in Command Prompt or `.\gradlew.bat` in PowerShell throughout this guide.

## 3. Build the debug APK

Run the following command from the repository root, where `settings.gradle` and `gradlew` are located:

```bash
./gradlew :sensorhub-android-app:assembleDebug
```

The first build may take longer while Gradle downloads dependencies. When the command finishes successfully, find the APK in:

```text
sensorhub-android-app/build/outputs/apk/debug/
```

### Build with Android Studio

Alternatively, open the repository root in Android Studio and allow Gradle sync to finish. Select the `sensorhub-android-app` module and the debug build variant. Use the IDE's build action to create the APK, or select a connected device and use **Run** to build, install, and launch the app.

## 4. Install on an Android device

Use a device running Android 13 or later. A physical device is needed to validate hardware sensors and external peripherals.

1. Enable **Developer options** and **USB debugging** on the Android device.
2. Connect the device to your computer using a USB cable that supports data transfer.
3. Unlock the device and approve its USB debugging authorization prompt.
4. From the repository root, run:

```bash
./gradlew :sensorhub-android-app:installDebug
```

Open **OpenSensorHub** from the device's app launcher. The application ID is `com.georobotix.android`.

You can also transfer the generated APK to the device and open it to install. Android may ask you to allow installation from the browser or file manager opening the APK.

After installation, follow [Configuring OSH Android](config.md) to create a server profile, enable sensors, and start streaming.

## Troubleshooting

| Problem | Resolution |
| --- | --- |
| Submodule checkout fails with `Permission denied (publickey)` | Configure GitHub SSH authentication, or use the local HTTPS submodule configuration above. Confirm access to both referenced repositories. |
| A required module or repository is missing | Run `git submodule update --init --recursive` from the project root and inspect its output for errors. |
| SDK location is missing or invalid | Check `sdk.dir` in `local.properties` against the installed SDK directory. |
| SDK Platform or Build Tools cannot be found | Install Platform 34 and Build Tools 34.0.0 using SDK Manager and accept any required SDK licenses. |
| Java or Gradle compatibility error | Verify JDK 17 is selected for both terminal builds and Android Studio. Use the repository's Gradle wrapper. |
| Dependency downloads fail | Check network access and any proxy settings needed to reach Google Maven, Maven Central, JitPack, and the Gradle distribution service. |
| `./gradlew` reports permission denied | On macOS or Linux, run `chmod +x gradlew`, then retry. |
| No device is available for installation | Check the USB cable, USB debugging setting, and authorization prompt. If Platform-Tools is on your PATH, run `adb devices` to inspect the connection. |
| Installation reports an incompatible signature | Use an APK signed with the same key as the installed app, or uninstall the existing app before installing the debug build. Uninstalling removes its app data and saved configuration. |

For additional build diagnostics, rerun the failing task with a stack trace:

```bash
./gradlew :sensorhub-android-app:assembleDebug --stacktrace
```

The debug APK is intended for development. Distributing a production build requires a release-signing setup and a signed release APK.
