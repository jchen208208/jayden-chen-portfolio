/**
 * SPARC's build, stage by stage, for the timeline on `/projects/sparc`
 * (`ProjectTimeline`). Pieced together from the SPARC repo's history, its
 * README, `Project_Timeline.md` and `pcb/v1/PCB_V1_NOTES.md`.
 */

export type TimelineStage = {
  /** a 2–4 letter code the timeline can draw — a silkscreen designator, a
   *  mile-marker plate, an LED's label */
  tag: string;
  /** the short date on the scrubber */
  mark: string;
  /** the full date range in the stage's panel */
  date: string;
  title: string;
  body: string;
  problem?: string;
  fix?: string;
};

export const SPARC_TIMELINE: TimelineStage[] = [
  {
    tag: "UNO",
    mark: "JUN 16",
    date: "June 16–18, 2026",
    title: "Uno, wired to a laptop",
    body: "An Arduino Uno and an ultrasonic sensor on a breadboard, sending gesture names down a USB cable to a Python script on a laptop, which called the Spotify Web API.",
    problem: "Our first design mapped hand distance straight to volume, and it kept misreading where the hand was.",
    fix: "After about a day of fighting it, we switched to discrete gestures: passes and holds. We also added connect and disconnect sounds, and LEDs that showed the volume.",
  },
  {
    tag: "HC05",
    mark: "JUN 18",
    date: "June 18–22, 2026",
    title: "Cutting the cable",
    body: "We tried WiFi first, then settled on an HC-05 Bluetooth module, with the Uno running off a power bank.",
    problem: "macOS wouldn't keep a serial connection to the HC-05.",
    fix: "A lot of pairing and port troubleshooting, until the link held.",
  },
  {
    tag: "APP",
    mark: "JUL 5",
    date: "July 5–10, 2026",
    title: "From script to app",
    body: "Nobody should have to open an IDE to change songs.",
    problem: "Packaged as an executable, it still opened a terminal window.",
    fix: "A real macOS app, with a status screen for the sensor and Spotify, the SPARC logo and an animation for each gesture, plus a Windows build.",
  },
  {
    tag: "NANO",
    mark: "JUL 10",
    date: "July 10–13, 2026",
    title: "Arduino Nano",
    body: "We moved to the much smaller Arduino Nano and swapped the ultrasonic sensor for a VL53L0X time-of-flight sensor.",
  },
  {
    tag: "ESP",
    mark: "JUL 14",
    date: "July 14–27, 2026",
    title: "ESP32, one less radio",
    body: "The ESP32 has Bluetooth built in, so the HC-05 went away. We added an 8-LED NeoPixel strip, and the app got a spinning ring of album covers.",
  },
  {
    tag: "HID",
    mark: "AUG 18",
    date: "August 18–22, 2026",
    title: "Dropping the backend",
    body: "SPARC now pairs as a Bluetooth media remote, like the buttons on a pair of headphones. It works with any phone and any music app, with nothing to install, and iPhones work for the first time. On an iPhone, the LED strip also doubles as a progress bar for the track.",
    problem: "In February 2026, Spotify cut development-mode apps to five users and required the developer to have Premium, and extended quota is only open to organizations. There was no way to grow past five people.",
    fix: "We rebuilt the firmware as a BLE HID device and dropped the Python app and the Spotify API entirely.",
  },
  {
    tag: "PCB",
    mark: "AUG 24",
    date: "August 7–24, 2026",
    title: "Our own PCB",
    body: "Off the breadboard, onto perfboard, then a custom 2-layer PCB in KiCad with a bare ESP32-WROOM-32 module, a LiPo charger and a 3.3 V regulator.",
    problem: "On PCB v1 the Reset and BOOT buttons were wired across the 3.3 V rail, so pressing one shorted the supply, and the board could only be flashed with a jumper wire.",
    fix: "PCB v2 rewired the buttons and added I²C pull-ups and an EN delay capacitor. Its Gerbers went to the fab on August 24.",
  },
  {
    tag: "CASE",
    mark: "AUG 28",
    date: "Aug 28 – Sep 7, 2026",
    title: "Gestures, rethought",
    body: "One sensing zone instead of stacked ones: a pass skips, two go back, a hold toggles play/pause, and three passes enter volume mode, lit purple. The zone calibrates itself to a car roof or a shelf. The case was modelled in Fusion 360 and 3D-printed.",
  },
  {
    tag: "V3",
    mark: "NOW",
    date: "October 2026 – now",
    title: "Scaling it",
    body: "PCB v3 is underway in Altium, and v2 is being reworked with a status LED. Next: measuring the battery for real (it reports 100% today) and a pairing gesture for switching devices.",
  },
];
