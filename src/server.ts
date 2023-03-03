import fastify from "fastify";
import { z } from "zod"
import fs from "fs";
import path from "path";
import https from "https";
import puppeteer from "puppeteer";

const app = fastify();

app.post("/url", async (request, reply) => {
  console.time()
  const createUserSchema = z.object({
    url: z.string().url()
  })

  const { url } = createUserSchema.parse(request.body);

  try {
    const browser = await puppeteer.launch({
      headless: true
    });
    const page = await browser.newPage();
  
    await page.goto(url);
  
    await page.waitForNavigation({waitUntil: 'networkidle2'});
  
    if (await page.url().includes('login')) {
      console.log({vou: 'logar'})
      await page.type('input[name="username"]', '93carmogabriel@gmail.com')
      await page.type('input[name="password"]', 'C@rmo167')
      console.log({vou: 'clickar pra logar'})
      page.click('button[type=submit]')
      await page.waitForNavigation()
      console.log({vou: 'redirecionar pra url'})
      await page.goto(url)
      console.log({vou: 'esperar carregar'})
      // await page.waitForNavigation({waitUntil: 'networkidle2'})
    }
  
    console.log({vou: 'procurar o Main'})
  
    await page.waitForSelector('main', { timeout: 4000})
    console.log({passou: 'de ver o main'})
  
    const src = await page.$eval('video', n => n.getAttribute('src'))
    console.log({src})
  
    await browser.close();

    if (!src) {
      console.timeEnd()
      return reply.status(400).send({ error: `Sorry! Couldn't find URL 😢` })
    }

    console.log({vou: 'salvar o video'})

    // reply.status(200).send({ src })
    const filename = `video${new Date().getTime()}.mp4`

    async function clearFiles() {
      const files = await fs.readdirSync(path.join(__dirname, 'files'))
      files.forEach(async file => {
        await fs.unlinkSync(path.join(__dirname, 'files', file))
      })
    }

    await clearFiles();
    const file = fs.createWriteStream(path.join(__dirname, 'files', filename));
    console.log({criei: 'o arquivo'})

    // const requestFile = await https.get(src)
    
    const requestFile = https.get(src, function(response: any) {
      console.log()
      response.pipe(file);

      file.on("finish", () => {
        file.close();
        console.log("Download Completed!")
      })
    })

    console.log({terminei: 'o download'})
    reply.send({ downloadUrl: `${process.env.SELF_HOST}/files/${filename}` })
  } catch (err) {
    reply.status(400).send({ error: err })
  }
})

app.get('/files/:filename', (request, reply) => {
  const filename: string = (request.params as any)?.filename || ''

  if (!filename) {
    return reply.status(400).send({ error: 'Filename is required' })
  }

  const fileStream = fs.createReadStream(path.join(__dirname, 'files', filename))

  fileStream.on('error', (err) => {
    reply.status(400).send({ error: err })
  })

  reply.header('Content-Type', 'video/mp4')
  reply.header('Content-Disposition', `attachment; filename=${filename}`)
  reply.header('Content-Length', fs.statSync(path.join(__dirname, 'files', filename)).size.toString())
  
  fileStream.pipe(reply.raw)
})

app
  .listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333
  })
  .then(() => console.log('HTTP Server is running!'))
  .catch((err) => console.error(err));