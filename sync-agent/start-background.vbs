' Altrex GMS - Silent Background Launcher
' Starts the sync agent in the background without displaying a black command window.
Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
strPath = FSO.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strPath
WshShell.Run "cmd /c """ & strPath & "\start.bat""", 0, False
