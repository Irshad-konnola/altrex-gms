======================================================================
               ALTREX GMS - BIOMETRIC SYNC AGENT
======================================================================

HOW TO RUN:
-----------
Choose either of the two methods below:

METHOD 1: RUN SILENTLY IN THE BACKGROUND (Recommended)
------------------------------------------------------
1. Double-click "start-background.vbs".
2. The agent runs silently in the background (no black command window).
3. To stop it at any time: Double-click "stop.bat".

METHOD 2: AUTOMATIC START ON WINDOWS BOOT (Best for Gym PC)
------------------------------------------------------------
1. Double-click "install-startup.bat" once.
2. That's it! Every time the front-desk PC turns on or restarts, the sync
   agent will start automatically in the background.
3. If you ever want to disable auto-start, double-click "uninstall-startup.bat".

METHOD 3: RUN WITH LIVE LOG WINDOW
----------------------------------
1. Double-click "start.bat".
2. A black window with green text will open showing real-time sync logs.
3. Keep it minimized while working.

----------------------------------------------------------------------
HOW IT WORKS:
-------------
• ACTIVE MEMBERS: Members with an active membership plan can scan their
  face and the door unlocks immediately.
• EXPIRED MEMBERS: As soon as a member's plan expires, their face
  recognition will flash RED and display "Expired", keeping the door locked.
• REALTIME UPDATES: When you add, renew, or edit a member in the Altrex
  web dashboard, this agent updates the machine within seconds.
• BACKGROUND CHECK: Even if no changes are made, the agent verifies and
  re-syncs all members every 60 seconds.

MANUAL TEST TOOLS:
------------------
If you ever want to test a member manually:
1. Open Command Prompt inside this folder.
2. Run: node test-sync-one.js <Face_ID>
   Example: node test-sync-one.js 1
