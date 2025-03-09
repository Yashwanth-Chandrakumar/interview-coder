import { app, globalShortcut } from "electron"
import { IShortcutsHelperDeps } from "./main"

export class ShortcutsHelper {
  private deps: IShortcutsHelperDeps

  constructor(deps: IShortcutsHelperDeps) {
    this.deps = deps
  }

  public registerGlobalShortcuts(): void {
    globalShortcut.register("CommandOrControl+H", async () => {
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        console.log("Taking screenshot...")
        try {
          const screenshotPath = await this.deps.takeScreenshot()
          const preview = await this.deps.getImagePreview(screenshotPath)
          mainWindow.webContents.send("screenshot-taken", {
            path: screenshotPath,
            preview
          })
        } catch (error) {
          console.error("Error capturing screenshot:", error)
        }
      }
    })

    globalShortcut.register("CommandOrControl+Enter", async () => {
      await this.deps.processingHelper?.processScreenshots()
    })

    globalShortcut.register("CommandOrControl+R", () => {
      console.log(
        "Command + R pressed. Canceling requests and resetting queues..."
      )

      // Cancel ongoing API requests
      this.deps.processingHelper?.cancelOngoingRequests()

      // Clear both screenshot queues
      this.deps.clearQueues()

      console.log("Cleared queues.")

      // Update the view state to 'queue'
      this.deps.setView("queue")

      // Notify renderer process to switch view to 'queue'
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("reset-view")
        mainWindow.webContents.send("reset")
        
        // Make sure window is properly positioned and visible
        setTimeout(() => {
          // Reset window position first to ensure it's on screen
          if (this.deps.resetWindowPosition) {
            this.deps.resetWindowPosition();
            console.log("Reset window position to ensure visibility");
          }
          
          // If window is not visible, make it visible
          if (this.deps.isVisible && !this.deps.isVisible()) {
            if (mainWindow && !mainWindow.isDestroyed()) {
              console.log("Ensuring window remains visible after reset");
              mainWindow.setOpacity(1);
              mainWindow.show();
            }
          }
        }, 250); // Increased delay for more reliable reset
      }
    })

    // New shortcuts for moving the window
    globalShortcut.register("CommandOrControl+Left", () => {
      console.log("Command/Ctrl + Left pressed. Moving window left.")
      this.deps.moveWindowLeft()
    })

    globalShortcut.register("CommandOrControl+Right", () => {
      console.log("Command/Ctrl + Right pressed. Moving window right.")
      this.deps.moveWindowRight()
    })

    globalShortcut.register("CommandOrControl+Down", () => {
      console.log("Command/Ctrl + down pressed. Moving window down.")
      this.deps.moveWindowDown()
    })

    globalShortcut.register("CommandOrControl+Up", () => {
      console.log("Command/Ctrl + Up pressed. Moving window Up.")
      this.deps.moveWindowUp()
    })

    // Use Command+Shift+B on macOS and Alt+B on Windows/Linux to avoid browser conflicts
    const toggleKey = process.platform === 'darwin' ? 'Command+Shift+B' : 'Alt+B'
    
    globalShortcut.register(toggleKey, () => {
      this.deps.toggleMainWindow()
    })

    // Modify this registration to remove the KeyboardEvent parameter
    globalShortcut.register('CommandOrControl+B', () => {
      this.deps.toggleMainWindow()
    })

    // Add language selection shortcuts
    globalShortcut.register('Alt+P', () => {
      const mainWindow = this.deps.getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('change-language', 'python');
      }
    });

    globalShortcut.register('Alt+J', () => {
      const mainWindow = this.deps.getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('change-language', 'java');
      }
    });

    globalShortcut.register('Alt+C', () => {
      const mainWindow = this.deps.getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('change-language', 'cpp');
      }
    });

    // Add horizontal scrolling shortcuts for code blocks
    globalShortcut.register("Alt+Left", () => {
      console.log("Alt+Left pressed. Scrolling code block left.")
      const mainWindow = this.deps.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
          (function() {
            const codeBlocks = document.querySelectorAll('pre');
            codeBlocks.forEach(block => {
              block.scrollLeft = Math.max(0, block.scrollLeft - 100);
            });
          })();
        `);
      }
    });

    globalShortcut.register("Alt+Right", () => {
      console.log("Alt+Right pressed. Scrolling code block right.")
      const mainWindow = this.deps.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
          (function() {
            const codeBlocks = document.querySelectorAll('pre');
            codeBlocks.forEach(block => {
              block.scrollLeft = block.scrollLeft + 100;
            });
          })();
        `);
      }
    });

    // Unregister shortcuts when quitting
    app.on("will-quit", () => {
      globalShortcut.unregisterAll()
    })
  }
}
