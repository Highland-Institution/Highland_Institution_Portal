// Import necessary modules
const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let loadingWindow;

function createWindow() {
  // Create the main window
  mainWindow = new BrowserWindow({
    width: 1350,
    height: 700,
    webPreferences: {
      nodeIntegration: false, // Disable Node.js integration in renderer process
      contextIsolation: true,  // Enable context isolation for security
      
    },
    icon: path.join(__dirname, 'icons', 'Highland Institution.ico'),
    title: 'Highland Institution',
    autoHideMenuBar: true,
  });

  // Create the loading window
  loadingWindow = new BrowserWindow({
    parent: mainWindow,
    width: 1350,
    height: 700,
    webPreferences: {
      nodeIntegration: false, // Disable Node.js integration in loading window
      contextIsolation: true,
     
    },
    modal: true,
    show: false,
    frame: false,
    transparent: true,
  });

  Menu.setApplicationMenu(null);

  // Handle network errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame) {
      const options = {
        type: 'error',
        buttons: ['Retry', 'Close'],
        defaultId: 0,
        title: 'Network Error',
        message: 'Highland Institution failed to load. Please check your internet adapter and retry.',
        detail: `Error: ${errorDescription}`,
      };

      dialog.showMessageBox(mainWindow, options).then((response) => {
        if (response.response === 0) {
          // Retry button clicked, reload the URL
          mainWindow.loadURL('https://portal.highland-institution.com');
        } else {
          // Close button clicked, close the application
          mainWindow.close();
        }
      });
    }
  });

  loadingWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: transparent;
            font-family: 'Poppins', sans-serif;
          }

          .spinner {
            border: 6px solid #f3f3f3;
            border-top: 6px solid #3498db;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
      </body>
    </html>
  `));

  // Show loading window on navigation start
  mainWindow.webContents.on('did-start-loading', () => {
    loadingWindow.show();
  });

  // Hide loading window when the page stops loading
  mainWindow.webContents.on('did-stop-loading', () => {
    loadingWindow.hide();
  });

  // Load your website or any other URL here
  mainWindow.loadURL('https://portal.highland-institution.com/');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Handle location access requests from the renderer process
  ipcMain.handle('request-location', async (event) => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error('Location access denied: ' + error.message));
        }
      );
    });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});
