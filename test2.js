const { Cluster } = require('puppeteer-cluster');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
  });

  const results = [];
  await cluster.task(async ({ page, data: {productId} }) => {
    await page.goto(`https://www.aliexpress.com/item/${productId}.html`);
    // const screen = await page.screenshot();
    const result = await page.evaluate(() => document.title);
    results.push(result)
    // Store screenshot, do something else
  });

  cluster.queue({productId: 'http://www.google.com/'});
  // many more pages

  await cluster.idle();
  await cluster.close();
  console.log(results);
})();