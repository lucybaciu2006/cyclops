import axios from 'axios';
import fs from 'fs';

const link = 'https://www.booking.com/hotel/ro/the-episode-jacuzzi-penthouse.ro.html'
const link2 = 'https://www.booking.com/hotel/ro/joy-city-stay-paul-chinezu-3.ro.html'
const link3 = 'https://www.airbnb.com/rooms/46001315'

const bookingSelectors = {
    'name': '#hp_hotel_name > div > h2',
    'description': 'div.hp-description',
    'facilities': '#hp_facilities_box',
    'policies': '#policies',
    'image' : '#photo_wrapper'
}

const airbnbSelectors = {
    // 'name': '[data-plugin-in-point-id="TITLE_DEFAULT"]',
    // 'description': '[data-plugin-in-point-id="DESCRIPTION_DEFAULT"]',
    'facilities': '[data-plugin-in-point-id="AMENITIES_DEFAULT"] button',
    // 'policies': '#policies',
    // 'image' : '[data-plugin-in-point-id="HERO_DEFAULT"]'
}


async function getBookingRawData() {
    const response = await axios.get(link);
    return response.data;
}

function saveToFile(data: any) {
    fs.writeFileSync('booking.json', JSON.stringify(data));
}

async function getBookingData(selector: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link2, { waitUntil: 'networkidle0' });
    // const data = await page.content();

  // Wait for the div.hp-description container to load
  await page.waitForSelector(selector, { visible: true });

  // Extract the full description text
  const text = await page.$eval(selector, (el: any) =>
    el?.map((element: { textContent: string; })=>
        element?.textContent?.trim()
    )
  );


    await browser.close();
    return text;
}

async function getBookingDataWithChildren(selector: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link2, { waitUntil: 'networkidle0' });
    // const data = await page.content();
    let text = '';
   const parent = page.$(selector);
   try {
      const children = await (await parent)?.$$('> *');
      if (children) {
        for (const child of children) {
          text += await page.evaluate((el: Element) => {
            return el.textContent?.trim() || '';
          }, child);
          console.log(text);
        }
      } else {
        text = await page.evaluate((el) => el?.textContent?.trim() || '', await parent);
        console.log(text);
      }
   }
   catch(e) {
      console.log(e);
   }


   await browser.close();
    return text;
}


async function getBookingDataWithChildren2(selector: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link2, { waitUntil: 'networkidle0' });
    // const data = await page.content();
    let text = '';
    const descendants = await page.$$eval(selector, (elements: Element[]) => {
        return elements.map(element => element.textContent?.trim() || '');
    });
    text = descendants.join(' ');
    console.log(text);

   await browser.close();
    return text;
}

async function getAirbnbData(selector: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link3, { waitUntil: 'networkidle0' });
    // const data = await page.content();

  // Wait for the div.hp-description container to load
  await page.waitForSelector('[data-section-id="DESCRIPTION_DEFAULT"]', { visible: true });

  // Extract the full description text
  const text = await page.$eval('[data-section-id="DESCRIPTION_DEFAULT"]', (el: any) =>
    el?.textContent?.trim()
  );


    await browser.close();
    return text;
}

async function customFunction(selector: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link3, { waitUntil: 'networkidle0' });

     // Confirm the element exists
    const contentEl = await page.$(selector);
    const content = await page.evaluate((el: any) => el.innerText.trim(), contentEl);
    console.log('Content:', content);

    await browser.close();
    return content;
}


async function getAirbnbModalData(selector: string) {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(link3, { waitUntil: 'networkidle0' });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });

    const button = await page.$(selector);
    const text = await button?.evaluate((el: any) => el.innerText.trim());
    console.log('Button text:', text);
    if (text?.includes('Show all')) {
        console.log('Button text:', text);
    }
    if (button) {
        await button.evaluate((el: Element) => {
            if (el instanceof HTMLElement) {
                el.click();
            }
        });
    }

    await page.waitForNetworkIdle(); // Use waitForNetworkIdle instead of deprecated waitForTimeout

    // 2. Wait for the new <section> to appear (adjust selector if needed)
    await page.waitForSelector('section', { visible: true });

    const sectionTexts = await page.$$eval('section', sections =>
      sections.map(section => section.innerText.trim()).filter(text => text.length > 0)
    );
    
    console.log('Section Texts:', sectionTexts);

    // const container = await page.evaluate((el: any) => el.innerText.trim(), contentEl);

    // if (container) {
    //     const buttons = await container.$$('button');
    //     console.log('Buttons:', buttons);
      
    //       const text = await page.evaluate((el: any) => el.innerText.trim(), buttons[0]);
      
    //       if (text.includes('Show all')) {
    //         console.log('Text:', text);
    //         await buttons[0].evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    //         await buttons[0].click();            console.log('Clicked the amenities expand button!');
    //     }
        
    //   } else {
    //     console.log('Amenities container not found');
    //   }

    // // 2. Wait for the modal to appear
    // await page.waitForSelector('[aria-modal="true"]', { visible: true }); // <- Use actual modal selec
    // // 3. Extract all elements (or just text) from the modal
    // const modalData = await page.$$eval('[aria-modal="true"] *', elements =>
    //   elements.map((el: any) => el.innerText.trim()).filter(Boolean)
    // );
    // console.log('Modal contents:', modalData);

    await browser.close();
    return '';

}

// async function getAirbnbModalData(selector: string) {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto(link3, { waitUntil: 'networkidle0' });

//     const button = await page.$("//button[contains(text(), 'Show all') and contains(text(), 'amenities')]");
//     if (button) {
//       await button.click();
//     } else {
//       console.log("Button not found");
//     }
    
//   // 2. Wait for the modal to appear
//   await page.waitForSelector('modal-container', { visible: true }); // <- Use actual modal selector

//   // 3. Extract all elements (or just text) from the modal
//   const modalData = await page.$$eval('modal-container *', elements =>
//     elements.map((el: any) => el.innerText.trim()).filter(Boolean)
//   );

//   console.log('Modal contents:', modalData);

//   await browser.close();
//   return modalData;
// }

async function getImg(selector: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(link2, { waitUntil: 'networkidle0' });
     // Wait for the image container
    await page.waitForSelector(selector, { visible: true });
  // Extract the image URL (src)
  const imgSrc = await page.$eval(selector, (img: any) => img.src);

  await browser.close();
  return imgSrc;
}

async function main() {
    // const data = await getBookingRawData();
    // const selector = '#hp_hotel_name > div > h2';
    // const data = await getBookingData(selector);


    const results: any = {};
    
    // Loop through all selectors
    for (const [key, selector] of Object.entries(airbnbSelectors)) {
        try {
            if (key === 'image') {
                const imgSrc = ' ';
                // const imgSrc = await getImg(selector + ' img');
                results[key] = imgSrc;
            } else {
                // const text = await customFunction(selector);
                const text = await getAirbnbModalData(selector)
                results[key] = text;
            }
        } catch (error) {
            console.log(`Failed to get ${key}: ${error}`);
            results[key] = null;
        }
    }
    saveToFile(results);
    // console.log('hotel description: ', data);
}

const test = () => {
  const facilities = PropertyFacilitiesUtils.emptyFacilities();
  const stringifiedFacilities = JSON.stringify(facilities);
  console.log(stringifiedFacilities);
}

main();
// test();

