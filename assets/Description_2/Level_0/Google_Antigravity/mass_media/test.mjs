import puppeteer from 'puppeteer';
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('http://localhost:8000/test-tailwind.html', {waitUntil: 'networkidle0'});
const color = await page.evaluate(() => {
    const el = document.querySelector('.text-red-500');
    return el ? window.getComputedStyle(el).color : 'not found';
});
console.log("Color applied:", color);
await browser.close();
