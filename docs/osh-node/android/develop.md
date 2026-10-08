---
title: OSH Android Development
sidebar_position: 3
---

# OSH Android Development

Extend OSH Android with sensor drivers, local OSH services, and Compose app features. This guide identifies the files that connect UI state, saved settings, and the running SensorHub instance.

## Prerequisites

- An OSH Android checkout with initialized submodules.
- JDK 17 and Android Studio with the required Android SDK.
- A successful build using the [Build Guide](build.md).
- The target sensor, its protocol documentation, and any required Android-compatible SDK.

The app uses Compose for its screens and `SharedPreferences` for sensor settings. Add UI definitions in Kotlin; the legacy preference XML and `MainActivity.java` workflow does not apply to this version.

## Project structure

| Location | Responsibility |
| --- | --- |
| `sensorhub-android-app/src/org/sensorhub/android/ui/screens/` | Compose screens, screen state, and ViewModels |
| `sensorhub-android-app/src/org/sensorhub/android/ui/components/` | Shared Compose controls |
| `sensorhub-android-app/src/org/sensorhub/android/ui/navigation/` | Routes and navigation graph |
| `sensorhub-android-app/src/org/sensorhub/android/config/SensorHubConfigFactory.kt` | Builds sensor, transport, client, and service configuration |
| `sensorhub-android-app/src/org/sensorhub/android/data/servers/` | Server profiles, persistence, and connection testing |
| `sensorhub-android-app/res/` | Strings and other Android resources |
| `sensorhub-android-service/` | Android foreground service and SensorHub lifecycle |
| `sensorhub-driver-android/` | Built-in device sensor drivers |
| `submodules/osh-core/` and `submodules/osh-addons/` | OSH framework, services, and additional drivers |

Paths below beginning with `ui/`, `config/`, or `data/` are relative to `sensorhub-android-app/src/org/sensorhub/android/`.

## Adding a new sensor driver

Adding a sensor requires connecting its driver to the Compose sensor screen, saved settings, runtime configuration, and Dashboard. The example below uses a new module named `sensorhub-android-example`.

### 1. Choose the driver approach

Before creating a module, determine whether a suitable driver already exists in `osh-addons` or another driver repository.

| Sensor type | Starting point |
| --- | --- |
| Existing OSH driver | Reuse its configuration and outputs after checking that its dependencies and transport work on Android. |
| Built-in Android sensor | Review `sensorhub-driver-android`, which accesses device sensors through Android APIs. Extend that module when the sensor belongs in the existing on-device sensor system. |
| External Bluetooth, USB, or network device | Reuse a compatible driver or create an Android driver module with the required transport. |

The following example creates a separate driver module. When extending the built-in Android sensor module, wire the new preference into its existing sensor configuration and output selection instead.

### 2. Create and include the module

Copy `sensorhub-android-template` into the repository root as `sensorhub-android-example`. Copy source and configuration files, excluding generated directories such as `build/`.

Update the copied module:

- Rename the Java package and Android namespace from `org.sensorhub.impl.sensor.template` to `org.sensorhub.impl.sensor.example`.
- Rename `TemplateConfig` to `ExampleConfig` and update references in `Sensor` and `Descriptor`.
- Update the module description, descriptor metadata, sensor UID prefix, and XML identifier so they identify the new driver.
- Update `src/main/resources/META-INF/services/org.sensorhub.api.module.IModuleProvider` to name the new descriptor class:

```text
org.sensorhub.impl.sensor.example.Descriptor
```

The current root `settings.gradle` discovers local modules containing `build.gradle`. Add the new dependency inside the app's existing `dependencies` block:

```groovy title="sensorhub-android-app/build.gradle"
implementation project(':sensorhub-android-example')
```

For an existing `osh-addons` driver, add its relative module path to the `osh-addons` list in `settings.gradle` if it is not already included. Then add its project dependency to the app or `sensorhub-android-lib`, following the existing dependency structure.

Sync Gradle in Android Studio.

### 3. Implement the driver

The template provides four main classes:

| Class | Responsibility |
| --- | --- |
| `ExampleConfig` | Store configuration and set `moduleClass` to the driver implementation. |
| `Sensor` | Initialize outputs, connect to the hardware, collect readings, and release resources. |
| `Output` | Describe observation fields and encoding, populate records, and publish `DataEvent` instances. |
| `Descriptor` | Identify the driver and its configuration class for module discovery. |

