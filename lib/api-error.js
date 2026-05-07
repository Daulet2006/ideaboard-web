export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback

  const message =
    error?.messageFromApi ||
    error?.data?.message ||
    error?.data?.error?.message ||
    error?.error?.message ||
    error?.message

  if (typeof message === 'string' && message.trim()) {
    return message.trim()
  }

  return fallback
}

export function normalizeAuthPayload(payload = {}) {
  return {
    username: typeof payload.username === 'string' ? payload.username.trim() : payload.username,
    email: typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : payload.email,
    password: typeof payload.password === 'string' ? payload.password : payload.password,
  }
}