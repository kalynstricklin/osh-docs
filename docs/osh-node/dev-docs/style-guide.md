---
title: OSH Sensor Style Guide
sidebar_position: 0
---
# OSH Sensor Style Guide

## 1. Purpose and scope

This guide establishes consistent conventions for OpenSensorHub (OSH) sensor driver structure, configuration, sensor identity, SWE Common outputs, lifecycle management, connectivity, controls, SensorML, testing and documentation.

An OSH sensor driver should be maintainable, resilient to communication failures, lifecycle safe, and interoperable through OGC Sensor  Web Enablement (SWE) standards.

OSH supports sensors and actuators over a range of interfaces, including serial, USB, Ethernet, Wi-Fi, Bluetooth, and HTTP. A sensor driver should separate transport-specific logic from the data and control interfaces exposed to OSH.


## 2. Project Structure and Naming Conventions

### 2.1 Standard Driver Structure
A typical OSH Sensor driver is organized as follows:

```text
src/
├── main/
│   ├── java/org/sensorhub/impl/sensor/<name>/
│   │   ├── <Name>Sensor.java
│   │   ├── <Name>Config.java
│   │   ├── <Name>Output.java
│   │   ├── <Name>Control.java
│   │   ├── <Name>Descriptor.java
│   │   └── ...
│   └── resources/META-INF/services/
│       └── org.sensorhub.api.module.IModuleProvider
└── test/java/org/sensorhub/impl/sensor/<name>/
    └── Test<Name>Parser.java
```

Not all drivers require every class. For example, read-only sensors may  omit a control class, and simple drivers may implement parsing directly without a separate parser class.

### 2.2 Class Naming
Use consistent suffixes for driver classes.

| Responsibility          | Convention                           | Example                                                   |
|-------------------------|--------------------------------------|-----------------------------------------------------------|
| Sensor module           | `<Name>Sensor`                       | `AxisCameraSensor`                                        |
| Configuration           | `<Name>Config`                       | `AxisCameraConfig`                                        |
| Data output             | `<Name>Output` or `<Purpose>Output`  | `AxisCameraOutput` or `AxisVideoOutput` & `AxisPtzOutput` |
| Command input           | `<Name>Control` or `<Action>Control` | `PtzControl`                                              |
| Module descriptor       | `<Name>Descriptor`                   | `AxisCameraDescriptor`                                    |
| OSGi activator, if used | `Activator`                          | `Activator`                                               |

Some existing drivers use a Driver suffix, but the majority use Sensor. New drivers should follow the Sensor convention unless a project requires otherwise.

### 2.3 Package Names
- Package names must be lowercase.

- Open-source drivers should use the following namespace:
  `org.sensorhub.impl.sensor.<name>`.

- Organization-specific drivers may use an established namespace, such as
  `org.georobotix.impl.sensor.<name>`.

### 2.4 Field And Method Names
Java fields and methods use `camelCase`.

```java
// Good
private long lastMessageTime;
private int reconnectAttempts;

public void publishWeatherData() {}

// Bad
private long LastMessageTime;
private int reconnect_attempts;

public void PublishWeatherData() {}
```

### 2.5 Output and Field Names
Output names and SWE field names MUST be descriptive and use `camelCase`.
```java
// Good 
super("location", parent);
super("platformAltitude", parent);
super("weatherObservation", parent);

// Bad 
super("plat_alt", parent);
super("platformAtt", parent);
super("data", parent);
super("output", parent);
```

Names should describe the physical measurement, observation, or function rather than the transport protocol or implementation detail.

- Output names in SWE Schema should follow `lowerCamelCase`.
- Definitions should be `UpperCamelCase`
- Labels should be
```java
.addField("windSpeed", fac.createQuantity()
    .definition(SWEHelper.getCfUri("WindSpeed"))
    .label("Wind Speed")
    .uomCode("m/s"))
```


## 3. Sensor Identity
A physical sensor should have a stable, unique identifier across restarts.

When a reliable hardware serial number exists, the driver should derive its UID from that identifier and a consistent namespace.

```java
generateUniqueID("urn:osh:sensor:georobotix:weather:", config.serialNumber);
generateXmlID("WEATHER", config.serialNumber);
```
The recommended UID pattern is:

