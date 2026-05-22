import { createAvatar } from '@dicebear/core'
import { initials } from '@dicebear/collection'

export const getAvatar = (name: string): string => {
  const avatar = createAvatar(initials, {
    seed: name
  })

  return avatar.toString()
}
