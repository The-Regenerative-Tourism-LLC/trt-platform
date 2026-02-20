import { prisma } from "./prisma"

export async function createProvider(name: string, email: string) {
  return prisma.provider.create({
    data: {
      name,
      email,
    },
  })
}

export async function getProviders() {
  return prisma.provider.findMany()
}