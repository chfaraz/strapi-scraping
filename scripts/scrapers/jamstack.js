"use strict";

const chalk = require("chalk");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const {
  getReport,
  getDate,
  getAllSG,
  scraperCanRun,
} = require("./utils/utils.js");
const { createSiteGenerators, updateScraper } = require("./utils/query.js");

let report = {};
let errors = [];
let newSG = 0;

const scrape = async (allSG, scraper) => {
  const url = "https://www.harrods.com/en-pk/shopping/a-emery";
  const browser = await puppeteer.launch(
    // {
    // userDataDir: "./user_data",
    // },
    {
      headless: true,
      slowMo: 1000, // slow down by 250ms
    },
    {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    }
  );
  const page = await browser.newPage();

  try {
    await page.goto(url);
    const html = await page.content();
    console.log(html);

    // await page.target().createCDPSession();
    await page.screenshot({ path: "example.png" });
  } catch (e) {
    console.log(`${chalk.red("Error")}: (${url})`);
    errors.push({
      context: "Page navigation",
      url: url,
      date: await getDate(),
    });
    return;
  }

  const expression = "//a[@class='css-io3gwt e7gi9o16']";
  const elements = await page.$x(expression);

  console.log(elements);
  await page.waitForXPath(expression);

  const promise = new Promise((resolve, reject) => {
    elements.forEach(async (element) => {
      let card = await page.evaluate((el) => el.innerHTML, element);
      let $ = cheerio.load(card);
      const image_url = $(".e7gi9o10").find("img").attr("src") || null;
      console.log(image_url);
      // Skip this iteration if the sg is already in db
      if (allSG.includes(image_url)) return;
      const brand = $(".e7gi9o112").text().trim() || null;
      const title = $(".e7gi9o114").text().trim() || null;
      const price = $(".e1h3wjaz1").text().trim() || null;
      //   const description = $(".text-sm.mb-4").text().trim() || null;
      //   const language =
      //     $('dt:contains("Language:")').next().text().trim() || null;
      //   const template =
      //     $('dt:contains("Templates:")').next().text().trim() || null;
      //   const license = $('dt:contains("License:")').next().text().trim() || null;
      //   const deployLink = $('a:contains("Deploy")').attr("href") || null;

      await createSiteGenerators(
        image_url,
        brand,
        title,
        price,
        // description,
        // language,
        // template,
        // license,
        // deployLink,
        scraper
      );
      newSG += 1;
    });
  });

  promise.then(async () => {
    await page.close();
    await browser.close();
  });
};

const main = async () => {
  // Fetch the correct scraper thanks to the slug
  const slug = "harrods-com";
  const scraper = await strapi.query("scraper").findOne({
    slug: slug,
  });

  // If the scraper doesn't exists, is disabled or doesn't have a frequency then we do nothing
  if (scraper == null || !scraper.enabled || !scraper.frequency) {
    console.log(
      `${chalk.red(
        "Exit"
      )}: (Your scraper may does not exist, is not activated or does not have a frequency field filled in)`
    );
    return;
  }

  const canRun = await scraperCanRun(scraper).catch((error) =>
    console.log(error)
  );
  if (canRun && scraper.enabled) {
    const allSG = await getAllSG(scraper);
    await scrape(allSG, scraper);
    report = await getReport(newSG);
    await updateScraper(scraper, report, errors);
  }
};

exports.main = main;
