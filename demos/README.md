# Mockup Interaction Demos

This folder contains automated walkthrough captures for the mockups under `src/mockups/`.

Run `node docs/capture-mockups.mjs` to regenerate the assets. Generated screenshots and recordings are gitignored to keep the repository lightweight.

Each session uses Playwright to start the static server (`npm run start mockups:<id>`) and interact with the pages.

## Mockup 2

* Served from: http://127.0.0.1:4242/
* Screenshot: `mockup-2.png` (generated artifact)
* Recording: `mockup-2.webm` (generated artifact)
* Actions:
  * Opened landing page
  * Scrolled through hero
  * ✔️ Opened quick search overlay
  * ✔️ Searched for "protein"
  * ⚠️ Opened first spotlight search result (skipped: element not found)
  * ✔️ Closed search overlay
  * ✔️ Opened primary product card
  * ✔️ Added product to cart
  * ✔️ Opened cart overlay
  * ✔️ Closed cart overlay
  * ✔️ Navigated to community page
  * ✔️ Returned to landing page
  * Saved screenshot to demos/mockup-2.png
  * Saved recording to demos/mockup-2.webm

## Mockup 4

* Served from: http://127.0.0.1:4242/
* Screenshot: `mockup-4.png` (generated artifact)
* Recording: `mockup-4.webm` (generated artifact)
* Actions:
  * Opened landing page
  * Scrolled through hero
  * ✔️ Opened account modal
  * ✔️ Entered login email
  * ✔️ Entered login password
  * ✔️ Submitted login form
  * ✔️ Closed account modal
  * ✔️ Opened support modal
  * ✔️ Provided support email
  * ✔️ Sent support message
  * ✔️ Closed support modal
  * ⚠️ Initiated Get Yuck CTA (skipped: element not found)
  * ⚠️ Added pack via modal (skipped: element not found)
  * ⚠️ Closed buy modal (skipped: element not found)
  * ⚠️ Viewed community page (skipped: element not found)
  * Saved screenshot to demos/mockup-4.png
  * Saved recording to demos/mockup-4.webm

## Mockup 6

* Served from: http://127.0.0.1:4242/
* Screenshot: `mockup-6.png` (generated artifact)
* Recording: `mockup-6.webm` (generated artifact)
* Actions:
  * Opened landing page
  * Scrolled through hero
  * ✔️ Opened buy modal
  * ✔️ Incremented quantity
  * ✔️ Updated quantity
  * ✔️ Added product to cart
  * ✔️ Closed buy modal
  * ✔️ Opened join modal
  * ✔️ Entered community email
  * ✔️ Submitted join form
  * ✔️ Closed join modal
  * ✔️ Opened support modal
  * ✔️ Provided support contact
  * ✔️ Closed support modal
  * ✔️ Explored product lineup
  * Saved screenshot to demos/mockup-6.png
  * Saved recording to demos/mockup-6.webm

## Mockup 8

* Served from: http://127.0.0.1:4242/
* Screenshot: `mockup-8.png` (generated artifact)
* Recording: `mockup-8.webm` (generated artifact)
* Actions:
  * Opened landing page
  * Scrolled through hero
  * ✔️ Opened header search icon
  * ✔️ Opened header cart icon
  * ✔️ Jumped to purchase options
  * ✔️ Switched to one-time plan
  * ✔️ Triggered add to cart
  * ✔️ Requested community invite
  * ✔️ Submitted community form
  * ✔️ Opened first support FAQ entry
  * ✔️ Explored additional support FAQ
  * Saved screenshot to demos/mockup-8.png
  * Saved recording to demos/mockup-8.webm