`urn:osh:sensor:<organization>:<sensor-identifier>`

The namespace and identifier format must be consistent with the organization's identity conventions.

Drivers must not generate a new random UID on every initialization when doing so would change the identity of the same physical sensor.


## 4. Configuration Metadata and Validation

### 4.1 Configuration Classes
Configuration classes should extend the appropriate OSH configuration base class, `SensorConfig`.

Configuration classes must contain user-configuratble settings rather tahn runtime state. It MUST NOT be used to store live sockets, device connections, threads, or other transient resources.

```java
// Good
@DisplayInfo(
    label = "Reconnect Period",
    desc = "Delay in milliseconds between connection attempts"
)
public long reconnectPeriod = 5000;

// Bad
public Thread readerThread;
public DeviceConnection connection;
public Socket socket;
```

### 4.2  Configuration UI Metadata
Every user-facing configuration field must have appropriate descriptive metadata so that OSh can present a meaningful admin interface.

Labels should be concise, and descriptions should explain what the field configures, including units or constraints where relevant.

**Required text**
Use the required field annotation
```java
@DisplayInfo.Required
@DisplayInfo(label = "Serial Number", desc = "Device serial number")
public String serialNumber;
```

**Single-line and multiline text:**
Use a single-line text field for short values such as identifiers. Use a multiline text field when the value is expected to contain longer text.
```java
// todo add single line

// todo add multiline
```

**Remote network address:**
```java
@DisplayInfo(label = "IP Address", desc = "Address of the remote device")
@DisplayInfo.FieldType(DisplayInfo.FieldType.Type.REMOTE_ADDRESS)
@AddressType(NetworkType.IP)
public String remoteAddress;

@DisplayInfo(label = "IP Address", desc = "IP of local network interface to bind to")
@DisplayInfo.FieldType(DisplayInfo.FieldType.Type.LOCAL_ADDRESS)
@AddressType(NetworkType.IP)
public String ip;
```
Supported address types may include IP, Ethernet, Wi-Fi, cellular, Bluetooth, BLE, Zigbee, VPN.

**Password:**
```java
@DisplayInfo(label = "Password", desc = "Authentication password")
@DisplayInfo.FieldType(DisplayInfo.FieldType.Type.PASSWORD)
public String password;
```
Credentials must not be logged or exposed in error messages.

**Port range:**
```java
@DisplayInfo(label = "UDP Listen Port", desc = "Local UDP port")
@DisplayInfo.ValueRange(min = 0, max = 65535)
public int udpListenPort = 14550;
```
The valid port range must reflect the actual requirements, A value of zero should be allowed only when the transport supports dynamically assigned ports.

**Module references:**
```java
@DisplayInfo.Required
@DisplayInfo.ModuleType(IObsSystemDatabase.class)
@DisplayInfo.FieldType(DisplayInfo.FieldType.Type.MODULE_ID)
@DisplayInfo(label = "Database Module Id", desc = "The module id of the data store module to use as the archived data store to read from")
public String moduleId;
```

**System UIDs:**
```java
@DisplayInfo.Required
@DisplayInfo.FieldType(DisplayInfo.FieldType.Type.SYSTEM_UID)
@DisplayInfo(label = "System Unique Id", desc = "The unique id of the system for which archive data is to be transferred")
public String uniqueId;
```

**Table or structured selection:**
```java
@DisplayInfo.Required
@DisplayInfo.FieldType(DisplayInfo.FieldType.Type.TABLE)
@DisplayInfo(label = "Protocol Scheme", desc = "The protocol scheme to use to stream video in native formats")
public Scheme scheme;
```

Other OSH metadata field types include local addresses, module IDs, system UIDs, and tables. Apply them only when appropriate for the value.

### 4.3 Defaults
Optional settings should have sensible defaults.

```java
@DisplayInfo(label = "Reconnect Period", desc = "Delay in milliseconds between connection attempts")
public long reconnectPeriod = 5000;
```
Defaults must not silently produce unexpected behavior.

