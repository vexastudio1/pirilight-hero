import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';

export interface ProjectEnquiryFormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  projectType: string;
  message: string;
  budget: string;
  howFound: string;
  consent: boolean;
}

const INITIAL_FORM_DATA: ProjectEnquiryFormData = {
  name: '',
  email: '',
  company: '',
  phone: '',
  projectType: '',
  message: '',
  budget: '',
  howFound: '',
  consent: false,
};

export const PROJECT_TYPE_OPTIONS = [
  'Website institucional',
  'Loja online',
  'Landing page',
  'Portefólio',
  'Redesign de website',
  'Outro',
];

export const BUDGET_OPTIONS = ['Ainda não sei', 'Até 500 €', '500 € – 1.000 €', '1.000 € – 2.500 €', 'Mais de 2.500 €'];

export const HOW_FOUND_OPTIONS = ['Google', 'Redes sociais', 'Recomendação', 'Outro'];

const MESSAGE_MIN_LENGTH = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<keyof ProjectEnquiryFormData, string>>;
type SubmitStatus = 'idle' | 'submitting' | 'submitted';

const REQUIRED_FIELD_ORDER: (keyof ProjectEnquiryFormData)[] = ['name', 'email', 'projectType', 'message', 'consent'];

function validate(data: ProjectEnquiryFormData): FieldErrors {
  const errors: FieldErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Indica o teu nome.';
  }

  if (!data.email.trim()) {
    errors.email = 'Indica um email.';
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = 'Introduz um email válido.';
  }

  if (!data.projectType) {
    errors.projectType = 'Seleciona o tipo de projeto.';
  }

  if (!data.message.trim()) {
    errors.message = 'Conta-nos um pouco sobre o projeto.';
  } else if (data.message.trim().length < MESSAGE_MIN_LENGTH) {
    errors.message = `Conta-nos um pouco mais (mínimo ${MESSAGE_MIN_LENGTH} caracteres).`;
  }

  if (!data.consent) {
    errors.consent = 'É necessário autorizar o tratamento dos dados para continuar.';
  }

  return errors;
}

