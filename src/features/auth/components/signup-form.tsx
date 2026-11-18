"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  unstable_rethrow,
} from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
  Send,
} from "lucide-react";

import {
  resendSignupConfirmationAction,
  signUpAction,
  type ResendConfirmationState,
  type SignUpState,
} from "../actions/signup";

import {
  BRAZIL_STATES,
} from "@/features/clients/constants";

import {
  maskTaxId,
} from "@/lib/br-documents";

import {
  maskPhone,
} from "@/lib/masks";

import {
  TRIAL_DAYS,
} from "@/lib/trial";

import {
  getSignUpFieldErrors,
  getSignUpStepIndex,
  SIGN_UP_FIELDS,
  SIGN_UP_STEPS,
  type SignUpField,
  type SignUpFieldErrors,
} from "../lib/signup-validation";

import {
  AcceptTermsField,
} from "./accept-terms-field";

import {
  authButtonClass,
  authErrorClass,
  authFieldErrorClass,
  authInputClass,
  authLabelClass,
} from "./auth-styles";

const RESEND_WAIT_SECONDS = 60;

const initialState: SignUpState = {
  error: null,
  sentTo: null,
};

const initialResendState: ResendConfirmationState = {
  message: null,
  error: null,
};

const emptyValues = {
  officeName: "",
  taxId: "",
  city: "",
  state: "",
  name: "",
  whatsapp: "",
  oabNumber: "",
  oabState: "",
  email: "",
  password: "",
  passwordConfirm: "",
};

type TextField = keyof typeof emptyValues;

type FieldProps = {
  id: TextField;
  label: string;
  optional?: boolean;
  value: string;
  error?: string;
  hint?: ReactNode;
  onValueChange: (value: string) => void;
  onLeave: () => void;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "name" | "value" | "onChange" | "onBlur"
>;

function describedBy(
  id: string,
  error?: string,
  hint?: ReactNode,
) {
  if (error) {
    return `${id}-error`;
  }

  return hint ? `${id}-hint` : undefined;
}

function FieldLabel({
  id,
  label,
  optional,
}: {
  id: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`block ${authLabelClass}`}
    >
      {label}

      {optional ? (
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          (opcional)
        </span>
      ) : null}
    </label>
  );
}

function FieldMessage({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string;
  hint?: ReactNode;
}) {
  if (error) {
    return (
      <p
        id={`${id}-error`}
        className={authFieldErrorClass}
      >
        {error}
      </p>
    );
  }

  if (!hint) {
    return null;
  }

  return (
    <div
      id={`${id}-hint`}
      className="text-xs text-muted-foreground"
    >
      {hint}
    </div>
  );
}

function Field({
  id,
  label,
  optional,
  value,
  error,
  hint,
  onValueChange,
  onLeave,
  ...inputProps
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <FieldLabel
        id={id}
        label={label}
        optional={optional}
      />

      <input
        {...inputProps}
        id={id}
        name={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onBlur={onLeave}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={authInputClass}
      />

      <FieldMessage
        id={id}
        error={error}
        hint={hint}
      />
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  error,
  hint,
  onValueChange,
  onLeave,
  ...inputProps
}: FieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={authLabelClass}
      >
        {label}
      </label>

      <div className="relative">
        <input
          {...inputProps}
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onBlur={onLeave}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`${authInputClass} pr-11`}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {visible ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>

      <FieldMessage
        id={id}
        error={error}
        hint={hint}
      />
    </div>
  );
}