### 4.4 Configuration Validation
Drivers MUST validate required fields and basic constraints during `doInit()` before opening network connections or acquiring hardware resources. Errors should name the invalid field and explain what is expected.

```java
@Override
protected void doInit() throws SensorHubException {
    super.doInit();

    if (config.commSettings == null) {
        throw new SensorHubException("Communication settings must be specified");
    }
    if (config.serialNumber == null || config.serialNumber.isBlank()) {
        throw new SensorHubException("Serial number must be specified");
    }
}
```
Validation should cover:
- Required values and empty strings
- Numeric ranges and timeout values
- File paths and URL syntax
- Credential requirements
- Transport constraints
- Mutually dependent configuration fields

Security-sensitive values must not be included in validation error messages.


## 5. SWE Common Schemas and Semantic Definitions

### 5.1 Output Classes
Every data output must extend the appropriate OSH output implementation, `AbstractSensorOutput<SensorType>`

Each output must expose SWE Common `DataComponent` describing the structure and meaning of its observations.

The specific output base class and publication API must be selected based on the target OSH version and the data being published.

### 5.2 SWE Builder API
Drivers should use the SWE Builder API and available OSH helpers to construct the schemas:

```java
dataStruct = fac.createRecord()
    .name("windObservation")
    .definition(SWEHelper.getPropertyUri("WindObservation"))
    .addField("time", fac.createTime().asSamplingTimeIsoUTC().build())
    .addField("windSpeed", fac.createQuantity()
        .definition(SWEHelper.getPropertyUri("WindSpeed"))
        .label("Wind Speed")
        .description("Measured wind speed at sensor height")
        .uom("m/s")
        .build())
    .build();
```
The example illustrates schema conventions.

### 5.3 Required Field Metadata
Each SWE field should include the following metadata:

| Property        | Requirement                                            |
|-----------------|--------------------------------------------------------|
| Name            | Required for identifiable record/field structure       |
| Definition      | Use a meaningful, stable semantic definition           |
| Label           | Should provide a human-readable name                   |
| Description     | Should explain the represented value                   |
| Unit of measure | Must be specified for physical quantities              |
| Allowed values  | Should be specified for constrained categorical values |

Definition URIs must be semantically appropriate. A field must not reuse an ontology definition that misrepresents its data.

If a measurement is unavailable, the driver must represent it consistently with the declared schema and encoding rather than publishing a fabricated zero value.

### 5.4 SWE Common Type Selection
Drives must select SWE Common types according to the meaning of the data.

| Type       | Use for                           | Example                 |
|------------|-----------------------------------|-------------------------|
| `Quantity` | Continuous measurement with units | Temperature, wind speed |
| `Count`    | Discrete integer                  | Packet count            |
| `Category` | Value from a defined vocabulary   | Alarm level             |
| `Boolean`  | True/false state                  | Tamper detected         |
| `Text`     | Free-form text                    | Status message          |
| `Time`     | Timestamp                         | Sampling time           |

Examples
- temperature --> Quantity
- packetCount --> Count
- alarmLevel --> Category
- connected --> Boolean
- statusMessage --> Text
- samplingTime --> Time

The selected type must be compatible with the actual data and its encoding.

### 5.5 Semantic Definitions and Ontologies
Use the appropriate OSH ontology helper where available.

| Ontology         |   | Use When:                                                                 |
|------------------|:--|---------------------------------------------------------------------------|
| getEpsgUri()     |   | Coordinate reference systems and spatial reference definition             |
| getQudtUri()     |   | Quantities and units represented by QUDT                                  |
| getCfUri()       |   | Climate, forecast, atmospheric properties defined by CF conventions       |
| getDBpediaUri()  |   | General concepts when an appropriate definition exists                    |
| getPropertyUri() |   | Other properties not represented by a more appropriate available ontology |

Developers should prefer stable, semantic defintiions where available. A fallback property URI must not misrepresent the meaning of the field.

### 5.6 Predefined OSH Helpers
Drivers should use existing helpers such as SWEHelper, GeoPosHelper, VideoCamHelper, SMLHelper, RasterHelper, VectorHelper, RadHelper, or other domain-specific helpers where appropriate.

For example, spatial data should use an appropriate predefined structure rather than manually recreating a standard representation.