Replace the template's sample text generator with actual sensor acquisition. Give each output a meaningful name and define its timestamp, fields, units, and encoding. Match the reported sampling period to the actual collection interval.

Implement startup, shutdown, and connection reporting for your device. Close transports, unregister listeners, and stop worker threads when the module stops. In the current template, `doStop()` does not stop the sample processing loop; correct that lifecycle behavior in the new driver before using it as an integration.

If your driver needs a device address or sampling interval, define those fields in `ExampleConfig` and use them in the driver. A setting only affects the hardware after the runtime configuration passes it through and the driver consumes it.

### 4. Add the Compose sensor entry

The sensor screen is generated from `ALL_SENSORS` in:

```text
sensorhub-android-app/src/org/sensorhub/android/ui/screens/sensors/SensorsContract.kt
```

Add an entry to that list:

```kotlin
SensorItem(
    id = "example",
    prefKey = "example_enabled",
    nameRes = R.string.sensor_example,
    summaryRes = R.string.summary_example,
    category = SensorCategory.OTHERS,
),
```

Add the referenced strings:

```xml title="sensorhub-android-app/res/values/strings.xml"
<string name="sensor_example">Example Sensor</string>
<string name="summary_example">Collect readings from the example sensor</string>
```

`SensorsViewModel` initializes toggle state from `ALL_SENSORS`, and `SensorsScreen` renders the switch and saves changes through `toggleSensor()`. A sensor needing only an enable switch requires no new screen or ViewModel method.

Use the appropriate category: `ON_DEVICE`, `BLUETOOTH`, `USB`, or `OTHERS`.

#### Optional: add Bluetooth device selection

For a Bluetooth device, use this entry instead of the basic entry above:

```kotlin
SensorItem(
    id = "example",
    prefKey = "example_enabled",
    nameRes = R.string.sensor_example,
    summaryRes = R.string.summary_example,
    category = SensorCategory.BLUETOOTH,
    config = SensorConfig.BluetoothDevice(
        selectLabelRes = R.string.title_select_device,
        addressPrefKey = "example_device_address",
    ),
),
```

Also add `"example_device_address"` to `BT_ADDRESS_PREF_KEYS` in the same file. The app uses this list to initialize saved address state and route device-selection dialogs.

`SensorConfig` in this snippet is the Compose UI configuration type from `SensorsContract.kt`. It is separate from the OSH driver configuration class.

The selector saves a value; it does not implement the connection. Check `BluetoothScanner.kt` and the selected value's format against your driver's requirements. Adapt the selection flow if the peripheral needs a different discovery method or identifier.

#### Optional: add other settings

For driver-specific controls, add a configuration type to the sealed `SensorConfig` class and handle it in `SensorListItem` in `SensorsScreen.kt`.

For a choice selector, define its values and default in `CHOICE_DIALOGS` and add a Compose control that opens that preference's dialog. Use `SensorsViewModel.setStringPref()` for string settings. Adding a choice definition alone does not render a control.

Keep preference keys and defaults consistent between the UI and runtime configuration. Validate numeric settings before using them to configure the driver.

### 5. Create the runtime configuration

Open:

```text
sensorhub-android-app/src/org/sensorhub/android/config/SensorHubConfigFactory.kt
```

Import the new driver configuration:

```kotlin
import org.sensorhub.impl.sensor.example.ExampleConfig
```

Add the following block alongside the existing driver blocks, before the outbound clients are configured. This example assumes `ExampleConfig` retains the template's `uid_extension` field:

```kotlin
if (prefs.getBoolean("example_enabled", false)) {
    val exampleConfig = ExampleConfig()
    exampleConfig.id = "EXAMPLE_SENSOR"
    exampleConfig.name = "Example Sensor [$deviceName]"
    exampleConfig.autoStart = true
    exampleConfig.lastUpdated = sensorsLastUpdated
    exampleConfig.uid_extension = prefs.getString("uid_extension", "")

    config.add(exampleConfig)
}
```

For a Bluetooth integration, also read `example_device_address` and assign it to the actual field defined by your driver configuration. If the driver needs an OSH communication module, create and register that transport and reference its ID from the sensor configuration. Follow a driver with the same transport, such as Kestrel for the existing BLE network pattern or TruPulse for the Bluetooth stream pattern.

