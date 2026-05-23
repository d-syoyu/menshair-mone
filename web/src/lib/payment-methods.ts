import { unstable_cache } from "next/cache";
import { logDatabaseFallback, prisma } from "@/lib/db";

export interface PublicPaymentMethod {
  code: string;
  displayName: string;
}

export const PAYMENT_METHODS_CACHE_TAG = "payment-methods";

export const getCachedPaymentMethods = unstable_cache(
  async (): Promise<PublicPaymentMethod[]> => {
    if (!process.env.DATABASE_URL) {
      console.warn("[Payment Methods] DATABASE_URL is not configured");
      return [];
    }

    try {
      return await prisma.paymentMethodSetting.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: {
          code: true,
          displayName: true,
        },
      });
    } catch (error) {
      logDatabaseFallback("Payment Methods", error, "empty payment-method list");
      return [];
    }
  },
  [PAYMENT_METHODS_CACHE_TAG],
  {
    tags: [PAYMENT_METHODS_CACHE_TAG],
    revalidate: 3600,
  }
);
