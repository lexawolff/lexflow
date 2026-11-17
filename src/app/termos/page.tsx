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
  title: "Termos de Uso",
};

/*
 * MINUTA — revisar antes de publicar.
 * Dados da fornecedora e suboperadores: src/features/legal/legal-info.ts
 */
export default function TermosPage() {
  const provider = getLegalProvider();

  return (
    <LegalDocument title="Termos de Uso do LexFlow">
      <LegalSection title="1. Partes">
        <p>
          Estes Termos regulam o uso do LexFlow, sistema de gestão para
          escritórios de advocacia fornecido por{" "}
          <strong><Fill value={provider.name} /></strong>, CPF nº <Fill value={provider.cpf} />, com endereço em{" "}
          <Fill value={provider.address} /> e contato pelo e-mail{" "}
          <Fill value={provider.email} /> (&quot;Fornecedor&quot;).
        </p>

        <p>
          &quot;Cliente&quot; é o escritório de advocacia ou advogado(a) que
          contrata o LexFlow, representado pela pessoa que realiza o cadastro
          e se torna proprietária da conta do escritório, a qual declara ter
          poderes para aceitar estes Termos em nome do Cliente.
          &quot;Usuários&quot; são as pessoas que o Cliente cadastra ou convida
          para usar o sistema.
        </p>
      </LegalSection>

      <LegalSection title="2. Objeto">
        <p>
          O Fornecedor concede ao Cliente, enquanto estes Termos estiverem
          vigentes, licença de uso não exclusiva e intransferível do LexFlow,
          acessado pela internet, para organizar clientes, processos, agenda,
          documentos, tarefas, financeiro e equipe do escritório.
        </p>

        <p>
          O LexFlow é uma ferramenta de gestão. O Fornecedor não presta
          serviços jurídicos nem consultoria, e nenhuma funcionalidade
          substitui o julgamento profissional do advogado.
        </p>
      </LegalSection>

      <LegalSection title="3. Cadastro, contas e equipe">
        <LegalList>
          <li>
            O Cliente deve informar dados verdadeiros e mantê-los atualizados.
          </li>
          <li>
            A pessoa proprietária administra a equipe: convida Usuários, define
            suas funções e permissões e remove acessos quando necessário.
          </li>
          <li>
            Login e senha são pessoais e intransferíveis. O Cliente responde
            pelos atos praticados pelos seus Usuários e deve avisar o
            Fornecedor imediatamente se suspeitar de uso indevido.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Uso permitido">
        <p>É proibido:</p>
        <LegalList>
          <li>usar o LexFlow para fins ilícitos ou contrários à ética profissional;</li>
          <li>inserir dados pessoais sem base legal adequada;</li>
          <li>tentar acessar dados de outros escritórios ou burlar controles de acesso e segurança;</li>
          <li>copiar, modificar, fazer engenharia reversa, revender ou sublicenciar o sistema;</li>
          <li>sobrecarregar intencionalmente o serviço ou usar meios automatizados não autorizados.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="5. Dados inseridos pelo Cliente">
        <p>
          Os dados que o Cliente insere no LexFlow, inclusive dados de seus
          próprios clientes, pertencem ao Cliente. Em relação a eles, o Cliente
          é o <strong>controlador</strong> e o Fornecedor atua como{" "}
          <strong>operador</strong>, nos termos da Lei nº 13.709/2018 (LGPD) e
          do <a href="#anexo-tratamento" className="text-primary underline">Anexo I</a>.
        </p>

        <p>
          O Cliente declara possuir base legal para tratar esses dados,
          inclusive os dados pessoais sensíveis, como documentos e informações
          de saúde usados em processos previdenciários, e se compromete a
          informar seus clientes sobre o tratamento, na forma da lei.
        </p>
      </LegalSection>

      <LegalSection title="6. Credenciais Gov.br de terceiros">
        <p>
          O LexFlow permite guardar o login e a senha Gov.br de clientes do
          escritório. Essas senhas são armazenadas criptografadas, só podem ser
          vistas ou copiadas por funções autorizadas e cada acesso é registrado.
        </p>

        <p>
          O Cliente é o único responsável por obter a autorização expressa de
          cada titular para guardar e usar sua credencial, por usá-la apenas no
          interesse do titular e dentro dos limites do mandato, e por orientar
          a troca da senha quando o atendimento terminar.
        </p>
      </LegalSection>

      <LegalSection title="7. Ferramenta de apoio">
        <p>
          Agenda, lembretes, fila de trabalho, cálculos de honorários,
          parcelas e valores de RPV/precatório são recursos de apoio. A
          conferência de prazos processuais, valores e informações cadastradas
          é responsabilidade do Cliente e de seus advogados.
        </p>

        <p>
          A integração com o Google Agenda é opcional e sincroniza apenas os
          compromissos criados no LexFlow. Eventos pessoais da conta Google do
          Usuário não são trazidos para o sistema.
        </p>
      </LegalSection>

      <LegalSection title="8. Disponibilidade e suporte">
        <p>
          O Fornecedor empregará esforços razoáveis para manter o LexFlow
          disponível e seguro, mas não garante funcionamento ininterrupto ou
          livre de erros. Poderão ocorrer interrupções para manutenção,
          atualizações ou por falhas de terceiros, como provedores de internet
          e de infraestrutura. O suporte é prestado pelo e-mail{" "}
          <Fill value={provider.email} />.
        </p>
      </LegalSection>

      <LegalSection title="9. Planos, período de teste e pagamento">
        <LegalList>
          <li>
            Valores, periodicidade, forma de pagamento e eventual período de
            teste gratuito são os informados no momento da contratação ou na
            área de assinatura do sistema.
          </li>
          <li>
            Em caso de atraso no pagamento, o Fornecedor poderá suspender o
            acesso após aviso prévio, sem apagar os dados durante o período
            previsto na cláusula 10.
          </li>
          <li>
            Os valores poderão ser reajustados, com aviso de pelo menos 30
            (trinta) dias.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="10. Cancelamento e devolução dos dados">
        <LegalList>
          <li>
            O Cliente pode cancelar a contratação a qualquer momento.
          </li>
          <li>
            Após o término, por qualquer motivo, os dados ficam disponíveis por
            30 (trinta) dias para que o Cliente solicite a exportação, que será
            entregue em formato eletrônico de uso comum (por exemplo, planilhas
            e os arquivos de documentos).
          </li>
          <li>
            Depois desse prazo, os dados serão excluídos em até 60 (sessenta)
            dias, inclusive das cópias de segurança conforme o ciclo de
            renovação delas, salvo quando a lei exigir a guarda.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="11. Propriedade intelectual">
        <p>
          O LexFlow, sua marca, código e conteúdo são de titularidade do
          Fornecedor. Estes Termos não transferem ao Cliente nenhum direito
          sobre o software além da licença de uso prevista na cláusula 2.
        </p>
      </LegalSection>

      <LegalSection title="12. Limitação de responsabilidade">
        <p>
          Na extensão permitida pela lei, o Fornecedor não responde por danos
          indiretos ou lucros cessantes, por perda de prazo ou prejuízo
          decorrente da falta de conferência das informações pelo Cliente, por
          falhas de serviços de terceiros fora de seu controle, nem por uso
          indevido de credenciais pelo Cliente ou por seus Usuários. A
          responsabilidade total do Fornecedor fica limitada ao valor pago
          pelo Cliente nos 12 (doze) meses anteriores ao fato.
        </p>
      </LegalSection>

      <LegalSection title="13. Alterações destes Termos">
        <p>
          O Fornecedor poderá atualizar estes Termos, informando o Cliente com
          pelo menos 15 (quinze) dias de antecedência por e-mail ou dentro do
          sistema. Mudanças relevantes poderão exigir novo aceite. A versão e a
          data em vigor constam no topo desta página.
        </p>
      </LegalSection>

      <LegalSection title="14. Comunicações, lei e foro">
        <p>
          As comunicações serão feitas pelo e-mail da pessoa proprietária da
          conta e pelo e-mail <Fill value={provider.email} />. Estes Termos são
          regidos pela lei brasileira. Fica eleito o foro da comarca de{" "}
          <Fill value={provider.forum} /> para resolver eventuais controvérsias.
        </p>

        <p>
          O tratamento de dados das pessoas que usam o sistema está descrito na{" "}
          <Link href="/privacidade" className="text-primary underline">
            Política de Privacidade
          </Link>.
        </p>
      </LegalSection>

      <div className="border-t pt-8">
        <LegalSection
          id="anexo-tratamento"
          title="Anexo I — Tratamento de dados pessoais pelo operador"
        >
          <p>
            Este Anexo integra os Termos e regula o tratamento, pelo
            Fornecedor (operador), dos dados pessoais que o Cliente
            (controlador) insere no LexFlow.
          </p>
        </LegalSection>
      </div>

      <LegalSection title="I.1 Instruções">
        <p>
          O Fornecedor tratará os dados apenas para prestar o serviço, conforme
          estes Termos e as instruções documentadas do Cliente, e não os usará
          para finalidades próprias.
        </p>
      </LegalSection>

      <LegalSection title="I.2 Dados e titulares">
        <LegalList>
          <li>
            <strong>Clientes do escritório:</strong> dados de identificação
            (nome, CPF, RG, data de nascimento, filiação, estado civil,
            profissão), contato, endereço, renda, PIS, dados de processos
            administrativos e judiciais, credenciais Gov.br, informações
            financeiras e documentos anexados, que podem conter dados
            sensíveis de saúde.
          </li>
          <li>
            <strong>Equipe do escritório:</strong> nome, e-mail, função e
            registros de uso do sistema.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="I.3 Segurança">
        <LegalList>
          <li>comunicação protegida por HTTPS;</li>
          <li>senhas Gov.br e chaves de integração com o Google cifradas com AES-256-GCM;</li>
          <li>controle de acesso por funções e permissões definidas pelo Cliente;</li>
          <li>separação dos dados de cada escritório e bloqueio de acesso direto ao banco de dados por interfaces públicas;</li>
          <li>registro de cada acesso às senhas Gov.br;</li>
          <li>documentos guardados em armazenamento privado, acessados por links temporários;</li>
          <li>servidores e banco de dados localizados em São Paulo;</li>
          <li>cópias de segurança mantidas pelo provedor de infraestrutura.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="I.4 Confidencialidade">
        <p>
          O Fornecedor mantém sigilo sobre os dados e só os acessa quando
          indispensável para suporte solicitado pelo Cliente, manutenção,
          correção de falhas, segurança ou cumprimento de obrigação legal.
        </p>
      </LegalSection>

      <LegalSection title="I.5 Suboperadores">
        <p>
          O Cliente autoriza o Fornecedor a utilizar os seguintes serviços de
          terceiros, que se obrigam a proteger os dados:
        </p>

        <LegalList>
          {SUBPROCESSORS.map((item) => (
            <li key={item.name}>
              <strong><Fill value={item.name} />:</strong> {item.purpose}{" "}
              <Fill value={item.location} />
            </li>
          ))}
        </LegalList>

        <p>
          Esses provedores são empresas estrangeiras. Ainda que os dados sejam
          armazenados no Brasil, pode haver acesso ou processamento no
          exterior, amparado nas garantias contratuais oferecidas por eles
          (art. 33 da LGPD). Mudanças nesta lista serão informadas com
          antecedência.
        </p>
      </LegalSection>

      <LegalSection title="I.6 Direitos dos titulares">
        <p>
          O Fornecedor auxiliará o Cliente a atender pedidos dos titulares.
          Pedidos recebidos diretamente pelo Fornecedor sobre dados de
          clientes de um escritório serão encaminhados ao respectivo Cliente.
        </p>
      </LegalSection>

      <LegalSection title="I.7 Incidentes de segurança">
        <p>
          O Fornecedor comunicará o Cliente, sem demora injustificada e em até
          2 (dois) dias úteis da ciência, qualquer incidente de segurança que
          possa afetar os dados, com as informações disponíveis, para que o
          Cliente cumpra seus deveres perante a ANPD e os titulares.
        </p>
      </LegalSection>

      <LegalSection title="I.8 Término">
        <p>
          Ao fim da contratação, os dados serão devolvidos e excluídos conforme
          a cláusula 10 dos Termos. O Fornecedor fornecerá, mediante
          solicitação razoável, as informações necessárias para demonstrar o
          cumprimento deste Anexo.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
