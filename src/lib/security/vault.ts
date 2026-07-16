import { encrypt } from "./encrypt";
import { decrypt } from "./decrypt";

export class Vault {
  /**
   * Criptografa um valor antes de salvar no banco.
   */
  static encrypt(value: string | null | undefined): string | null {
    if (!value) return null;

    return encrypt(value);
  }

  /**
   * Descriptografa um valor recuperado do banco.
   */
  static decrypt(value: string | null | undefined): string | null {
    if (!value) return null;

    return decrypt(value);
  }
}