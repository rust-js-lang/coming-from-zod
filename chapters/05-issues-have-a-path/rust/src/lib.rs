//! Chapter 5: an issue has a path. serde_json says where in the text a
//! read failed; serde_path_to_error says where in the value, as zod does.

use serde::Deserialize;

/// Who an order is for.
#[derive(Debug, Deserialize)]
pub struct Customer {
    pub name: String,
    pub email: String,
}

/// One line of an order: what, and how many.
#[derive(Debug, Deserialize)]
pub struct Item {
    pub sku: String,
    pub qty: u32,
}

/// An order: a customer, and what they ordered.
#[derive(Debug, Deserialize)]
pub struct Order {
    pub customer: Customer,
    pub items: Vec<Item>,
}

/// Reads an `Order` out of JSON text, or says why it can't, as serde_json
/// alone says it: where in the text.
pub fn parse_order_plain(text: &str) -> Result<Order, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// Reads an `Order` out of JSON text, or says why it can't, and where in
/// the order: `items[1].qty: invalid value: ..`.
pub fn parse_order(text: &str) -> Result<Order, String> {
    let reader = &mut serde_json::Deserializer::from_str(text);
    serde_path_to_error::deserialize(reader)
        .map_err(|error| format!("{}: {}", error.path(), error.inner()))
}

/// What a dashboard shows for an order: who, and how many things.
pub fn summary(order: &Order) -> String {
    let count: u32 = order.items.iter().map(|item| item.qty).sum();
    format!("{} ordered {count}", order.customer.name)
}
