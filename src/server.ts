import fastify from "fastify";
import { z } from "zod"
import { PrismaClient } from "@prisma/client";

const app = fastify();

const prisma = new PrismaClient();

app.get("/users", async () => {
  const users = await prisma.user.findMany();

  return { users }
})

app.post("/users", async (request, reply) => {
  const createUserSchema = z.object({
    name: z.string(),
    email: z.string().email()
  })

  const { name, email } = createUserSchema.parse(request.body);

  await prisma.user.create({
    data: {
      name,
      email
    }
  })
  
  reply.status(201).send({ message: "User created" })
})

app
  .listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333
  })
  .then(() => console.log('HTTP Server is running'))
  .catch((err) => console.error(err));