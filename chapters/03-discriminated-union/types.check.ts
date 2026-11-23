// What TypeScript checks of a union, checked by `tsc` (bun run types). Each
// `@ts-expect-error` must be needed, or tsc fails.
import * as rust from './rust/src/lib.js'
import * as zod from './zod/shape.ts'

// rust-js's Shape and zod's are one type: each is given where the other is asked.
export const fromZod: rust.Shape = { type: 'circle', radius: 2 } satisfies zod.Shape
export const fromRust: zod.Shape = fromZod

// Either way, a field another kind of shape has is refused.
// @ts-expect-error a circle has no side
export const wrong: rust.Shape = { type: 'circle', side: 2 }

// A switch that leaves a kind out is fine with TypeScript when nothing is
// returned: it never asks for the rest.
export function drawOnlyCircles(shape: zod.Shape): void {
  switch (shape.type) {
    case 'circle':
      console.log(shape.radius)
  }
}

// You ask for every kind by hand, with `never`: what's left must be nothing.
export function draw(shape: zod.Shape): void {
  switch (shape.type) {
    case 'circle':
    case 'square':
      return
    default: {
      // @ts-expect-error a rectangle is left: Type '{ type: "rectangle"; ... }' is not assignable to type 'never'
      const left: never = shape
      return left
    }
  }
}
