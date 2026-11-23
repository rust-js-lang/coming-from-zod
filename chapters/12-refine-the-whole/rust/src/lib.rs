//! Chapter 12: `.superRefine` is `try_from` of the whole. Rules about more
//! than one field are checked once every field is read, and a `Booking` is
//! made only of a form that keeps them.

use serde::Deserialize;

/// A room, and how many it sleeps.
#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Room {
    #[cfg_attr(rust_js, rust_js::name = "single")]
    Single,
    #[cfg_attr(rust_js, rust_js::name = "double")]
    Double,
    #[cfg_attr(rust_js, rust_js::name = "suite")]
    Suite,
}

impl Room {
    pub fn sleeps(self) -> u32 {
        match self {
            Room::Single => 1,
            Room::Double => 2,
            Room::Suite => 4,
        }
    }
}

/// What the booking form sends: each field read, none checked against
/// another yet.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct BookingForm {
    check_in: String,
    check_out: String,
    guests: u32,
    room: Room,
}

/// A booking whose dates and guests make sense together. It's read through
/// `BookingForm`, so every `Booking` read from JSON keeps the rules.
#[derive(Debug, Deserialize)]
#[serde(try_from = "BookingForm")]
pub struct Booking {
    pub check_in: String,
    pub check_out: String,
    pub guests: u32,
    pub room: Room,
}

/// Whether `text` is a day as `2026-12-01` writes it.
fn is_day(text: &str) -> bool {
    let parts: Vec<&str> = text.split('-').collect();
    matches!(parts.as_slice(), [y, m, d] if y.len() == 4 && m.len() == 2 && d.len() == 2
        && parts.iter().all(|part| part.chars().all(|c| c.is_ascii_digit())))
}

impl TryFrom<BookingForm> for Booking {
    type Error = String;

    /// Every rule the form breaks, each on its field, as zod's issues are.
    fn try_from(form: BookingForm) -> Result<Self, Self::Error> {
        let mut problems = Vec::new();
        if !is_day(&form.check_in) {
            problems.push("checkIn: not a day".to_string());
        }
        if !is_day(&form.check_out) {
            problems.push("checkOut: not a day".to_string());
        }
        // Days as `2026-12-01` write them sort as text does.
        if form.check_out <= form.check_in {
            problems.push("checkOut: must be after check-in".to_string());
        }
        if form.guests < 1 {
            problems.push("guests: at least one".to_string());
        }
        if form.guests > form.room.sleeps() {
            let room = format!("{:?}", form.room).to_lowercase();
            problems.push(format!("guests: a {room} room sleeps {}", form.room.sleeps()));
        }
        match problems.is_empty() {
            true => Ok(Booking {
                check_in: form.check_in,
                check_out: form.check_out,
                guests: form.guests,
                room: form.room,
            }),
            false => Err(problems.join(" | ")),
        }
    }
}

/// Reads a `Booking` out of JSON text, or says why it can't.
pub fn parse_booking(text: &str) -> Result<Booking, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// What the confirmation says.
pub fn confirmation(booking: &Booking) -> String {
    format!("{} → {}, {} in a {:?} room", booking.check_in, booking.check_out, booking.guests, booking.room)
}
