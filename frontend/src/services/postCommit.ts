export type PostCommitErrorHandler = (message: string, error: unknown) => void

export const defaultPostCommitErrorHandler: PostCommitErrorHandler = (message, error) => {
  console.error(message, error)
}

export async function runPostCommitEffect(
  message: string,
  effect: () => Promise<void>,
  onError: PostCommitErrorHandler,
) {
  try {
    await effect()
  } catch (error) {
    onError(message, error)
  }
}