```java
GeoPosHelper geo = new GeoPosHelper();

dataRecord.addField("location", geo.createLocationVectorLLA().build());
```


## 6. Output and Control Registration
Outputs and control inputs must be created and registered during initialization so OSH can discover their interface before the module starts streaming.

```java
@Override
public void doInit() throws SensorHubException {
    super.doInit();
    // Validate configuration and intitialze module metadata.
    
    weatherOutput = new WeatherOutput(this);
    addOutput(weatherOutput, false);
    weatherOutput.doInit();

    ptzControl = new PTZControl(this);
    addControlInput(ptzControl);
}
```

### 6.1 Status vs Data Outputs
The boolean argument to `addOutput(output, boolean)` distinguishes status outputs from observation outputs.

```java
addOutput(weatherOutput, false);
addOutput(deviceStatusOutput, true);
```

Use the `false` flag for observation data and `true` for status outputs.
Drivers should expost status outputs when they provide useful device or operational status information. They must not misrepresent ordinary measurements as module status.


## 7. Lifecycle
OSH modules have distinct initialization, start, stop, and cleanup phases. Driver must keep their responsibilities separate.

| Phase       | Expected responsibilities                                                                                                       |
|-------------|---------------------------------------------------------------------------------------------------------------------------------|
| `doInit()`  | Validate config, establish identity, create SensorML metadata, register outputs and controls                                    |
| `doStart()` | Establish required connections, start reading/subscribing, and begin publishing when ready                                      |
| `doStop()`  | Stop polling and subscriptions, release device and network resources, cancel tasks, and leave the sensor module safe to restart |
| `cleanup()` | Release any remaining resources not released during the stop path                                                               |                                                              |

### 7.1 Connection Policy
For a sensor module that requires a live device to operate, do not report a successful operational start when the device is unreachable.
Whether `doStart()` blocks, throws a `SensorHubException`, or transitions through a reconnecting state depends on the intended module behavior and OSH version. Document the policy and ensure module state matches actual readiness.

### 7.2 Startup Observations
Drivers must not publish device measurements during doInit()
Register listeners and start accepting data in the appropriate start phase, or gate callbacks until the sensor module is started.

### 7.3 Restartability
A driver must tolerate the supported lifecycle sequence.
Repeated stop operations and failed startup must leave the driver in a safe state. Drivers must not create duplicate listeners, stale connections or competing

### 7.4 Connectivity and isConnected()
`isConnected()` must reflect the actual connection or readiness state of the driver. It must not return `true` unconditionally.

```java
@Override
public boolean isConnected() {
    return deviceConnection != null && deviceConnection.isOpen();
}
```

The `isOpen()` method is illustrative and must be replaced with actual health check.
A socket existing in memory is not necessarily evidence that the remote sensor is responsive. For push-only or connectionless transports, document the chosen readiness signal (for example, recent heartbeat or last valid packet).


## 8. Connectivity, RobustConnection, and Recovery
Drivers must have defined policy for connection failures and recovery.

### 8.1 Robust Connection

### 8.2 Recovery

## 9. Threading and Callback Safety


## 10. Logging, Status, and Error Handling
Drivers should use the appropriate mechanism for the intended audience.

| Mechanism                | Purpose                                                   |
|--------------------------|-----------------------------------------------------------|
| `getLogger().debug(...)` | Detailed developer diagnostics                            |
| `getLogger().info(...)`  | Significant normal lifecycle events                       |
| `reportStatus(...)`      | Current user-visible module status                        |
| `reportError(...)`       | Module-level failure requiring attention                  |
| `clearError()`           | Clear a previously reported error after verified recovery |

Examples:
```java
getLogger().debug("Received packet of {} bytes", packetLength);
getLogger().info("Connected to sensor at {}:{}", host, port);
reportStatus("Connecting to sensor...");
reportError("Cannot reach sensor", exception, true);
```

Drivers should:
- Use parameterized logging
- Include actionable diagnostic context
- Avoid excessive info logs
- Report user relevant connection adn recovery states
- Distinguish expected communication failures from unrecoverable module failures.

