# Fleet Tracker
### A toolkit for connected cars.

## Getting Started
### Hardware setup
1. This system is based on the Multitech Dragonfly MTQ-H5-B01 on the MTUDK2-ST-CELL carrier board.
2. Remove all jumpers from JP98 on the carrier board.
3. Power the Dragonfly by connecting a USB cable to the connector on the Dragonfly module.
4. Connect a USB cable between your computer and the micro USB on the carrier board (J6).
5. Update your [firmware](https://developer.mbed.org/teams/ST/wiki/Nucleo-Firmware).
6. After updating the firmware (per 'Software Setup' below) disconnect the USB cables and reconnect as above to power cycle the device
7. Connect the Freematics OBD-II adapter to the Draongfly breakout board.
	1. Red to 5v on X9, Black to Gnd on X9, Green to D0 on X8, White to D1 on X8.
	2. You can come back to this step later.
	3. You will see a pin read error in your terminal output if you skip this step for now and run the software on the device.

### Software Setup
1. The Dragonfly is an mbed supported hardware platform, which allows you to compile for it using the online mbed IDE available at [developer.mbed.org](https://developer.mbed.org/).
2. Create an account.
3. Open the 'Compiler' window from the menu bar at the top of the user homescreen.
4. Import the source files into a new project using the ***Import*** button at the left of the project page.
  	1. You will also need to import the mbed library to your project.
5. Make sure you select the MTS Fragonfly as the target platform in the upper right corner of the mbed compiler window.
6. Update DEVICE_ID to the one supplied in the [custom server](../node).
	1. Device ID is the ID of your Vehicle in the SQLite database. 
7. Update the TOKEN to the one supplied in the [custom server](../node).
	1. The TOKEN is autogenereated ***after*** you add your Fleet Tracker device to the server software.
	2. This is not your Twilio Authentication Token. 
8. Update the SERVER_URL to be the appropriate URL of your server.
9. Click Compile. The initial attempt will fail because the mtsas library is missing. Click the `fix it` button next to the error to prompt the mbed compiler to automatically locate and import the correct library.
10. Click the `fix it` button if it appears again.
11. Compile your application.
12. Save the `.bin` file to the MultiTech USB drive associated with the Dragonfly device, or copy from you downloads folder into this drive.
13. Once the red/green lights stop flashinig for more than a few seconds press the reset button on the carrier board to start the application.

****Note:**** On Windows download an application like [PuTTY](http://www.putty.org/) to view the Dragonfly device output.
On OSX you can type `screen tty.usbmodem1423 112500` to see output. On OSX type `ls /dev/ | grep tty.usb` to determine the last 4 digits of the usbmodem.

### Tips
1. Sometimes the system seems to get stuck in a non-working state when saving firmware to the device. When this happens, first try saving the firmware to the device again. If this does not work or if the transfer fails then unplug the USB cables to power cycle the module and reconnect as described above.
