# Altrex Hikvision Biometric Sync Agent

A standalone lightweight daemon designed to run on a local gym computer connected to the same Local Area Network (LAN) as the **Hikvision Face Recognition / Biometric Terminal**.

## Purpose

The Sync Agent communicates directly with Hikvision biometric terminals using Hikvision's ISAPI protocol over HTTP/Digest Authentication. It polls event logs or receives real-time check-in events and forwards verified member attendance records directly to the Altrex GMS backend API or Supabase.

## Setup & Running

1. **Navigate to this directory:**
   ```bash
   cd sync-agent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Connection:**
   Open `test-connection.js` and verify:
   - `HIKVISION_IP`: LAN IP of your biometric terminal (e.g., `192.168.1.100`)
   - `HIKVISION_USER`: Machine admin username (default: `admin`)
   - `HIKVISION_PASS`: Machine admin password

4. **Test Device Communication:**
   ```bash
   npm test
   ```
   If successful, device details (firmware version, serial number, device model) will be printed.
