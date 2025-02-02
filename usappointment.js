const puppeteer = require('puppeteer');
const parseArgs = require('minimist');
const axios = require('axios');
const {exec} = require('child_process');

(async () => {
    //#region Command line args
    const args = parseArgs(process.argv.slice(2), {string: ['u', 'p', 'c', 'a', 'n', 'f' ,'d', 'r'], boolean: ['g']})
    const currentDate = new Date(args.d);
    const fromDate = new Date(args.f);
    const usernameInput = args.u;
    const passwordInput = args.p;
    const appointmentId = args.a;
    const retryTimeout = args.t * 1000;
    const consularId = args.c;
    const userToken = args.n;
    const groupAppointment = args.g;
    const region = args.r;
    /*const currentDate = new Date('2025-07-31');
    const fromDate = new Date('2023-06-01');
    const usernameInput = 'xxxxxxxxx@gmail.com';
    const passwordInput = 'xxxxxxx';
    const appointmentId = 'xxxxxxx';
    const retryTimeout = 120 * 1000;
    const consularId = '94';
    const userToken = 'uynen3cxhphtie6ng33r1ekufzmu57';
    const groupAppointment = false;
    const region = 'ca';*/
    var counter = 0;
    let earliestDate = new Date('2025-08-08');
    const datesArray = 0;
    //const IS_PROD ='prod';
    //#endregion
	
    //#region Helper functions
    async function waitForSelectors(selectors, frame, options) {
      for (const selector of selectors) {
        try {
          return await waitForSelector(selector, frame, options);
        } catch (err) {
        }
      }
      throw new Error('Could not find element for selectors: ' + JSON.stringify(selectors));
    }

    async function scrollIntoViewIfNeeded(element, timeout) {
      await waitForConnected(element, timeout);
      const isInViewport = await element.isIntersectingViewport({threshold: 0});
      if (isInViewport) {
        return;
      }
      await element.evaluate(element => {
        element.scrollIntoView({
          block: 'center',
          inline: 'center',
          behavior: 'auto',
        });
      });
      await waitForInViewport(element, timeout);
    }

    async function waitForConnected(element, timeout) {
      await waitForFunction(async () => {
        return await element.getProperty('isConnected');
      }, timeout);
    }

    async function waitForInViewport(element, timeout) {
      await waitForFunction(async () => {
        return await element.isIntersectingViewport({threshold: 0});
      }, timeout);
    }

    async function waitForSelector(selector, frame, options) {
      if (!Array.isArray(selector)) {
        selector = [selector];
      }
      if (!selector.length) {
        throw new Error('Empty selector provided to waitForSelector');
      }
      let element = null;
      for (let i = 0; i < selector.length; i++) {
        const part = selector[i];
        if (element) {
          element = await element.waitForSelector(part, options);
        } else {
          element = await frame.waitForSelector(part, options);
        }
        if (!element) {
          throw new Error('Could not find element: ' + selector.join('>>'));
        }
        if (i < selector.length - 1) {
          element = (await element.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
        }
      }
      if (!element) {
        throw new Error('Could not find element: ' + selector.join('|'));
      }
      return element;
    }

    async function waitForFunction(fn, timeout) {
      let isActive = true;
      setTimeout(() => {
        isActive = false;
      }, timeout);
      while (isActive) {
        const result = await fn();
        if (result) {
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('Timed out');
    }

    async function sleep(timeout) {
      return await new Promise(resolve => setTimeout(resolve, timeout));
    }

    async function log(msg) {
      const currentDate = '[' + new Date().toLocaleString() + ']';
      console.log(currentDate, msg);
    }

    async function notify(msg) {
      log(msg);

      if (!userToken) {
        return;
      }

      const pushOverAppToken = 'an3sa5jq4j6jvfij1bkrkwesk6s2g9';
      const apiEndpoint = 'https://api.pushover.net/1/messages.json';
      const data = {
        token: pushOverAppToken,
        user: userToken,
        message: msg
      };

      await axios.post(apiEndpoint, data);
    }

    async function changevpn(count){
      if (counter%10==0){
        exec('C:\\Users\\rupen\\Desktop\\Batch.bat', (err, stdout, stderr) => {
          if (err) {
          console.error(err);
          return;
          }
          console.log(stdout);
        });
        console.log("Changing VPN");
        await sleep(30000);
      }
    }
    //#endregion

    async function runLogic() {
      //#region Init puppeteer
      const browser = await puppeteer.launch();
      //Comment above line and uncomment following line to see puppeteer in action
      //const browser =  await puppeteer.launch({headless: false});
      const page = await browser.newPage();
      const timeout = 5000;
      const navigationTimeout = 60000;
      const smallTimeout = 100;
      const stepTimeout = 0;
      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(navigationTimeout);
      //#endregion
    
      //#region Logic
	  
      // Set the viewport to avoid elements changing places 
      {
          const targetPage = page;
          await targetPage.setViewport({"width":2078,"height":1479})
      }

      // Go to login page
      {   
          const client = await page.target().createCDPSession();
          await client.send('Network.clearBrowserCookies');
          await client.send('Network.clearBrowserCache');
          const targetPage = page;
          await targetPage.goto('https://ais.usvisa-info.com/en-' + region + '/niv/users/sign_in', { waitUntil: 'domcontentloaded' });
          counter = counter + 1;
      }

      // Click on username input
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Email *"],["#user_email"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 118, y: 21.453125} });
      }

      // Type username
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Email *"],["#user_email"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          const type = await element.evaluate(el => el.type);
          if (["textarea","select-one","text","url","tel","search","password","number","email"].includes(type)) {
            await element.type(usernameInput);
          } else {
            await element.focus();
            await element.evaluate((el, value) => {
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, usernameInput);
          }
      }
	  
      // Hit tab to go to the password input
      {
          const targetPage = page;
          await targetPage.keyboard.down("Tab");
      }
      {
          const targetPage = page;
          await targetPage.keyboard.up("Tab");
      }
	  
      // Type password
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Password"],["#user_password"]], targetPage, { timeout, visible: true });
		  await scrollIntoViewIfNeeded(element, timeout);
          const type = await element.evaluate(el => el.type);
          if (["textarea","select-one","text","url","tel","search","password","number","email"].includes(type)) {
            await element.type(passwordInput);
          } else {
            await element.focus();
            await element.evaluate((el, value) => {
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, passwordInput);
          }
          await sleep(stepTimeout);
      }
	  
      // Tick the checkbox for agreement
      {
          const targetPage = page;
          const element = await waitForSelectors([["#sign_in_form > div.radio-checkbox-group.margin-top-30 > label > div"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 9, y: 16.34375} });
      }
      
      // Click login button
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Sign In[role=\"button\"]"],["#new_user > p:nth-child(9) > input"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 34, y: 11.34375} });
          await targetPage.waitForNavigation();
          await sleep(stepTimeout);
      }

      // We are logged in now. Check available dates from the API
      {
          const targetPage = page;
          await targetPage.setExtraHTTPHeaders({
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest'
          });
          //const response = await targetPage.goto('https://ais.usvisa-info.com/en-' + region + '/niv/schedule/' + appointmentId + '/appointment/days/' + consularId + '.json?appointments[expedite]=false');
          const response = await targetPage.goto('https://ais.usvisa-info.com/en-'+region+'/niv/schedule/'+appointmentId+'/appointment/days/'+consularId+'.json?appointments%5Bexpedite%5D=false');

          const availableDates = JSON.parse(await response.text());
          //console.log(availableDates);
          //datesArray = availableDates;

          if (availableDates.length <= 0) {
            log("There are no available dates for consulate with id " + consularId)
            console.log(counter);
            //Change VPN 
            changevpn(counter);
            await browser.close();
            console.log("Cooling down for 4 hrs");
            counter = 0;
            await sleep(1*3600*1000);
            return false;
          }
          
          //Taking the first available date in the list
          const firstDate = new Date(availableDates[0].date);

          if (earliestDate > firstDate){
            earliestDate = firstDate;
          }
          
          //Print earliest date available
          console.log(earliestDate.toISOString().slice(0,10));
         
          if (firstDate > currentDate || firstDate < fromDate) {
            log("There is not an earlier date available than " + currentDate.toISOString().slice(0,10));
            console.log(counter);
            changevpn(counter);
            await browser.close();
            return false;
          }

          notify("Found an earlier date! " + firstDate.toISOString().slice(0,10));
      } 

      // Go to appointment page
      {
          const targetPage = page;
          await targetPage.goto('https://ais.usvisa-info.com/en-' + region + '/niv/schedule/' + appointmentId + '/appointment', { waitUntil: 'domcontentloaded' });
          //await sleep(500);
      }     

      // Select multiple people if it is a group appointment
      {
          if(groupAppointment){
            const targetPage = page;
            const element = await waitForSelectors([["aria/Continue"],["#main > div.mainContent > form > div:nth-child(3) > div > input"]], targetPage, { timeout, visible: true });
            await scrollIntoViewIfNeeded(element, timeout);
            await element.click({ offset: { x: 70.515625, y: 25.25} });
            //await sleep(1000);
          }
      }

      // Select the specified consular from the dropdown
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Consular Section Appointment","aria/[role=\"combobox\"]"],["#appointments_consulate_appointment_facility_id"]], targetPage, { timeout, visible: true });
          //await scrollIntoViewIfNeeded(element, timeout);    
          await page.select("#appointments_consulate_appointment_facility_id", consularId);
          //await sleep(500);
      }

      // Click on date input
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Date of Appointment *"],["#appointments_consulate_appointment_date"]], targetPage, { timeout, visible: true });
          //await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 394.5, y: 17.53125} });
          //await sleep(500);
      }

      // Keep clicking next button until we find the first available date and click to that date
      {
          const targetPage = page;
          while (true) {
            try {
              const element = await waitForSelectors([["aria/25[role=\"link\"]"],["#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group > table > tbody > tr > td.undefined > a"]], targetPage, { timeout:smallTimeout, visible: true });
              
              const targetSelector = '#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group > table > tbody > tr > td.undefined > a';
              //Getting the date on the UI
              const avaiblabeDate = await page.evaluate(targetSelector => {
                const element = document.querySelector(targetSelector);
                return element ? element.textContent : null;
              }, targetSelector);
              const compDate = (earliestDate.toISOString().slice(8,10))*1;
              console.log("API Date = ", compDate);
              console.log("UI Date", avaiblabeDate);

              //Comparing date from API and UI
              if(avaiblabeDate==compDate){
                //await scrollIntoViewIfNeeded(element, timeout);
                await page.click('#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group > table > tbody > tr > td.undefined > a');
              }
              else{
                console.log("Dates do not match");
                notify("Dates did not match");
              }
              await sleep(500);
              break;
            } catch (err) {
              {
                  const targetPage = page;
                  const element = await waitForSelectors([["aria/Next","aria/[role=\"generic\"]"],["#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group-last > div > a > span"]], targetPage, { timeout, visible: true });
                  //await scrollIntoViewIfNeeded(element, timeout);
                  await element.click({ offset: { x: 4, y: 9.03125} });
              }
            }
          }
      }

      // Select the first available Time from the time dropdown
      {
          const targetPage = page;
          const element = await waitForSelectors([["#appointments_consulate_appointment_time"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          await page.evaluate(() => {
            document.querySelector('#appointments_consulate_appointment_time option:nth-child(2)').selected = true;
            const event = new Event('change', {bubbles: true});
            document.querySelector('#appointments_consulate_appointment_time').dispatchEvent(event);
          })
          //await sleep(1000);
      }

      // Click on reschedule button
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Reschedule"],["#appointments_submit"]], targetPage, { timeout, visible: true });
          //await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 78.109375, y: 20.0625} });
          //await sleep(1000);
      }

      // Click on submit button on the confirmation popup
      {
        const targetPage = page;
        const element = await waitForSelectors([["aria/Cancel"],["body > div.reveal-overlay > div > div > a.button.alert"]], targetPage, { timeout, visible: true });
        //await scrollIntoViewIfNeeded(element, timeout);
        await page.click('body > div.reveal-overlay > div > div > a.button.alert');
        await sleep(1000);
      }

      await browser.close();
      return true;
      //#endregion
    }

    while (true){
      try{
        const result = await runLogic();

        if (result){
          notify("Successfully scheduled a new appointment");
          break;
        }
      } catch (err){
        // Swallow the error and keep running in case we encountered an error.
      }
      if (counter%50==0){
        console.log("cooling down for 30 minutes");
        await sleep(1800*1000);
      }
      await sleep(retryTimeout);
    }
})();
