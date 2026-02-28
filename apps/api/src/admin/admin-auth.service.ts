import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "@ournigeria/database";

const SALT_ROUNDS = 10;

@Injectable()
export class AdminAuthService {
  constructor(private prisma: PrismaService) {}

  async login(
    email: string,
    password: string,
  ): Promise<
    | {
        success: true;
        admin: { id: string; email: string; name: string };
        token: string;
      }
    | { success: false; error: string }
  > {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return { success: false, error: "Invalid email or password" };
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return { success: false, error: "Invalid email or password" };
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate a session token: adminId:randomHex, signed with HMAC
    const nonce = crypto.randomBytes(16).toString("hex");
    const payload = `${admin.id}:${nonce}`;
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) throw new Error("ADMIN_SESSION_SECRET is required");
    const sig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    const token = `${payload}:${sig}`;

    return {
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name },
      token,
    };
  }

  verifyToken(token: string): string | null {
    const parts = token.split(":");
    if (parts.length !== 3) return null;

    const [adminId, nonce, sig] = parts;
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) return null;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${adminId}:${nonce}`)
      .digest("hex");

    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }
    return adminId;
  }

  async getAdmin(id: string) {
    return this.prisma.adminUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  async createAdmin(
    createdById: string,
    data: { email: string; password: string; name: string },
  ) {
    const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    return this.prisma.adminUser.create({
      data: {
        email: data.email,
        passwordHash: hash,
        name: data.name,
        createdById,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  async listAdmins() {
    return this.prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async deleteAdmin(id: string) {
    return this.prisma.adminUser.delete({ where: { id } });
  }

  async ensureDefaultAdmin() {
    const count = await this.prisma.adminUser.count();
    if (count > 0) return;

    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!seedPassword || seedPassword.length < 12) {
      console.warn(
        "No admin users exist. Set ADMIN_SEED_PASSWORD (min 12 chars) to create a default admin on startup.",
      );
      return;
    }

    const hash = await bcrypt.hash(seedPassword, SALT_ROUNDS);
    await this.prisma.adminUser.create({
      data: {
        email: process.env.ADMIN_SEED_EMAIL || "admin@ournigeria.ng",
        passwordHash: hash,
        name: "Admin",
      },
    });
    console.log("Default admin created. Change the password immediately.");
  }
}
