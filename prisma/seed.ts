import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: "onurza@mail.ru" } });
  if (!existing) {
    const hashed = await bcrypt.hash("nurza1300", 10);
    await prisma.user.create({
      data: {
        name: "Нурзаман Оморалиевич",
        email: "onurza@mail.ru",
        password: hashed,
        role: "super_admin",
      },
    });
    console.log("Super admin created: onurza@mail.ru / nurza1300");
  } else {
    console.log("Super admin already exists");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
