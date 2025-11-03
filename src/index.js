// A tiny compose utility as the library's main export

/**
 * compose(...fns)(value) - left-to-right composition
 * Example: compose(x => x + 1, x => x * 2)(3) === 8
 */
export function compose(...fns) {
  return (input) => fns.reduce((acc, fn) => fn(acc), input)
}

export default compose
