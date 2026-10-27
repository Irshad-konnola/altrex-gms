# Altrex Hikvision Biometric Sync Agent (Option A)

A lightweight local daemon that connects your **Hikvision Face Recognition Terminal** to the **Altrex GMS Cloud Database (Supabase)**.

It automatically enforces membership validity in real-time. When a member's plan expires or is suspended on the Altrex dashboard, the agent automatically sets their hardware access schedule on the Hikvision terminal so they are immediately **locked out** at the door. When they renew, their access is restored automatically.

---

## 🚀 Gym Setup Checklist (When you are at the gym)

### 1. Requirements
* A Windows computer (e.g. Front-Desk PC or Laptop) connected to the **same Wi-Fi or LAN router** as the Hikvision machine.
* Node.js installed on the computer.

### 2. Configure `.env`
Open `sync-agent/.env` in any text editor and verify:
```ini
# LAN IP of your Hikvision machine (Look at: Menu -> Comm -> Network on the machine)
HIKVISION_IP=192.168.220.2
HIKVISION_PORT=80
HIKVISION_USER=admin
HIKVISION_PASS=YOUR_HIKVISION_ADMIN_PASSWORD

# Supabase keys are already pre-filled for production!
SYNC_INTERVAL_SECONDS=60
```

### 3. Step 1: Run Diagnostic Test
Open Terminal / PowerShell in the `sync-agent` folder:
```bash
npm run test
```
* It will verify your Supabase connection.
* It will ping the Hikvision terminal over Wi-Fi and verify the Admin password.
* It will check if the Hikvision internal clock is correct.

### 4. Step 2: Test Single Member Sync (Optional but Recommended)
Test updating the hardware validity for any enrolled Face ID (e.g., ID 44):
```bash
node test-sync-one.js 44
```
You will see the member's plan details from Altrex and the terminal confirming the validity dates!

### 5. Step 3: Start 24/7 Sync
Simply double-click **`start.bat`** or run:
```bash
npm start
```
The agent will:
1. Immediately sync all mapped members.
2. Listen in real-time to Supabase: Any membership created, renewed, or canceled in the Altrex web dashboard syncs within seconds!
3. Re-verify all members every 60 seconds as a backup.

---

## 🔒 How Expiration Works
* **Active Members:** `Valid.endTime` is set to their membership plan `end_date` at 23:59:59. The door unlocks normally.
* **Expired Members:** `Valid.endTime` is stored in the past. The Hikvision machine displays "Expired" on the screen and **refuses to open the door**.
* **Face Templates are Never Deleted:** When an expired member pays and renews, their access is restored instantly without needing to scan their face again!
