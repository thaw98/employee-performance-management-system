export type TranslationLanguage = 'Myanmar' | 'English'

const GOOGLE_TRANSLATE_COOKIE = 'googtrans'
const LANGUAGE_STORAGE_KEY = 'epms_language_preference'
const GOOGLE_TRANSLATE_ELEMENT_ID = 'google_translate_element'
const GOOGLE_TRANSLATE_SCRIPT_ID = 'google-translate-script'

function expireCookie(domain?: string) {
  const domainPart = domain ? `; domain=${domain}` : ''
  document.cookie = `${GOOGLE_TRANSLATE_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${domainPart}`
}

function canUseCookieDomain(hostname: string) {
  return hostname === 'localhost' || hostname.includes('.')
}

function setTranslateCookie(value: string, domain?: string) {
  const domainPart = domain ? `; domain=${domain}` : ''
  document.cookie = `${GOOGLE_TRANSLATE_COOKIE}=${value}; path=/${domainPart}`
}

export function isMyanmarLanguage(language?: string | null) {
  const normalized = language?.trim().toLowerCase()
  return normalized === 'myanmar' || normalized === 'myanmar (burmese)' || normalized === 'burmese'
}

export function applyLanguageFont(language?: TranslationLanguage | string | null) {
  const useMyanmar = isMyanmarLanguage(language)
  const fontFamily = useMyanmar
    ? '"Noto Sans Myanmar", "Myanmar Text", Padauk, Pyidaungsu, sans-serif'
    : ''

  document.documentElement.lang = useMyanmar ? 'my' : 'en'
  document.documentElement.style.setProperty('font-family', fontFamily, fontFamily ? 'important' : undefined)
  document.body.style.setProperty('font-family', fontFamily, fontFamily ? 'important' : undefined)
  document.documentElement.style.setProperty('--font-sans', fontFamily || '')

  if (!fontFamily) {
    document.documentElement.style.removeProperty('font-family')
    document.documentElement.style.removeProperty('--font-sans')
    document.body.style.removeProperty('font-family')
  }
}

export function applyGoogleTranslateCookie(language: TranslationLanguage | string) {
  const useMyanmar = isMyanmarLanguage(language)
  applyLanguageFont(language)

  if (useMyanmar) {
    setTranslateCookie('/en/my')
    if (canUseCookieDomain(window.location.hostname)) {
      setTranslateCookie('/en/my', window.location.hostname)
    }
    if (window.location.hostname === 'localhost') {
      setTranslateCookie('/en/my', 'localhost')
    }
    return
  }

  expireCookie()
  if (canUseCookieDomain(window.location.hostname)) {
    expireCookie(window.location.hostname)
  }
  if (window.location.hostname === 'localhost') {
    expireCookie('localhost')
  }
}

export function hasGoogleTranslateCookie(language: TranslationLanguage | string) {
  const expected = isMyanmarLanguage(language) ? '/en/my' : ''
  return document.cookie.includes(`${GOOGLE_TRANSLATE_COOKIE}=${expected}`)
}

export function saveLanguagePreference(language: TranslationLanguage | string) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, isMyanmarLanguage(language) ? 'Myanmar' : 'English')
}

export function getSavedLanguagePreference() {
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) as TranslationLanguage | null
}

export function applyGoogleTranslateSelection(language: TranslationLanguage | string) {
  const select = document.querySelector<HTMLSelectElement>('.goog-te-combo')
  if (!select) return false

  const targetValue = isMyanmarLanguage(language) ? 'my' : 'en'
  if (select.value !== targetValue) {
    select.value = targetValue
    select.dispatchEvent(new Event('change'))
  }

  return true
}

export function setGoogleTranslateWidgetVisible(visible: boolean) {
  const container = document.getElementById(GOOGLE_TRANSLATE_ELEMENT_ID)
  if (!container) return

  if (visible) {
    container.style.position = 'static'
    container.style.left = ''
    container.style.top = ''
    container.style.width = 'auto'
    container.style.height = 'auto'
    container.style.overflow = 'visible'
    container.style.opacity = '1'
    container.style.pointerEvents = 'auto'
    container.style.marginTop = '0.75rem'
    return
  }

  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '1px'
  container.style.height = '1px'
  container.style.overflow = 'hidden'
  container.style.opacity = '0'
  container.style.pointerEvents = 'none'
  container.style.marginTop = '0'
}

export function ensureGoogleTranslateWidget(visible = false) {
  let container = document.getElementById(GOOGLE_TRANSLATE_ELEMENT_ID)
  if (!container) {
    container = document.createElement('div')
    container.id = GOOGLE_TRANSLATE_ELEMENT_ID
    document.body.appendChild(container)
  }

  setGoogleTranslateWidgetVisible(visible)

  ;(window as any).googleTranslateElementInit = () => {
    const google = (window as any).google
    if (!google?.translate?.TranslateElement) return

    new google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        includedLanguages: 'my,en',
        autoDisplay: false,
      },
      GOOGLE_TRANSLATE_ELEMENT_ID,
    )
  }

  if (!document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.body.appendChild(script)
  } else {
    const hasCombo = Boolean(document.querySelector('.goog-te-combo'))
    if (!hasCombo) {
      ;(window as any).googleTranslateElementInit?.()
    }
  }
}

export function retryGoogleTranslateSelection(language: TranslationLanguage | string, attempts = 8) {
  let count = 0

  const run = () => {
    count += 1
    ensureGoogleTranslateWidget()
    const applied = applyGoogleTranslateSelection(language)
    if (!applied && count < attempts) {
      window.setTimeout(run, 500)
    }
  }

  run()
}
