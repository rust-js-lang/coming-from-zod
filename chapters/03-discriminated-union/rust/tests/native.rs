//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_03_discriminated_union::{Shape, area, parse_shape};
use serde::Deserialize;

#[derive(Deserialize)]
struct Case {
    text: String,
    why: String,
    rust: Option<String>,
}

#[test]
fn native_rust_takes_and_refuses_each_case() {
    let cases: Vec<Case> = serde_json::from_str(include_str!("../../cases.json")).unwrap();
    for case in cases {
        let refusal = parse_shape(&case.text).err();
        assert_eq!(refusal, case.rust, "{}", case.why);
    }
}

#[test]
fn each_shape_has_its_area() {
    let areas: Vec<f64> = [
        r#"{"type":"circle","radius":2}"#,
        r#"{"type":"square","side":3}"#,
        r#"{"type":"rectangle","width":2,"height":5}"#,
    ]
    .iter()
    .map(|text| area(&parse_shape(text).unwrap()))
    .collect();
    assert_eq!(areas, [std::f64::consts::PI * 4.0, 9.0, 10.0]);
    assert!(matches!(parse_shape(r#"{"type":"square","side":3}"#), Ok(Shape::Square { side }) if side == 3.0));
}
