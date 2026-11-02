======================================================================
               ALTREX GMS - BIOMETRIC SYNC AGENT
======================================================================

QUICK START FOR GYM FRONT-DESK STAFF:
-------------------------------------
1. Extract this entire "altrex-sync-agent" folder onto your PC (e.g. C:\altrex-sync-agent or Desktop).
2. Make sure this PC is connected to the Gym Wi-Fi / Router (same network as the face scanner).
3. Right-click on "start.bat" -> "Send to" -> "Desktop (create shortcut)".
4. Double-click "start.bat" (or the Desktop shortcut).
   - A black window with green text will appear.
   - It will automatically connect to the Hikvision terminal (192.168.220.2) and sync all members.
   - Keep this window open or minimized in the background.

HOW IT WORKS:
-------------
• ACTIVE MEMBERS: Members with an active membership plan can scan their face and the door unlocks immediately.
• EXPIRED MEMBERS: As soon as a member's plan expires, their face recognition will flash RED and display "Expired", keeping the door locked.
• REALTIME UPDATES: When you add, renew, or edit a member in the Altrex web dashboard, this agent updates the machine within seconds.
• BACKGROUND CHECK: Even if no changes are made, the agent verifies and re-syncs all members every 60 seconds.

MANUAL TEST TOOLS:
------------------
If you ever want to test a member manually:
1. Open Command Prompt inside this folder.
2. Run: node test-sync-one.js <Face_ID>
   Example: node test-sync-one.js 1
