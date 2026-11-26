/** Maps errors coming from the local store / Supabase to readable, localized
 *  messages. Raw technical errors are never shown to the user. */
const MESSAGES = {
  it: {
    unknown: "Non è stato possibile completare l'operazione. Riprova tra poco.",
    accountMissing: "Nessun account trovato con questa email. Controlla l'indirizzo o crea un account.",
    accountIncomplete: "Questo account è incompleto. Ripeti la registrazione.",
    passwordDemo: "Password non corretta per l'account demo.",
    passwordWrong: "Password non corretta. Riprova o usa \"Password dimenticata?\".",
    passwordMissing: "Questo account non ha una password salvata. Registrati di nuovo.",
    passwordShort: "La password deve avere almeno 8 caratteri.",
    emailExists: "Esiste già un account con questa email. Accedi oppure usa un altro indirizzo.",
    emailInvalid: "Inserisci un indirizzo email valido.",
    resetUnavailable: "Il recupero password non è disponibile in questo momento. Riprova tra poco.",
    emailRateLimit: "Hai richiesto troppe email. Attendi qualche minuto prima di riprovare.",
  },
  en: {
    unknown: "We couldn't complete this operation. Please try again shortly.",
    accountMissing: "No account was found for this email. Check the address or create an account.",
    accountIncomplete: "This account is incomplete. Please sign up again.",
    passwordDemo: "Incorrect password for the demo account.",
    passwordWrong: "Incorrect password. Try again or use \"Forgot password?\".",
    passwordMissing: "This account has no saved password. Please sign up again.",
    passwordShort: "The password must be at least 8 characters long.",
    emailExists: "An account already exists for this email. Sign in or use another address.",
    emailInvalid: "Enter a valid email address.",
    resetUnavailable: "Password reset is unavailable right now. Please try again shortly.",
    emailRateLimit: "Too many email requests. Wait a few minutes before trying again.",
  },
} as const;

export type Lang = "it" | "en";

export function friendlyAuthError(
  error: unknown,
  lang: Lang,
  fallbackKey: string = "unknown",
): string {
  const c = MESSAGES[lang];
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const text = raw.toLowerCase();

  // The local store currently throws Italian messages; Supabase throws English
  // ones. Both are normalized here so the UI always speaks the user's language.
  const rules: Array<[RegExp, string]> = [
    [/nessun account trovato|account trovato con questa email|cannot find user|invalid login credentials|user not found/, c.accountMissing],
    [/account incompleto|incomplete account/, c.accountIncomplete],
    [/password non corretta per l'account demo/, c.passwordDemo],
    [/password non corretta|incorrect password|invalid password|wrong password/, c.passwordWrong],
    [/password salvata|no password set/, c.passwordMissing],
    [/almeno 8|at least 8 characters|password should be at least/, c.passwordShort],
    [/già un account|already exists|already registered|email.*taken/, c.emailExists],
    [/email.*(invalido|valid|invalid)/, c.emailInvalid],
    [/too many requests|rate limit|sigma limit|email rate/, c.emailRateLimit],
    [/reset|recupero|recovery.*(unavailable|failed)/, c.resetUnavailable],
  ];

  for (const [pattern, message] of rules) {
    if (pattern.test(text)) return message;
  }
  return c[fallbackKey as keyof typeof c] ?? c.unknown;
}
