# 12. `.superRefine` is `try_from` of the whole

## Rules about more than one field

Some rules can't be checked one field at a time. A hotel booking's
check-out must be after its check-in, and a double room sleeps two. zod
checks those after every field is read, with `.superRefine`, and puts each
problem on the field it's about:

```ts
// zod/booking.ts
export const Booking = z
  .object({ checkIn: z.string(), checkOut: z.string(), guests: z.number().int(), room: z.enum(['single', 'double', 'suite']) })
  .superRefine((booking, ctx) => {
    if (booking.checkOut <= booking.checkIn) {
      ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'must be after check-in' })
    }
    if (booking.guests > sleeps[booking.room]) {
      ctx.addIssue({ code: 'custom', path: ['guests'], message: `a ${booking.room} room sleeps ${sleeps[booking.room]}` })
    }
  })
```

## The Rust way: read a form, then make a booking of it

Chapter 2 made an `Email` that could only exist if it was valid. This is
the same idea for a whole struct. serde reads a `BookingForm`, every field
and no rules about how they fit together. A `Booking` can only be made
from a form that keeps the rules:

```rust
// rust/src/lib.rs (shortened)
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct BookingForm { check_in: String, check_out: String, guests: u32, room: Room }

#[derive(Deserialize)]
#[serde(try_from = "BookingForm")]
pub struct Booking { pub check_in: String, pub check_out: String, pub guests: u32, pub room: Room }

impl TryFrom<BookingForm> for Booking {
    type Error = String;

    fn try_from(form: BookingForm) -> Result<Self, Self::Error> {
        let mut problems = Vec::new();
        if form.check_out <= form.check_in {
            problems.push("checkOut: must be after check-in".to_string());
        }
        if form.guests > form.room.sleeps() {
            problems.push(format!("guests: a {room} room sleeps {}", form.room.sleeps()));
        }
        // .. and the rest
        match problems.is_empty() {
            true => Ok(Booking { .. }),
            false => Err(problems.join(" | ")),
        }
    }
}
```

`#[serde(try_from = "BookingForm")]` tells serde: to read a `Booking`, read
a `BookingForm`, then call `try_from`. Like `.superRefine`, it collects
every problem, not just the first. (serde stops at the first problem
*while reading fields*, chapter 5, but once you have the whole form,
checking it is your code, and your code can keep going.)

## What rust-js writes

```js
// rust/src/lib.js (generated)
function bookingDeserialize_deserialize(json) {
  return $json.tried(
    bookingTryFromBookingForm_tryFrom(bookingFormDeserialize_deserialize(json)),
    (error) => error,
  );
}

function bookingTryFromBookingForm_tryFrom(form) {
  const problems = [];
  // ..
  if ($cmp(form.checkOut, form.checkIn) <= 0) {
    problems.push("checkOut: must be after check-in");
  }
  // ..
}
```

Read the form, then try to make a booking of it: the same two steps.

## Side by side

`bun chapters/12-refine-the-whole/compare.ts`:

```
{"checkIn":"2026-12-04","checkOut":"2026-12-01","guests":3,"room":"double"}   (two rules broken at once)
  zod:  refused: checkOut: must be after check-in | guests: a double room sleeps 2
  rust: refused: checkOut: must be after check-in | guests: a double room sleeps 2
{"checkIn":"Dec 1","checkOut":"2026-12-04","guests":2,"room":"single"}   (a day written another way, and too many guests)
  zod:  refused: checkIn: not a day | checkOut: must be after check-in | guests: a single room sleeps 1
  rust: refused: checkIn: not a day | checkOut: must be after check-in | guests: a single room sleeps 1
{"checkIn":"2026-12-01","checkOut":"2026-12-04","guests":-1,"room":"suite"}   (guests below 0)
  zod:  refused: guests: at least one
  rust: refused: invalid value: integer `-1`, expected u32 at line 1 column 59
```

(The rest are in [cases.json](cases.json).) Where the rules about the
whole refuse a booking, both list every rule it breaks, word for word, in
the same order. `compare.test.ts` checks exactly that.

## Where it's different

- **Some rules move into the types.** zod's `guests` is any whole number,
  so `-1` reaches `.superRefine` and gets "at least one". Rust's `guests`
  is a `u32`, which can't be negative, so `-1` never makes it into a
  `BookingForm`: serde refuses it while reading. A type is a rule you
  don't have to write.
- **No place in the text.** An error from reading a field says where it
  was, `at line 1 column 59`. An error from `try_from` doesn't, because
  it's about the whole booking, not a spot in the JSON. zod has the same
  split, with no path for an issue on the object itself.
- **Rust's problems are a string; zod's are a list.** Here `try_from`
  joins them with ` | `, because that's all serde's error can carry. If a
  form needs each problem next to its box, return them separately: have
  `parse_booking` read the form itself and return a `Vec` of problems,
  without `try_from`.
- **"Dec 1" sorts after "2026".** Both sides compare days as text, which
  only works for days written `2026-12-01`, so the second case also says
  check-out is too early. A real app would read a date type (chrono or
  jiff in Rust, `z.iso.date()` and a `Date` in zod) and compare that.

## Try it

Change `guests: u32` to `guests: i32` in both structs, and `sleeps` to
return an `i32` too, and run `cargo test` and `bun run rust`. Now `-1`
reaches `try_from`, and Rust says
`guests: at least one`, as zod does. The test fails on that case,
because `cases.json` expected the old refusal. You just watched a rule
move out of the type and into the code.
