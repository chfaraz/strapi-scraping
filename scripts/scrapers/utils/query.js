"use strict";

const chalk = require("chalk");

const createSiteGenerators = async (
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
) => {
  try {
    const entry = await strapi.query("items").create({
      image_url,
      brand,
      title,
      price,
      // description,
      // language,
      // template,
      // license,
      // deployLink,
      scraper: scraper.id,
    });
  } catch (e) {
    console.log(e);
  }
};

const updateScraper = async (scraper, report, errors) => {
  await strapi.query("scraper").update(
    {
      id: scraper.id,
    },
    {
      report: report,
      error: errors,
    }
  );

  console.log(`Job done for: ${chalk.green(scraper.name)}`);
};

module.exports = {
  createSiteGenerators,
  updateScraper,
};
