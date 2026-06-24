import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

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
