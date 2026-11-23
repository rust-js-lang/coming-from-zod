//! Chapter 3: a discriminated union is an enum. Each variant is one kind of
//! shape, with only the fields that kind has.

use serde::Deserialize;
use std::f64::consts::PI;

/// A shape, as JSON sends one: `{"type":"circle","radius":2}`.
///
/// `#[serde(..)]` says how the JSON is tagged. `#[rust_js::..]` says how the
/// JavaScript object is, the same way, so TypeScript sees what zod's
/// `z.infer` would give.
#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
#[cfg_attr(rust_js, rust_js::tag = "type")]
pub enum Shape {
    #[cfg_attr(rust_js, rust_js::name = "circle")]
    Circle { radius: f64 },
    #[cfg_attr(rust_js, rust_js::name = "square")]
    Square { side: f64 },
    #[cfg_attr(rust_js, rust_js::name = "rectangle")]
    Rectangle { width: f64, height: f64 },
}

/// Reads a `Shape` out of JSON text, or says why it can't.
pub fn parse_shape(text: &str) -> Result<Shape, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// The area of a shape.
///
/// A `match` must cover every kind of shape. Leave one out and the program
/// doesn't compile:
///
/// ```compile_fail,E0004
/// use chapter_03_discriminated_union::Shape;
///
/// fn area(shape: &Shape) -> f64 {
///     match shape {
///         Shape::Circle { radius } => 3.0 * radius * radius,
///         Shape::Square { side } => side * side,
///     }
/// }
/// ```
pub fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle { radius } => PI * radius * radius,
        Shape::Square { side } => side * side,
        Shape::Rectangle { width, height } => width * height,
    }
}
