# Fleet Tracker
### A toolkit for connected cars.

**Disclaimer: The blueprints and information made available on this page are examples only and are not to be used for production purposes. Twilio disclaims any warranties and liabilities under any legal theory (including, without limitation, breach of contract, tort, and indemnification) in connection with your use of or reliance on the blueprints. Any liabilities that arise in connection with your use of these blueprints shall solely be borne by you. By accessing and downloading these blueprints, you agree to the foregoing terms.**

**Problem** Commercial vehicle fleet managers are required by law to track various driver and vehicle behaviors. Beyond the data logging mandated by law, there are other behaviors that employers might want to track.

**Solution** We will create a Twilio-powered fleet tracker that uses off-the-shelf components to track and log the following data:
* Miles driven
* Hours of uptime / downtime
* Locations
* Average speed
* Average acceleration rate / driver aggressiveness
* Fuel consumption

**Degree of Difficulty (1-5): 2**  This device requires some knowledge of the C programming language, microcontroller basics, and GPIO wiring.

### What You’ll Need
Before we get started, here's a quick overview of what you'll need to build the Fleet Tracker:

**Electronic Components**

* 1x [Multi-Tech Dragonfly](http://www.digikey.com/product-search/en?keywords=591-1287-ND)
* 1x [Multi-Tech Dragonfly Development Kit](http://www.digikey.com/product-search/en?keywords=591-1262-ND)
* 1x [Freematics OBD-II UART Adapter V2](http://freematics.com/store/index.php?route=product/product&product_id=83)
* 1x [GPS Antenna](http://www.digikey.com/product-search/en?keywords=ECHO5%2F0.1M%2FUFL%2FS%2FS%2F15-ND)
* 1x [Status LED](https://www.sparkfun.com/products/9650)
* 3x [Molex C-Grid Headers - 3 Position](http://www.digikey.com/product-search/en?keywords=WM8001-ND)
* 2x [Molex C-Grid Headers - 2 Position](http://www.digikey.com/product-detail/en/molex-llc/0901230102/WM8000-ND/760716)
* 4x [Molex Contact Crimp Pin - 24-30 AWG Tin](http://www.digikey.com/products/en?keywords=MOLEX%20%2016-02-0108)
* 1x [RF Antenna](http://www.digikey.com/product-search/en?keywords=939-1056-ND)
* 2x [U.FL Extension Cable](https://www.amazon.com/s/ref=bnav_search_go?url=search-alias%3Daps&field-keywords=B006IVUJPQ)

**Other Hardware**
* 3x [Thumb Screws For Body Covers 4-40x5/16"](https://www.mcmaster.com/#91746a624/=15us143)
* 3x [Threaded Inserts for Body Covers 4-40 Thread](https://www.mcmaster.com/#92395a112/=15us0uq)
* 1x [Bob Smith 103 Insta-Cure 2oz Super Thin Glue](https://www.amazon.com/Bob-Smith-Insta-Cure-Super-Thin/dp/B001NI4JWI)
* 1x [3M VHB Foam Tape](https://www.mcmaster.com/#76665a84/=16us8e0)
* 1x [Molex	Hand Crimper Tool - 14-24 AWG Side Entry](http://www.digikey.com/product-detail/en/molex-llc/0638111000/WM9999-ND/243789)

**(Optional) 3D-Printed Parts** In addition to the electronic components and mechanical hardware, the body of the Fleet Tracker is fabricated from 3D-printed parts.

You can download the [3D CAD Model here](models/01%20Body.STL)

Using this 3D CAD Model, you have a few options for actually building the body:

* Print it, if you have access to a 3D printer.
* Alternatively, if you don't have access to 3D printer or want to ensure quality, you could use a third-party 3D printing service. We recommend [Sculpteo](http://sculpteo.com) or [Voodoo Manufacturing](https://voodoomfg.com/).

**(Optional) Laser-Cut Part** The Fleet Tracker has one clear acrylic cover panel that attaches to the outside of the 3D-printed case. You will need to build this as well.
You can download the [panel model here](models/FleetTrackerCoverPlateP.dxf)
As with the body, you can make the panels yourself based on the designs or choose to use a third-party service. We again recommend [Sculpteo](http://sculpteo.com). 

_Whether you are cutting and printing yourself or using a service, **double check the units and dimensions of all parts after uploading**._

**Server Software** You'll need a server to collect data. You can create your own or run our simple NodeJS backend [Set up instructions here](node/README.md).

### (Optional) Finishing
**(Optional) 3D-Printed Parts** Surface finishes and residues left on the parts will vary depending on the type of printer or service used to produce them. Third-party producers should produce finishes to specification and clean parts before they ship, but prints done yourself will require special attention.
* Always be sure to clean parts thoroughly according to the printer manufacturer’s directions. Double-check hard-to-reach areas like screw holes; these areas may need to be scraped out.
* Check to make sure that there are no remaining residues that could prevent adhesives or glues from performing adequately. If you are able to scrape material off a surface with your fingernail, it is likely that any adhesive used in that area will be unreliable.
* For cosmetic finishing in these areas, diligent 400-grit wet sanding will clean off the residue and leave a smooth, matte surface.
* For areas that will be covered by wires or electronic components, residues must be scraped off before assembly can begin. Any small, hard steel tool can be used. (Dental picks and chisels should work well.) Don’t worry about the appearance, as these areas will be covered after assembly.

**(Optional) Laser-Cut Parts** If you have access to a table router with a 45° chamfer bit, adding a small bevel to the outside edge of the acrylic can clean up the appearance of these parts. When assembling, be sure to keep the side with the bevel facing away from the enclosure.

### Let’s Build It!

![image alt text](images/image_0.jpg)

**Step 1: Prep Multi-Tech Break-Out Board.**

![image alt text](images/image_1.jpg)
* The breakout board is what allows us to interface the microcontroller to the Freematics OBD-II unit. Out of the box, there are a few features on the board that we will not use. To save some some space and reduce the bulk of our final device, we removed these features.
* First **we will remove the 3 antenna RP-SMA connectors** on each corner of the board. This can be done by loosening the corresponding Phillips-head screw on the underside of each connector. Simply **remove the screw** and the connector will separate from the board.

![image alt text](images/image_2.jpg)
* Next, we will **remove the large serial port on the lower right side of the board**.  We will be using the micro usb ports to interface with the board, making this port redundant. **De-Solder each pad beneath the connector and remove**.

![image alt text](images/image_3.jpg)
* Lastly, **we will remove the 4 rubber standoffs located on the underside of the board**.

![image alt text](images/image_4.jpg)
* Now the breakout board is ready to accept the ST micro controller.

![image alt text](images/image_5.jpg)

**Step 2: Prepare the ST Dragonfly microcontroller.**

![image alt text](images/image_6.jpg)
* The ST microcontroller contains all of the computational hardware for this device.
* To prep this portion of the hardware, we will first need to insert the twilio SIM card.** Insert the SIM card into the card port on the underside of the ST dragonfly board**.

![image alt text](images/image_7.jpg)
* Once the SIM card is inserted, **place the micro controller into the appropriate receptacle on the Multi-Tech Break-Out Board**.
* Once the controller is in place, **place the two corner screws in place with a Phillips head screwdriver**.

![image alt text](images/image_8.jpg)

**Step 3: Flash the ST microcontroller.**
* Now we will place the necessary firmware onto the microcontroller. In order to do this, **we will need to connect to two different micro USB ports**: one on the **breakout board** and another on the **ST microcontroller** itself.
* The Dragonfly is an mbed supported hardware platform, which allows you to compile for it using the online mbed IDE available at [developer.mbed.org](https://developer.mbed.org/).
* After creating an account, open the “Compiler” window from the menu bar at the top of the user homescreen.

![image alt text](images/image_20.jpg)

* Import the mbed project into the compiler using the import button at the left of the project page, or create a new project and import the individual files into that new project. If you import the project files make sure you add the mtsas and mbed libraries to your project.

![image alt text](images/image_21.jpg)

![image alt text](images/image_24.jpg)

* Select the target platform in the upper right corner of the mbed compiler window.

![image alt text](images/image_26.jpg)

* Add a platform and select the MTS dragonfly.

![image alt text](images/image_27.jpg)

![image alt text](images/image_28.jpg)

![image alt text](images/image_29.jpg)

![image alt text](images/image_30.jpg)

* Hit “Compile” which will generate a file for download.  The initial attempt will fail because the mtsas library is missing—push the “Fix It!” button next to the error to prompt the mbed compiler to automatically locate and import the correct library. 

![image alt text](images/image_31.jpg)

![image alt text](images/image_32.jpg)

* The next time you hit “Compile”  it should succeed and will generate a file for download. Either save this to the new USB drive associated with the dragonfly device or copy from your downloads folder into this drive.

![image alt text](images/image_37.jpg)

**Step 4: Prep [3D-printed body](models/01%20Body.STL) for assembly.**
* First, we will need to **drive the three brass threaded inserts into place**. Do this by **orienting the knurled side of the insert down**, and then **lightly tap them into place**.  To get them properly seated, using a punch and light hammer are recommended.

![image alt text](images/image_10.jpg)

**Step 5: Place components into enclosure.**
* We are now ready to begin placing the components into the 3D-printed housing.

![image alt text](images/image_11.jpg)
* **Place the GPS antenna into the slot** located on the top left of the printed housing.

![image alt text](images/image_12.jpg)
* Next **apply the adhesive-backed wireless antenna into the slot** directly below.

![image alt text](images/image_13.jpg)
* Now, we will apply **VHB or another 2-sided, adhesive-backed foam** to the breakout board.  After the foam is applied, we will **orient the board as pictured and seat it into the printed housing**.

![image alt text](images/image_14.jpg)

**Step 6: Wire and connect components.**
* First, **connect the rsma extensions to each antenna and route the antenna wires into their corresponding channels**. You can use a small bead of cyanoacrylate or other fast curing adhesive to **tack the wires into place** for a cleaner look.
* The GPS antenna will be connected to the "G" terminal on the microcontroller, and the mobile wireless antenna will be connected onto the “M” terminal.

![image alt text](images/image_15.jpg)
* **Terminate the the Freematics OBD-II unit** with two pairs of molex C-grid connectors.
* **Pair the red and black wires** to supply the breakout with power, and **pair the white and green wires** for data.
* Next we will **insert the red wire into V-in and the black wire to ground**. Then, **insert the green wire to D0 and the white wire to D1**.
* **Delicately bend the pins of each connector to 90 degrees** in order to save overhead clearance.

![image alt text](images/image_16.jpg)
* **Route the wire** of the freematics unit around the ST microcontroller and then through the strain relief port on the top right of the enclosure.

**Step 7: Add external GPIO connectors and Status LED.**
* In addition to wiring the freematics unit to the breakout board, we will add several ports for additional GPIO function. There are three bosses at the top of the enclosure that are designed to accommodate three pin molex C-Grid connectors. The plastic housing can be glued in place for any wiring configuration of your choosing.

![image alt text](images/image_17.jpg)
* The top of the enclosure also accommodates a 3mm status LED.  An inline resistor will need to be soldered to the LED, which can then be connected to a variety of GPIO pins. We set it up as a simple on/off indicator.

![image alt text](images/image_18.jpg)

**Step 8: Place [cover](models/FleetTrackerCoverPlateP.dxf) on enclosure.**
* **Place the acrylic faceplate over the device**, and then **tighten all three thumb screws**.

![image alt text](images/image_19.jpg)