Do not assume every driver has `btAddress`, `networkID`, or `androidContext` fields. Use the fields required by the driver you are integrating, and avoid duplicate transport module IDs when multiple sensors are enabled.

#### Enable outbound client creation

Add the new preference to the existing boolean expression in `isAnySensorEnabled()`:

```kotlin
|| prefs.getBoolean("example_enabled", false)
```

This is necessary for the app to create outbound server clients when the new sensor is the only enabled sensor. The current workflow uses enabled server profiles; it does not require a legacy `sensor_options` or `PUSH_REMOTE` preference.

### 6. Connect the Dashboard and permissions

In `ui/screens/dashboard/SensorCards.kt`, add the new sensor to the existing mapping from sensor IDs to module IDs:

```kotlin
"example" to "EXAMPLE_SENSOR",
```

The key must match `SensorItem.id`, and the value must match the module ID assigned in `SensorHubConfigFactory`. This lets the Dashboard associate the sensor card with its runtime module and readings.

Review the generic output formatting for your observation structure. If you are extending the built-in Android sensor module, also update the per-sensor output selection in `SensorCards.kt` so the card displays the intended output.

Declare any additional Android permissions in the appropriate manifest and handle required runtime permission requests. Review the existing startup permission flow in `DashboardScreen.kt` and Bluetooth scanning permissions in `SensorsScreen.kt`. USB devices may also require a device-specific authorization flow.

### 7. Build and test the integration

From the repository root, build and install the app:

```bash
./gradlew :sensorhub-android-app:assembleDebug
./gradlew :sensorhub-android-app:installDebug
```

On the target device:

1. Open **Sensors** and confirm the new entry appears in its category.
2. Enable it, configure its connection, and confirm settings persist after reopening the app.
3. Enable a server profile using the [configuration guide](config.md).
4. Start streaming from **Dashboard** and verify status, readings, timestamps, and units.
5. Confirm the receiving server registers the system and receives observations. Test with only the new sensor enabled to check outbound client creation.
6. Stop streaming and verify collection stops and resources are released. Start another run to check restart behavior.
7. Test missing permissions, unavailable hardware, and disconnection or reconnection where applicable. Confirm failures produce useful status or log messages.

Test each remote protocol you intend to support. A working sensor switch and a successful build are only the first checks; verify actual observations on the device and the receiving server.

## Adding a new OSH service

An OSH service is a module running inside SensorHub, such as the local Connected Systems API, SOS, or discovery service. The Android foreground `SensorHubService` hosts the hub and manages its lifecycle. Adding a local OSH service normally means registering another module in that hub.

### 1. Include the service module

Reuse an Android-compatible service from `osh-core` or `osh-addons`, or implement a new OSH module. Include its project through `settings.gradle` and add the app or shared-library dependency, following the same module inclusion approach used for drivers.

Check the service's dependencies, configuration class, startup requirements, and resource cleanup. For HTTP services, review how the existing services use the embedded HTTP server on port `8585` and choose an endpoint that does not conflict with `/api` or `/sos`.

### 2. Add service settings

The Settings screen currently uses `ServersState` in `ui/screens/settings/SettingsContract.kt`. Add a field inside that data class:

```kotlin
val exampleServiceEnabled: Boolean = false,
```

In `SettingsViewModel.kt`, load the matching preference in the existing `ServersState(...)` initialization:

```kotlin
exampleServiceEnabled = prefs.getBoolean("example_service", false),
```

Add a setter to persist changes and update the observable state:

```kotlin
fun setExampleServiceEnabled(enabled: Boolean) {
    prefs.edit().putBoolean("example_service", enabled).apply()
    _state.value = _state.value.copy(exampleServiceEnabled = enabled)
}
```

In the existing service settings card in `SettingsScreen.kt`, add:

```kotlin
OSHSwitchRow(
    title = stringResource(R.string.enable_example_service),
    subtitle = stringResource(R.string.summary_example_service),
    checked = state.exampleServiceEnabled,
    onCheckedChange = { viewModel.setExampleServiceEnabled(it) },
)
```

Define the labels in `sensorhub-android-app/res/values/strings.xml`:

```xml
<string name="enable_example_service">Example Service</string>
<string name="summary_example_service">Enable the example service on this device</string>
```

For additional options, add corresponding state, persistence, validation, and Compose controls. Use the same defaults in the ViewModel and runtime configuration.

### 3. Register the service at runtime

