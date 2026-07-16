import { Vault } from "./vault";

const senha = "MinhaSenha123";

const criptografada = Vault.encrypt(senha);

console.log(criptografada);

console.log(Vault.decrypt(criptografada!));