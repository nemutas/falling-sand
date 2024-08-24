import baseVs from './base.vs'
import inputFs from './input.fs'
import outputFs from './output.fs'
import directionFs from './direction.fs'
import updateFs from './update.fs'

export const shader = {
  vs: {
    base: baseVs,
  },
  fs: {
    input: inputFs,
    output: outputFs,
    direction: directionFs,
    update: updateFs,
  },
}

export type FS = keyof typeof shader.fs
