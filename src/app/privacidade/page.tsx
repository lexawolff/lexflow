import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  Fill,
  LegalDocument,
  LegalList,
  LegalSection,
} from "@/features/legal/components/legal-document";

import {
  getLegalProvider,
  SUBPROCESSORS,
} from "@/features/legal/legal-info";

export const metadata: Metadata = {
  title: "Política de Privacidade",
};

/*
 * MINUTA — revisar antes de publicar.
 * Dados do Fornecedor e suboperadores: src/features/legal/legal-info.ts
 */
export default function PrivacidadePage() {
  const provider = getLegalProvider();

  return (
    <LegalDocument title="Política de Privacidade do LexFlow">
      <LegalSection title="1. Sobre esta política">
        <p>
          Esta Política explica como{" "}
          <strong><Fill value={provider.name} /></strong>, CPF nº{" "}
          <Fill value={provider.cpf} />, fornecedor do LexFlow
          (&quot;Fornecedor&quot;), trata os dados pessoais das pessoas que
          usam o sistema: proprietários de escritórios e membros de suas
          equipes.
        </p>

        <p>
          Os dados que os escritórios cadastram sobre os próprios clientes
          (por exemplo, CPF, documentos e credenciais Gov.br) são de
          responsabilidade de cada escritório, que é o controlador desses
          dados. Para eles, o Fornecedor atua como operador, conforme o{" "}
          <Link href="/termos#anexo-tratamento" className="text-primary underline">
            Anexo I dos Termos de Uso
          </Link>. Pedidos sobre esses dados devem ser feitos ao escritório
          responsável.
        </p>
      </LegalSection>

      <LegalSection title="2. Dados que tratamos">
        <LegalList>
          <li>
            <strong>Cadastro e conta:</strong> nome, e-mail, nome do
            escritório, CPF ou CNPJ informado ao cadastrar o escritório, função
            na equipe e data de aceite destes documentos. Se informados:
            WhatsApp, cidade, UF e número da OAB. A senha é guardada pelo
            provedor de autenticação em formato protegido; o Fornecedor não tem
            acesso a ela.
          </li>
          <li>
            <strong>Controle de cadastro e do teste gratuito:</strong> código
            gerado com chave secreta a partir do CPF ou da parte do CNPJ comum
            à matriz e às filiais, usado para impedir que o mesmo titular abra
            mais de um escritório pelo cadastro público.
          </li>
          <li>
            <strong>Uso e segurança:</strong> registros de acesso (como data,
            hora e endereço IP, mantidos pelo provedor de autenticação),
            registros de quem visualizou ou copiou senhas Gov.br e histórico
            de ações no sistema.
          </li>
          <li>
            <strong>Integração com o Google Agenda (opcional):</strong> e-mail
            da conta Google conectada e chave de acesso cifrada, usadas apenas
            para sincronizar os compromissos criados no LexFlow.
          </li>
          <li>
            <strong>Cobrança:</strong> dados de faturamento informados pelo
            escritório na área de assinatura (nome ou razão social, CPF/CNPJ,
            contato e endereço).
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Para que usamos e com qual base legal">
        <LegalList>
          <li>
            Criar e manter as contas, permitir o login e prestar o serviço
            contratado: execução de contrato (art. 7º, V, da LGPD).
          </li>
          <li>
            Proteger as contas, investigar acessos indevidos e prevenir
            fraudes: legítimo interesse (art. 7º, IX) e cumprimento de
            obrigação legal (art. 7º, II), quando aplicável.
          </li>
          <li>
            Impedir a repetição do período de teste gratuito e o uso indevido
            do cadastro: legítimo interesse (art. 7º, IX).
          </li>
          <li>
            Enviar e-mails do serviço, como confirmação de cadastro e
            redefinição de senha: execução de contrato.
          </li>
          <li>
            Cobrar pelo serviço e emitir documentos fiscais: execução de
            contrato e cumprimento de obrigação legal.
          </li>
        </LegalList>

        <p>
          O LexFlow não vende dados, não exibe publicidade e não usa os dados
          para criar perfis de marketing.
        </p>
      </LegalSection>

      <LegalSection title="4. Com quem compartilhamos">
        <p>
          Apenas com os provedores necessários para o funcionamento do serviço
          e, quando exigido, com autoridades competentes:
        </p>

        <LegalList>
          {SUBPROCESSORS.map((item) => (
            <li key={item.name}>
              <strong><Fill value={item.name} />:</strong> {item.purpose}{" "}
              <Fill value={item.location} />
            </li>
          ))}
        </LegalList>
      </LegalSection>

      <LegalSection title="5. Transferência internacional">
        <p>
          O banco de dados e a execução do sistema ficam em São Paulo. Como os
          provedores são empresas estrangeiras, pode haver acesso ou
          processamento no exterior, com base nas garantias contratuais
          oferecidas por eles (art. 33 da LGPD).
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies">
        <p>
          O LexFlow usa apenas cookies necessários para manter a sessão de
          login e a segurança do acesso. Não usamos cookies de publicidade nem
          ferramentas de rastreamento de terceiros.
        </p>
      </LegalSection>

      <LegalSection title="7. Por quanto tempo guardamos">
        <LegalList>
          <li>Dados da conta: enquanto a conta existir.</li>
          <li>
            Cadastros não confirmados: apagados automaticamente cerca de 7 dias
            depois da solicitação.
          </li>
          <li>
            Código de controle do cadastro: mantido mesmo após o encerramento
            da conta, enquanto for necessário para impedir a repetição do teste
            gratuito.
          </li>
          <li>
            Após o encerramento: conforme a cláusula 10 dos Termos de Uso
            (30 dias para exportação e exclusão em até 60 dias).
          </li>
          <li>
            Registros de segurança e de acesso: pelo tempo necessário para
            proteger o serviço ou cumprir obrigações legais.
          </li>
          <li>
            Dados de cobrança: pelo prazo exigido pela legislação fiscal.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="8. Segurança">
        <p>
          Adotamos medidas como comunicação protegida por HTTPS, criptografia
          de credenciais sensíveis, controle de acesso por funções, separação
          dos dados de cada escritório, armazenamento privado de documentos e
          registro de acessos a informações críticas. Nenhum sistema é
          totalmente imune a falhas; em caso de incidente relevante, os
          afetados e a ANPD serão comunicados na forma da lei.
        </p>
      </LegalSection>

      <LegalSection title="9. Seus direitos">
        <p>
          Você pode solicitar, a qualquer momento: confirmação da existência
          de tratamento; acesso aos dados; correção de dados incompletos ou
          desatualizados; anonimização, bloqueio ou eliminação de dados
          desnecessários; portabilidade; informação sobre compartilhamentos;
          e revisão de decisões automatizadas, quando houver (art. 18 da LGPD).
          Também pode apresentar reclamação à Autoridade Nacional de Proteção
          de Dados (ANPD).
        </p>

        <p>
          Os pedidos podem ser feitos pelo e-mail{" "}
          <Fill value={provider.email} /> e serão respondidos em até 15
          (quinze) dias.
        </p>
      </LegalSection>

      <LegalSection title="10. Encarregado e contato">
        <p>
          O contato para assuntos de privacidade e proteção de dados é o
          próprio Fornecedor, pelo e-mail <Fill value={provider.email} />,
          ou pelo endereço <Fill value={provider.address} />.
        </p>
      </LegalSection>

      <LegalSection title="11. Alterações">
        <p>
          Esta Política pode ser atualizada. A versão e a data em vigor ficam
          no topo da página, e mudanças relevantes serão comunicadas por
          e-mail ou dentro do sistema.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