// Deliberately isolated from the rest of the form: this is the one place a
// real backend (Formspree, Resend, EmailJS, Supabase, …) plugs in later.
// It intentionally does not send the data anywhere yet — no endpoint exists,
// so pretending otherwise would be dishonest. The visible status message
// after submit says so explicitly.
async function submitProjectEnquiry(_data: ProjectEnquiryFormData): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 550));
}

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="project-enquiry-submit__check">
    <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ProjectEnquiryForm() {
  const [data, setData] = useState<ProjectEnquiryFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ProjectEnquiryFormData, boolean>>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [shake, setShake] = useState(false);

  const fieldRefs = useRef<Partial<Record<keyof ProjectEnquiryFormData, HTMLElement | null>>>({});

  const showError = (field: keyof ProjectEnquiryFormData) =>
    (touched[field] || attemptedSubmit) && errors[field] ? errors[field] : undefined;

  function update<K extends keyof ProjectEnquiryFormData>(field: K, value: ProjectEnquiryFormData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (attemptedSubmit) {
      // Re-validate live once the user has already attempted a submit, so
      // fixing a field clears its error immediately instead of waiting for
      // another submit attempt.
      setErrors(validate({ ...data, [field]: value }));
    }
  }

  function handleBlur(field: keyof ProjectEnquiryFormData) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, ...validate(data) }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttemptedSubmit(true);
    const validationErrors = validate(data);
    setErrors(validationErrors);

    const firstInvalid = REQUIRED_FIELD_ORDER.find((field) => validationErrors[field]);
    if (firstInvalid) {
      setShake(true);
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    setStatus('submitting');
    await submitProjectEnquiry(data);
    setStatus('submitted');
  }

  const busy = status === 'submitting' || status === 'submitted';

  return (
    <form className="project-enquiry-form" onSubmit={handleSubmit} noValidate>
      <div className="project-enquiry-form__row">
        <div className="project-enquiry-field">
          <label htmlFor="ep-name">Nome completo</label>
          <input
            id="ep-name"
            name="name"
            type="text"
            autoComplete="name"
            ref={(el) => {
              fieldRefs.current.name = el;
            }}
            value={data.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => update('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            aria-invalid={Boolean(showError('name'))}
            aria-describedby={showError('name') ? 'ep-name-error' : undefined}
            disabled={busy}
          />
          {showError('name') && (
            <p className="project-enquiry-field__error" id="ep-name-error">
              {showError('name')}
            </p>
          )}
        </div>

        <div className="project-enquiry-field">
          <label htmlFor="ep-email">Email</label>
          <input
            id="ep-email"
            name="email"
            type="email"
            autoComplete="email"
            ref={(el) => {
              fieldRefs.current.email = el;
            }}
            value={data.email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => update('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            aria-invalid={Boolean(showError('email'))}
            aria-describedby={showError('email') ? 'ep-email-error' : undefined}
            disabled={busy}
          />
          {showError('email') && (
            <p className="project-enquiry-field__error" id="ep-email-error">
              {showError('email')}
            </p>
          )}
        </div>
      </div>

      <div className="project-enquiry-form__row">
        <div className="project-enquiry-field">
          <label htmlFor="ep-company">
            Empresa <span className="project-enquiry-field__optional">(opcional)</span>
          </label>
          <input
            id="ep-company"
            name="company"
            type="text"
            autoComplete="organization"
            value={data.company}
            onChange={(e: ChangeEvent<HTMLInputElement>) => update('company', e.target.value)}
            disabled={busy}
          />
        </div>

        <div className="project-enquiry-field">
          <label htmlFor="ep-phone">
            Telefone <span className="project-enquiry-field__optional">(opcional)</span>
          </label>
          <input
            id="ep-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={data.phone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => update('phone', e.target.value)}
            disabled={busy}
          />
        </div>
      </div>

      <div className="project-enquiry-field">
        <label htmlFor="ep-project-type">Tipo de projeto</label>
        <div className="project-enquiry-select">
          <select
            id="ep-project-type"
            name="projectType"
            ref={(el) => {
              fieldRefs.current.projectType = el;
            }}
            value={data.projectType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => update('projectType', e.target.value)}
            onBlur={() => handleBlur('projectType')}
            aria-invalid={Boolean(showError('projectType'))}
            aria-describedby={showError('projectType') ? 'ep-project-type-error' : undefined}
            disabled={busy}
          >
            <option value="" disabled>
              Seleciona uma opção
            </option>
            {PROJECT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="project-enquiry-select__chevron">
            <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {showError('projectType') && (
          <p className="project-enquiry-field__error" id="ep-project-type-error">
            {showError('projectType')}
          </p>
        )}
      </div>

      <div className="project-enquiry-field">
        <label htmlFor="ep-message">Fala-nos do teu projeto</label>
        <textarea
          id="ep-message"
          name="message"
          rows={5}
          ref={(el) => {
            fieldRefs.current.message = el;
          }}
          placeholder="Descreve a tua ideia, objetivos e o que pretendes alcançar…"
          value={data.message}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update('message', e.target.value)}
          onBlur={() => handleBlur('message')}
          aria-invalid={Boolean(showError('message'))}
          aria-describedby={showError('message') ? 'ep-message-error' : undefined}
          disabled={busy}
        />
        {showError('message') && (
          <p className="project-enquiry-field__error" id="ep-message-error">
            {showError('message')}
          </p>
        )}
      </div>

      <div className="project-enquiry-field">
        <label htmlFor="ep-budget">
          Orçamento previsto <span className="project-enquiry-field__optional">(opcional)</span>
        </label>
        <div className="project-enquiry-select">
          <select
            id="ep-budget"
            name="budget"
            value={data.budget}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => update('budget', e.target.value)}
            disabled={busy}
          >
            <option value="">Seleciona uma opção</option>
            {BUDGET_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="project-enquiry-select__chevron">
            <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <fieldset className="project-enquiry-field project-enquiry-radios">
        <legend>Como nos encontraste?</legend>
        <div className="project-enquiry-radios__options">
          {HOW_FOUND_OPTIONS.map((option) => (
            <label key={option} className="project-enquiry-radios__option">
              <input
                type="radio"
                name="howFound"
                value={option}
                checked={data.howFound === option}
                onChange={() => update('howFound', option)}
                disabled={busy}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="project-enquiry-field project-enquiry-consent">
        <label className="project-enquiry-consent__label">
          <input
            type="checkbox"
            name="consent"
            ref={(el) => {
              fieldRefs.current.consent = el;
            }}
            checked={data.consent}
            onChange={(e: ChangeEvent<HTMLInputElement>) => update('consent', e.target.checked)}
            onBlur={() => handleBlur('consent')}
            aria-invalid={Boolean(showError('consent'))}
            aria-describedby={showError('consent') ? 'ep-consent-error' : undefined}
            disabled={busy}
          />
          <span>
            Autorizo o tratamento dos meus dados para efeitos de contacto.
            <br />
            Ve a nossa{' '}
            <span className="project-enquiry-consent__policy-link" aria-disabled="true" title="Página em preparação">
              Política de Privacidade
            </span>
            .
          </span>
        </label>
        {showError('consent') && (
          <p className="project-enquiry-field__error" id="ep-consent-error">
            {showError('consent')}
          </p>
        )}
      </div>

      <button
        type="submit"
        className={`button button--primary project-enquiry-submit${shake ? ' project-enquiry-submit--shake' : ''}`}
        data-state={status}
        disabled={busy}
        onAnimationEnd={() => setShake(false)}
      >
        <span className="project-enquiry-submit__label">
          {status === 'submitting' ? 'A enviar…' : status === 'submitted' ? 'Mensagem registada' : 'Enviar mensagem'}
        </span>
        {status === 'submitting' && <span className="project-enquiry-submit__spinner" aria-hidden="true" />}
        {status === 'submitted' && <CheckIcon />}
        {status === 'idle' && <span aria-hidden="true">&rarr;</span>}
      </button>

      <div className="project-enquiry-status" role="status" aria-live="polite">
        {status === 'submitted' && (
          <p>
            O formulário ainda está em configuração. Entretanto, envia-nos um email para{' '}
            <a href="mailto:ola@pirilight.pt">ola@pirilight.pt</a>.
          </p>
        )}
        {attemptedSubmit && status === 'idle' && Object.keys(errors).length > 0 && (
          <p className="project-enquiry-status--error">Corrige os campos assinalados antes de continuar.</p>
        )}
      </div>
    </form>
  );
}