function Requirement({
  met,
  children,
}: {
  met: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        met ? "text-emerald-700 dark:text-emerald-400" : ""
      }`}
    >
      {met ? (
        <Check
          className="size-3.5"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}

function StateField({
  id,
  label,
  optional,
  value,
  error,
  onValueChange,
  onLeave,
}: Pick<
  FieldProps,
  "id" | "label" | "optional" | "value" | "error" | "onValueChange" | "onLeave"
>) {
  return (
    <div className="space-y-1.5">
      <FieldLabel
        id={id}
        label={label}
        optional={optional}
      />

      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onBlur={onLeave}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error)}
        className={authInputClass}
      >
        <option value="">
          UF
        </option>

        {BRAZIL_STATES.map((state) => (
          <option
            key={state}
            value={state}
          >
            {state}
          </option>
        ))}
      </select>

      <FieldMessage
        id={id}
        error={error}
      />
    </div>
  );
}

function SignUpProgress({
  step,
  onStepChange,
}: {
  step: number;
  onStepChange: (step: number) => void;
}) {
  return (
    <nav
      aria-label={`Etapa ${step + 1} de ${SIGN_UP_STEPS.length}`}
      className="mt-7"
    >
      <ol className="grid grid-cols-3 gap-2">
        {SIGN_UP_STEPS.map((item, index) => {
          const done = index < step;
          const current = index === step;

          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={!done}
                onClick={() => onStepChange(index)}
                aria-current={current ? "step" : undefined}
                className="block w-full text-left enabled:cursor-pointer"
              >
                <span
                  className={`block h-1.5 rounded-full ${
                    done || current ? "bg-primary" : "bg-muted"
                  }`}
                />

                <span
                  className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                    done || current ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check
                      className="size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="truncate">
                    {item.title}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ConfirmationSent({
  email,
  devConfirmationUrl,
  onEditEmail,
}: {
  email: string;
  devConfirmationUrl?: string;
  onEditEmail: () => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  // O Supabase limita reenvios: o botão libera depois da espera.
  const [secondsLeft, setSecondsLeft] = useState(
    email ? RESEND_WAIT_SECONDS : 0,
  );

  const [resendState, resendAction, resending] =
    useActionState(
      async (
        previous: ResendConfirmationState,
        formData: FormData,
      ) => {
        const result = await resendSignupConfirmationAction(
          previous,
          formData,
        );

        setSecondsLeft(RESEND_WAIT_SECONDS);

        return result;
      },
      initialResendState,
    );

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setTimeout(
      () => setSecondsLeft((current) => current - 1),
      1000,
    );

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  if (devConfirmationUrl) {
    return (
      <div>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="text-3xl font-bold tracking-tight outline-none"
        >
          Confirme o cadastro
        </h1>

        <p className="mt-2 leading-relaxed text-muted-foreground">
          Ambiente de desenvolvimento: nenhum e-mail foi enviado. Use o botão
          abaixo no lugar do link que chegaria na caixa de entrada.
        </p>

        <a
          href={devConfirmationUrl}
          className={`mt-6 ${authButtonClass}`}
        >
          <MailCheck className="size-4" />
          Confirmar cadastro
        </a>

        <button
          type="button"
          onClick={onEditEmail}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Corrigir meus dados
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
        <MailCheck className="size-6" />
      </div>

      <h1
        ref={titleRef}
        tabIndex={-1}
        className="mt-6 text-3xl font-bold tracking-tight outline-none"
      >
        Confirme seu e-mail
      </h1>

      <p className="mt-2 leading-relaxed text-muted-foreground">
        {email ? (
          <>
            Enviamos um link de confirmação para{" "}
            <strong className="break-all font-semibold text-foreground">
              {email}
            </strong>
            .
          </>
        ) : (
          "Enviamos um link de confirmação para o e-mail informado."
        )}
      </p>

      <ol className="mt-6 space-y-3 rounded-2xl border bg-muted/20 p-4 text-sm">
        {[
          "Abra a mensagem na sua caixa de entrada. Se não encontrar, confira o spam.",
          "Clique no link de confirmação.",
          "Pronto: seu escritório será criado e você poderá convidar a equipe.",
        ].map((step, index) => (
          <li
            key={step}
            className="flex gap-3"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </span>

            <span className="pt-0.5 leading-relaxed">
              {step}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Abriu o link em outro aparelho? Depois de confirmar, é só entrar com
        seu e-mail e senha.
      </p>

      {email ? (
        <form
          action={resendAction}
          className="mt-6 space-y-3"
        >
          <input
            type="hidden"
            name="email"
            value={email}
          />

          <div aria-live="polite">
            {resendState.message ? (
              <p className="text-sm text-muted-foreground">
                {resendState.message}
              </p>
            ) : null}

            {resendState.error ? (
              <p className={authErrorClass}>
                {resendState.error}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={resending || secondsLeft > 0}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}

            {resending
              ? "Reenviando..."
              : secondsLeft > 0
                ? `Reenviar e-mail em ${secondsLeft}s`
                : "Reenviar e-mail"}
          </button>
        </form>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={onEditEmail}
          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Corrigir meus dados
        </button>

        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Já confirmei, quero entrar
        </Link>
      </div>
    </div>
  );
}

// Evita que o segundo clique de um duplo clique valha para a etapa seguinte.
const STEP_CHANGE_GUARD_MS = 400;

export function SignUpForm() {
  const [values, setValues] = useState(emptyValues);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState<ReadonlySet<SignUpField>>(new Set());
  const [edited, setEdited] = useState<ReadonlySet<SignUpField>>(new Set());
  const [sentTo, setSentTo] = useState<string | null>(null);
  const previousStep = useRef(step);
  const stepChangedAt = useRef(0);
  const focusTarget = useRef<SignUpField | null>(null);

  const [state, action, pending] =
    useActionState(
      async (
        previous: SignUpState,
        formData: FormData,
      ): Promise<SignUpState> => {
        try {
          const result = await signUpAction(previous, formData);
          const firstInvalid = SIGN_UP_FIELDS.find(
            (field) => result.fieldErrors?.[field],
          );

          setEdited(new Set());
          setSentTo(result.sentTo);

          // Erro do servidor: volta para a etapa do campo com problema.
          if (firstInvalid) {
            focusTarget.current = firstInvalid;
            setStep(getSignUpStepIndex(firstInvalid));
          }

          return result;
        } catch (error) {
          // Mantém o redirecionamento feito pelo servidor.
          unstable_rethrow(error);

          return {
            error: "Não foi possível enviar o cadastro. Verifique sua conexão e tente novamente.",
            sentTo: null,
          };
        }
      },
      initialState,
    );

  // Ao mudar de etapa, o foco vai para o campo com erro ou para o primeiro dela.
  useEffect(() => {
    const stepChanged = previousStep.current !== step;
    const target = focusTarget.current;

    if (!stepChanged && !target) {
      return;
    }

    if (stepChanged) {
      previousStep.current = step;
      stepChangedAt.current = Date.now();
      window.scrollTo({ top: 0 });
    }

    focusTarget.current = null;
    document
      .getElementById(target ?? SIGN_UP_STEPS[step].fields[0])
      ?.focus({ preventScroll: !target });
  }, [state, step]);

  const clientErrors = useMemo(
    () =>
      getSignUpFieldErrors({
        ...values,
        acceptTerms: acceptedTerms ? "on" : undefined,
      }),
    [acceptedTerms, values],
  );

  const serverErrors: SignUpFieldErrors = state.fieldErrors ?? {};

  function errorFor(field: SignUpField) {
    if (touched.has(field) && clientErrors[field]) {
      return clientErrors[field];
    }

    return edited.has(field) ? undefined : serverErrors[field];
  }

  function markEdited(field: SignUpField) {
    setEdited((current) => new Set(current).add(field));
  }

  function update(field: TextField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    markEdited(field);
  }

  // Campo vazio só é cobrado ao avançar, para não interromper o preenchimento.
  function leave(field: TextField) {
    if (values[field]) {
      setTouched((current) => new Set(current).add(field));
    }
  }

  function showErrors(fields: readonly SignUpField[]) {
    setTouched((current) => new Set([...current, ...fields]));
  }

  /*
   * O botão principal é sempre "submit" (o Enter também funciona):
   * nas primeiras etapas ele só valida e avança.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (Date.now() - stepChangedAt.current < STEP_CHANGE_GUARD_MS) {
      event.preventDefault();
      document.getElementById(SIGN_UP_STEPS[step].fields[0])?.focus();
      return;
    }

    const isLastStep = step === SIGN_UP_STEPS.length - 1;
    const fields: readonly SignUpField[] = isLastStep
      ? SIGN_UP_FIELDS
      : SIGN_UP_STEPS[step].fields;
    const firstInvalid = fields.find((field) => clientErrors[field]);

    if (firstInvalid) {
      event.preventDefault();
      showErrors(fields);

      const invalidStep = getSignUpStepIndex(firstInvalid);

      if (invalidStep === step) {
        document.getElementById(firstInvalid)?.focus();
      } else {
        focusTarget.current = firstInvalid;
        setStep(invalidStep);
      }

      return;
    }

    if (!isLastStep) {
      event.preventDefault();
      setStep(step + 1);
    }
  }

  function fieldProps(field: TextField) {
    return {
      id: field,
      value: values[field],
      error: errorFor(field),
      onValueChange: (value: string) => update(field, value),
      onLeave: () => leave(field),
    };
  }

  if (sentTo !== null) {
    return (
      <ConfirmationSent
        email={sentTo}
        devConfirmationUrl={state.devConfirmationUrl}
        onEditEmail={() => setSentTo(null)}
      />
    );
  }

  const generalError =
    state.error && !state.fieldErrors ? state.error : null;

  const passwordLongEnough = values.password.length >= 8;

  const passwordsMatch =
    Boolean(values.passwordConfirm) &&
    values.password === values.passwordConfirm;

  const isLastStep = step === SIGN_UP_STEPS.length - 1;

  function stepClass(index: number) {
    return index === step ? "space-y-4" : "hidden";
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        Cadastre seu escritório
      </h1>

      <p className="mt-2 leading-relaxed text-muted-foreground">
        Teste grátis por {TRIAL_DAYS} dias. São três etapas rápidas, e os
        campos opcionais podem ser preenchidos depois, em Configurações.
      </p>

      <SignUpProgress
        step={step}
        onStepChange={setStep}
      />

      <form
        action={action}
        onSubmit={handleSubmit}
        noValidate
        className="mt-7"
      >
        {/* Armadilha para robôs: invisível para pessoas e leitores de tela. */}
        <div
          aria-hidden="true"
          className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
        >
          <label htmlFor="website">
            Site
          </label>

          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div
          aria-live="polite"
          className="mb-5"
        >
          <h2 className="text-lg font-semibold">
            {SIGN_UP_STEPS[step].title}
          </h2>

          <p className="mt-0.5 text-sm text-muted-foreground">
            {SIGN_UP_STEPS[step].description}
          </p>
        </div>

        {/* As etapas ficam no formulário para todas irem no envio final. */}
        <div className={stepClass(0)}>
          <Field
            {...fieldProps("officeName")}
            label="Nome do escritório"
            type="text"
            autoComplete="organization"
            autoCapitalize="words"
            maxLength={120}
            placeholder="Ex.: Silva Advocacia"
          />

          <Field
            {...fieldProps("taxId")}
            onValueChange={(value) => update("taxId", maskTaxId(value))}
            label="CPF ou CNPJ"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={18}
            hint="Usado nos dados de cobrança. Cada documento pode abrir apenas um escritório."
          />

          <div className="grid items-start gap-4 min-[360px]:grid-cols-[minmax(0,1fr)_8.5rem]">
            <Field
              {...fieldProps("city")}
              label="Cidade"
              optional
              type="text"
              autoComplete="address-level2"
              autoCapitalize="words"
              maxLength={100}
            />

            <StateField
              {...fieldProps("state")}
              label="UF"
              optional
            />
          </div>
        </div>

        <div className={stepClass(1)}>
          <Field
            {...fieldProps("name")}
            label="Seu nome completo"
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            maxLength={100}
          />

          <Field
            {...fieldProps("whatsapp")}
            onValueChange={(value) => update("whatsapp", maskPhone(value))}
            label="WhatsApp"
            optional
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            maxLength={15}
            placeholder="(00) 00000-0000"
          />

          <div className="grid items-start gap-4 min-[360px]:grid-cols-[minmax(0,1fr)_8.5rem]">
            <Field
              {...fieldProps("oabNumber")}
              label="Número da OAB"
              optional
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={20}
            />

            <StateField
              {...fieldProps("oabState")}
              label="UF da OAB"
              optional
            />
          </div>
        </div>

        <div className={stepClass(2)}>
          <Field
            {...fieldProps("email")}
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={254}
            placeholder="voce@escritorio.com.br"
            hint="Enviaremos um link de confirmação para este endereço."
          />

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <PasswordField
              {...fieldProps("password")}
              label="Senha"
              autoComplete="new-password"
              maxLength={72}
              hint={
                <Requirement met={passwordLongEnough}>
                  Pelo menos 8 caracteres
                </Requirement>
              }
            />

            <PasswordField
              {...fieldProps("passwordConfirm")}
              label="Confirme a senha"
              autoComplete="new-password"
              maxLength={72}
              hint={
                passwordsMatch ? (
                  <Requirement met>
                    As senhas coincidem
                  </Requirement>
                ) : undefined
              }
            />
          </div>

          <AcceptTermsField
            checked={acceptedTerms}
            onCheckedChange={(checked) => {
              setAcceptedTerms(checked);
              markEdited("acceptTerms");
            }}
            error={errorFor("acceptTerms")}
          />
        </div>

        {generalError ? (
          <div
            role="alert"
            className={`mt-5 ${authErrorClass}`}
          >
            {generalError}
          </div>
        ) : null}

        <div className="mt-7 flex gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={pending}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </button>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={authButtonClass}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isLastStep ? (
              <Building2 className="size-4" />
            ) : null}

            {pending
              ? "Criando conta..."
              : isLastStep
                ? "Criar conta do escritório"
                : "Continuar"}

            {!pending && !isLastStep ? (
              <ArrowRight className="size-4" />
            ) : null}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
