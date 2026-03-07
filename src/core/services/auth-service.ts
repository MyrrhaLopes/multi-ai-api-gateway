import { eq } from "drizzle-orm";
import { db } from "../db/drizzle-cient.ts";
import { apiKeysTable, usersTable } from "../db/schemas/test-schemas.ts";
import { ClientError } from "../../http/globals/errors/client-error.ts";

class AuthError extends ClientError {}

export class AuthService {
  static async authenticate(apiKey: string) {
    const selectedUser = await db
      .select({
        permitedRoutes: apiKeysTable.permitedRoutes,
        permitedModels: apiKeysTable.permitedModels,
      })
      .from(apiKeysTable)
      .where(eq(apiKeysTable.key, apiKey));
    if (selectedUser.length == 0) {
      throw new AuthError("Invalid or missing API key");
    }

    return selectedUser[0];
  }
}