Drivers must not log passwords, access tokens, raw authentication headers or sensitive device payloads.

An error must not be cleared until the underlying condition has actually recovered.


## 11. Observation Publishing
Publish observations should only happen after the module has started and the relevant output has been initialized and registered.
The published data must match the output's SWE schema and encoding.

```java
eventHandler.publish(new DataEvent(latestRecordTime, Output.this, dataBlock));
```

### 11.1 How often to publish
This depends on how often the sensor receives data to be published. Read the spec.


## 12. Control Inputs and Command Execution
For sensors with commands or actuators, create a dedicated control interface with a defined SWE command schema.

- Validate command parameters, units, bounds, and enumerated values.
- Reject unsupported commands with meaningful errors.
- Distinguish command acceptance from successful device execution.
- Handle timeouts, acknowledgements, and device-reported failures.
- Serialize mutually exclusive commands when the hardware requires it.
- Avoid allowing command execution after module shutdown.
- Do not silently retry non-idempotent commands without considering duplicate actuation.

For a PTZ camera, for example, a preset command should validate the requested preset and report whether the device accepted or executed the request according to its protocol.


## 13. Module Discovery and Packaging.
Provide a descriptor implementing the module-provider contract expected by your OSH version and register it using Java's service-provider mechanism:

```text
src/main/resources/META-INF/services/org.sensorhub.api.module.IModuleProvider
```


## 14. SensorML Metadata and Position
`updateSensorDescription()` should describe the physical sensor or system.

Include verified information when available:
- Manufacturer, model, and serial number.
- Hardware and firmware versions.
- Stable identifiers and meaningful classifiers.
- Physical characteristics and capabilities.
- Position, orientation, and other relevant metadata.
- Input/output and command interfaces represented consistently with the sensor module.

Call `notifyNewDescription()` when the description changes at runtime.

### 14.1 Features of Interest

### 14.2 Static vs Moving Features


## 15. Security
### 15.1 Credentials and Secrets
### 15.2 Network Communication
### 15.3 Incoming Data
### 15.4


## 16. Testing and Acceptance Criteria
Every driver must include automated tests appropriate to its functionality. At minimum, tests should cover the following areas.

| Area          | Expected tests                                                                             |
|---------------|--------------------------------------------------------------------------------------------|
| Configuration | Missing required values, invalid ranges, sensible defaults                                 |
| Parsing       | Valid frames, truncated frames, corrupt frames, endianness, signed values, sentinel values |
| SWE schema    | Field names, definitions, units, encoding and data compatibility                           |
| Lifecycle     | Initialize, start, stop, restart, repeated stop, failed startup                            |
| Connectivity  | Device unavailable at start, disconnect during streaming, reconnect, timeout               |
| Publishing    | No observations before start or after stop; correct timestamps and units                   |
| Controls      | Valid command, invalid command, timeout, device rejection                                  |
| Cleanup       | No duplicate listeners, leaked sockets, lingering tasks or threads                         |
| Security      |                                                                                            |
| Discovery     |                                                                                            |


## 17. README and Operational Documentation
Each driver must include a README that allows another developer or operator to configure and run it without knowing how the driver works.

The README must document:
1. Purpose and supported device capabilities
2. Tested and verified hardware models and firmware versions
3. Hardware wiring, pairing, network, and authentication prerequisites, where applicable
4. Configuration examples using safe placeholder credentials.
5. Known limitations and troubleshooting steps
6. How to run tests and reproduce sample data.


## 18. Versioning and Compatibility
Drivers should use Semantic Versioning for releases.
The recommended version format is: `MAJOR.MINOR.PATCH`

| Version | Example | Meaning                           |
|---------|---------|-----------------------------------|
| Major   | 1.0.0   | Breaking changes                  |
| Minor   | 0.1.0   | Backward compatible functionality |
| Patch   | 0.0.2   | Backward compatible bug fixes     |

New drivers must start at 0.0.1 when following the initial-release policy.

Breaking changes must be documented in release notes.

Examples of breaking changes (Major)
- Output schema changing (field names/ uom/)
  Examples of added functionality (Minor)
-
Examples of bug fixes (Patch)
- Output schema changing (label/ definition)