Add a configuration block in the services section of `config/SensorHubConfigFactory.kt`, before it returns the completed configuration.

The following is a pattern for your own service classes: `ExampleService` and `ExampleServiceConfig` must be implemented or replaced with the actual service types and imported first.

```kotlin
if (prefs.getBoolean("example_service", false)) {
    val serviceConfig = ExampleServiceConfig()
    serviceConfig.moduleClass = ExampleService::class.java.canonicalName
    serviceConfig.id = "EXAMPLE_SERVICE"
    serviceConfig.name = "Example Service"
    serviceConfig.autoStart = true

    // Set any additional fields required by this service.
    config.add(serviceConfig)
}
```

Keep service registration outside the `isAnySensorEnabled()` condition; that condition controls outbound sensor clients. Configure dependencies and exposed resources according to the service's own API.

Settings are applied when SensorHub builds a new configuration. Document that users must stop and restart streaming after changing them. Avoid blocking network or hardware work in Compose callbacks; configuration creation already has side effects and must remain off the main thread.

### 4. Verify the service

Enable the service, start a run, and verify module startup and its expected behavior. For an HTTP service, call its endpoint from a reachable client and check the response. Verify disabled behavior, invalid settings, startup errors, and repeated stop/start cycles. Confirm existing services still work when the new service is enabled alongside them.

## Adding an app feature or screen

### 1. Define screen state and behavior

Create the feature under `ui/screens/<feature>/`, following the existing pattern:

- A contract file for UI state and related types.
- A ViewModel for state updates, validation, and application operations.
- A Compose screen that renders state and sends user actions to the ViewModel or navigation callbacks.

Use the shared controls in `ui/components/` and styles in `ui/theme/`. Store user-facing text in Android string resources and update translations where available.

Keep transient UI state, such as whether a dialog is open, separate from persisted configuration. Use the existing persistence pattern for the kind of setting being added: simple sensor and service preferences use `SharedPreferences`, while remote destinations use `ServerProfileRepository`. Reuse the established credential-storage path for server secrets.

Run network and hardware operations outside composition and off the main thread. Expose loading, success, and error state to the UI, and release listeners or resources when their owner is disposed or stopped.

### 2. Add navigation

For a new destination, add a route inside the sealed `Screen` class in `ui/navigation/Screen.kt`:

```kotlin
object Example : Screen("example_screen")
```

Register it inside the existing `NavHost` in `ui/navigation/OSHNavHost.kt`. This assumes you have created and imported a composable named `ExampleScreen` with an `onBackClick` callback:

```kotlin
composable(Screen.Example.route) {
    ExampleScreen(
        onBackClick = { navController.popBackStack() },
    )
}
```

Add an entry point from the relevant screen and pass a navigation callback from the host:

```kotlin
onNavigateToExample = { navController.navigate(Screen.Example.route) }
```

Add the matching callback parameter and clickable control to that screen. Update `Navbar.kt` only if the feature needs a top-level navigation tab. A detail screen can be opened from an existing tab.

### 3. Connect the feature to SensorHub when needed

A UI-only feature may need no runtime module changes. If the feature changes collection or service behavior, persist its configuration and consume it in `SensorHubConfigFactory` or the owning driver or service. If it displays live data, follow the existing service connection and Dashboard read paths rather than starting another hub from the screen.

When extending remote-server behavior, review all affected layers: the profile contract, repository, form state and validation, connection test, and client construction. A field added to a form needs to survive saving and be passed to the client that uses it.

### 4. Verify the feature

Check navigation and Back behavior, validation, loading and error states, and persistence after reopening the app. For runtime features, also verify behavior before streaming, during an active run, and after stopping or restarting. Check longer translated labels, scrolling, and accessibility descriptions for icon-only controls.

## Validation and documentation

Build using the [Build Guide](build.md). Add focused tests for new parsing, validation, configuration decisions, or lifecycle behavior where they provide useful coverage. The app's local unit tests belong in `sensorhub-android-app/tests/` and can be run with:

```bash
./gradlew :sensorhub-android-app:testDebugUnitTest
```

Use a physical device for sensor, permission, Bluetooth, USB, and foreground-service behavior. Review Logcat for relevant module errors and verify actual data delivery when the change affects streaming.

Update the [configuration page](config.md) and relevant driver or service documentation with supported hardware, required settings, and restart behavior. Keep example module names and incomplete integrations clearly identified in documentation.
