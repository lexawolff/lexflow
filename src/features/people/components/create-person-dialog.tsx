import { createPerson } from "../actions/create-person";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CreatePersonDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button className="bg-primary text-primary-foreground hover:bg-primary-light" />}>
        Nova pessoa
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova pessoa</DialogTitle>
          <DialogDescription>
            Cadastre uma pessoa para futuramente vincular a atendimentos e casos.
          </DialogDescription>
        </DialogHeader>

        <form action={createPerson} className="space-y-3">
          <Input name="name" placeholder="Nome completo" required />
          <Input name="cpf" placeholder="CPF" />
          <Input name="phone" placeholder="Telefone" />
          <Input name="whatsapp" placeholder="WhatsApp" />
          <Input name="email" placeholder="E-mail" />
          <Input name="profession" placeholder="Profissão" />
          <Input name="city" placeholder="Cidade" />
          <Input name="state" placeholder="Estado" />
          <Input name="notes" placeholder="Observações" />

          <Button type="submit" className="w-full">
            Salvar pessoa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}