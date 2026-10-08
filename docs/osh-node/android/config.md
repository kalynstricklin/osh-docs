---
title: Configuring OSH Android
sidebar_position: 2
---

Set up a server profile, enable sensors, and stream observations from your Android device to an OpenSensorHub server.

# Configuring OSH Android

To stream sensor data to an OpenSensorHub server, create a server profile, enable the sensors you want to use, and start a run from the Dashboard.

## Before you begin

You will need:

- OpenSensorHub installed on your Android device.
- A running OSH server reachable from the device.
- The server's complete Connected Systems API or SOS-T endpoint URL.
- Any credentials required to register sensors and send observations.

The steps below describe the current app interface. If a run is already active, stop streaming before changing its configuration.

## 1. Set up a server profile

A server profile stores the destination and authentication settings used to send data to an OSH server.

### Add a destination

1. Open the **Settings** tab.
2. Tap **Manage Servers** to open **Server Profiles**.
3. Tap the **+** button to create a profile.
4. Choose the client that matches the receiving server:
    - **CS API Client** for the Connected Systems API.
    - **SOS-T Client** for the Sensor Observation Service transactional interface.
5. Enter a **Server name**, such as `Field Operations`.
6. Enter the full **Connection URL**, including `http://` or `https://`, the server address, any required port, and the service path.

For example, a server hosting the Connected Systems API at `/sensorhub/api` on port `8181` would use:

```text
http://192.168.1.100:8181/sensorhub/api
```

This is an example only. Use the endpoint supplied by your server administrator; the port and path depend on the deployment. When connecting to a server on another computer, use that computer's reachable address. `localhost` and `127.0.0.1` refer to the Android device itself.

### Configure authentication

If the server uses a username and password, enter them in the **Authentication** section. Leave these fields empty if authentication is not required.

For a Connected Systems server using OAuth, turn on **Enable OAuth** and enter the token endpoint, client ID, and client secret supplied for your deployment.

### Test and enable the profile

1. Tap **Test Connection** and review the result. If it fails, check the URL, network connection, and authentication settings.
2. Tap **Add Server** to save the new profile.
3. In **Server Profiles**, make sure the switch beside the profile is on.

You can enable multiple profiles to send data to multiple destinations. Turn off any profiles that should not receive data from the next run. To edit an existing profile, tap its card, update its settings, and tap **Save changes**.

A successful connection test confirms that the endpoint responds successfully with the configured authentication. Verify observation delivery after starting a run, because the test does not check sensor registration or permission to write observations.

The **Connected Systems Service** and **SOS Service** switches on the Settings screen control services hosted on the Android device. They do not need to be enabled to send data to a remote server through a profile.

## 2. Enable sensors

1. Open the **Sensors** tab.
2. Turn on each sensor you want to collect data from.
3. Configure the options shown for the selected sensors:
    - **Location:** Enable GPS or network location as needed, and make sure Android location services are on.
    - **Camera:** Select the camera, resolution, frame rate, and supported video codec.
    - **Microphone:** Configure the audio settings. Use AAC with the current app interface.
    - **Bluetooth peripherals:** Select the appropriate device and complete pairing in Android settings if the peripheral requires it.
4. Grant the Android permissions requested for the features you use, such as location, camera, microphone, or nearby-device access.

Available readings depend on the device's hardware and the integrations supported by your app build. Start with a built-in sensor, such as the accelerometer, to check the basic workflow before adding peripherals.

Network location is a source of position readings. It does not need to be enabled to transmit other sensors' data over the network.

## 3. Start streaming

1. Open **Dashboard**.
2. Tap **Start Streaming**.
3. Enter a **Run name**, such as `Site survey 01`. The name must not be empty.
4. Tap **Start Streaming** in the dialog and approve any requested permissions.

The app starts SensorHub as a foreground service, loads the selected sensors, and starts the clients for enabled server profiles.

### Verify the stream

On the Dashboard, inspect sensor readings and module status. Use the **Needs attention** filter to find modules reporting problems.

On the receiving OSH server, confirm that the expected systems and datastreams appear and that new observations are arriving. Dashboard readings confirm local collection; checking the server confirms delivery.

### Stop or reconfigure a run

Tap **Stop Streaming** on the Dashboard to end the run. After changing sensors, server profiles, or service settings, start a new run so SensorHub loads the updated configuration.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Connection test fails | Check the complete URL, server availability, network access, and credentials. Make sure the selected client matches the endpoint. |
| Connection test succeeds, but no observations arrive | Confirm the profile is enabled, at least one supported sensor is enabled, and streaming is running. Check the server's registration and write permissions. |
| A sensor has no readings | Check its settings, hardware availability, and Android permissions. Inspect **Needs attention** on the Dashboard. |
| A Bluetooth peripheral does not connect | Check Bluetooth is on, nearby-device permission is granted, and the correct device is selected. Complete pairing if required. |
| Configuration changes have no effect | Stop streaming and start a new run. |





