const express = require("express");
const app = express();
const router = express.Router();
const serverless = require("serverless-http");
const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const CsvParser = require("json2csv").Parser;

router.get("/", (req, res) => {
  res.send("App is running..");
});

router.post("", async (req, res) => {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ||
      (await chromium.executablePath),
    headless: true,
  });

  if (req.body) {
    const keyword = req.body.keyword;
    console.log(`Scraping URLs for keyword: ${keyword}`);
    const page = await browser.newPage();
    const url = `https://www.google.com/search?q=${keyword}`;
    await page.goto(url);
    let urls = [];
    while (urls.length < 30) {
      const currentUrls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a"));
        const urls = links.map((link) => link.href);
        const nonGoogleUrls = urls.filter((url) => {
          return (
            !url.includes("google.") &&
            !url.includes("webcache.googleusercontent.com")
          );
        });
        return nonGoogleUrls;
      });
      urls = [...urls, ...currentUrls];
      urls = Array.from(new Set(urls));
      const nextButton = await page.$("#pnnext");
      if (urls.length >= 30 || !nextButton) {
        break;
      }
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click("#pnnext"),
      ]);
    }
    const foundedUrls = urls.slice(0, 30).map((url) => ({ url }));
    console.log(`Finished scraping URLs`);
    await browser.close();
    foundedUrls.splice(0, 1);
    const csvParser = new CsvParser({});
    const csvData = csvParser.parse(foundedUrls);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=tutorials.csv");
    res.status(200).end(csvData);
  }
});

app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);
