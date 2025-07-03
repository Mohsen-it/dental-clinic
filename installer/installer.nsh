; English Installer Customization for Dental Clinic Management System
; Dental Clinic Management AgorraCode Installer

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "WinMessages.nsh"
!include "FileFunc.nsh"
!include "icons-config.nsh"
!include "modern-ui.nsh"
!include "theme-config.nsh"

; Define Variables
!define PRODUCT_NAME "Dental Clinic Management AgorraCode"
!define PRODUCT_VERSION "2.1.0"
!define PRODUCT_PUBLISHER "AgorraCode"
!define PRODUCT_WEB_SITE "https://agorracode.com"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\dental-clinic.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

; General Settings
Name "${PRODUCT_NAME}"
OutFile "${PRODUCT_NAME}-${PRODUCT_VERSION}-Setup.exe"
InstallDir "$PROGRAMFILES\AgorraCode\${PRODUCT_NAME}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

; Modern UI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; Welcome Page
!define MUI_WELCOMEPAGE_TITLE "Welcome to ${PRODUCT_NAME} Setup Wizard"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of ${PRODUCT_NAME}.$\r$\n$\r$\nIt is recommended that you close all other applications before continuing. This will make it possible to update relevant system files without having to reboot your computer.$\r$\n$\r$\nClick Next to continue."

; License Page
!define MUI_LICENSEPAGE_TEXT_TOP "Please review the license terms before installing ${PRODUCT_NAME}."
!define MUI_LICENSEPAGE_TEXT_BOTTOM "If you accept the terms of the agreement, click I Agree to continue. You must accept the agreement to install ${PRODUCT_NAME}."
!define MUI_LICENSEPAGE_BUTTON "&I Agree"

; Components Page
!define MUI_COMPONENTSPAGE_TITLE "Choose Installation Components for ${PRODUCT_NAME}"
!define MUI_COMPONENTSPAGE_TEXT "Please select the components you want to install. You can choose to install all components or select specific components.$\r$\n$\r$\nClick Next to continue."
!define MUI_COMPONENTSPAGE_GROUP "${PRODUCT_NAME} Components"

; Directory Page
!define MUI_DIRECTORYPAGE_TEXT_TOP "Setup will install ${PRODUCT_NAME} in the following folder.$\r$\n$\r$\nTo install in a different folder, click Browse and select another folder. Click Next to continue."
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "Destination Folder"

; Installation Page
!define MUI_INSTFILESPAGE_FINISHHEADER_TEXT "Installation Complete"
!define MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT "${PRODUCT_NAME} has been installed successfully."
!define MUI_INSTFILESPAGE_ABORTHEADER_TEXT "Installation Aborted"
!define MUI_INSTFILESPAGE_ABORTHEADER_SUBTEXT "Installation was not completed."

; Finish Page
!define MUI_FINISHPAGE_TITLE "${PRODUCT_NAME} Installation Complete"
!define MUI_FINISHPAGE_TEXT "${PRODUCT_NAME} has been installed on your computer.$\r$\n$\r$\nClick Finish to close this wizard."
!define MUI_FINISHPAGE_RUN "$INSTDIR\dental-clinic.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Run ${PRODUCT_NAME}"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.txt"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Show README file"

; Installer Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "license-en.txt"
!insertmacro MUI_PAGE_COMPONENTS
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE DirectoryLeave
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!define MUI_UNWELCOMEPAGE_TEXT "This wizard will guide you through the uninstallation of ${PRODUCT_NAME}.$\r$\n$\r$\nBefore starting the uninstallation, make sure ${PRODUCT_NAME} is not running.$\r$\n$\r$\nClick Next to continue."
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Languages
!insertmacro MUI_LANGUAGE "English"

; Version Information
VIProductVersion "2.1.0.0"
VIAddVersionKey /LANG=${LANG_ENGLISH} "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey /LANG=${LANG_ENGLISH} "Comments" "Comprehensive Dental Clinic Management System"
VIAddVersionKey /LANG=${LANG_ENGLISH} "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey /LANG=${LANG_ENGLISH} "LegalTrademarks" "${PRODUCT_NAME} is a trademark of ${PRODUCT_PUBLISHER}"
VIAddVersionKey /LANG=${LANG_ENGLISH} "LegalCopyright" "© ${PRODUCT_PUBLISHER}"
VIAddVersionKey /LANG=${LANG_ENGLISH} "FileDescription" "${PRODUCT_NAME}"
VIAddVersionKey /LANG=${LANG_ENGLISH} "FileVersion" "${PRODUCT_VERSION}"

; Main Installation Function
Section "Main Program" SEC_MAIN
  SetOutPath "$INSTDIR"
  SetOverwrite ifnewer
  File /r "${BUILD_RESOURCES_DIR}\*.*"
SectionEnd

Section "Help Files" SEC_HELP
  SetOutPath "$INSTDIR"
  File "README-ar.txt"
  File "user-guide-ar.md"
SectionEnd

Section "Desktop Shortcuts" SEC_DESKTOP
  Call CreateIcons
SectionEnd

; Register File Types
Section -RegisterFileTypes
  Call RegisterFileTypes
SectionEnd

; Create Application Info
Section -AppInfo
  Call CreateAppInfo
SectionEnd

; Uninstall Function
Section Uninstall
  Call un.RemoveIcons
  Call un.UnregisterFileTypes
  ; Delete shortcuts
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall ${PRODUCT_NAME}.lnk"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"

  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"

  ; Delete files
  RMDir /r "$INSTDIR"

  ; Delete registry keys
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"

  SetAutoClose true
SectionEnd

; Initialization Function
Function .onInit
  ; Set default language to English
  StrCpy $LANGUAGE ${LANG_ENGLISH}
  Call ApplyModernTheme
  Call SetDefaultInstallDir
FunctionEnd

; Function to set default installation directory with automatic folder creation
Function SetDefaultInstallDir
  ; Set default installation directory with AgorraCode folder
  StrCpy $INSTDIR "$PROGRAMFILES\AgorraCode\${PRODUCT_NAME}"
FunctionEnd

; Function to ensure proper directory structure before installation
Function DirectoryLeave
  ; Always ensure the installation goes to AgorraCode subfolder
  Push $R0
  Push $R1

  ; Get the selected directory
  StrCpy $R0 $INSTDIR

  ; Check if the path already contains AgorraCode
  StrLen $R1 $R0
  IntOp $R1 $R1 - 10  ; Length of "AgorraCode"
  IntCmp $R1 0 check_done
  StrCpy $R1 $R0 10 $R1
  StrCmp $R1 "AgorraCode" check_done

  ; If not, append AgorraCode to the selected path
  StrCpy $INSTDIR "$R0\AgorraCode\${PRODUCT_NAME}"

  check_done:
  ; Create the directory structure
  CreateDirectory $INSTDIR

  Pop $R1
  Pop $R0
FunctionEnd

Function un.onInit
  StrCpy $LANGUAGE ${LANG_ENGLISH}
FunctionEnd
