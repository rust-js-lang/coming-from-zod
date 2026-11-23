//! Chapter 14: TypeScript callers. What a crate's `.d.ts` promises a
//! TypeScript app that calls it, and what it can't.

use serde::Deserialize;

/// An order's id: only `parse_order` makes one.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct OrderId(u32);

impl OrderId {
    pub fn number(&self) -> u32 {
        self.0
    }
}

/// Where an order is.
#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Status {
    #[cfg_attr(rust_js, rust_js::name = "open")]
    Open,
    #[cfg_attr(rust_js, rust_js::name = "shipped")]
    Shipped,
}

/// One line of an order.
#[derive(Debug, Clone, Deserialize)]
pub struct Item {
    pub sku: String,
    pub qty: u32,
}

/// An order.
#[derive(Debug, Clone, Deserialize)]
pub struct Order {
    pub id: OrderId,
    pub status: Status,
    pub items: Vec<Item>,
    pub note: Option<String>,
}

/// Reads an `Order` out of JSON text, or says why it can't: the one way in
/// that checks everything.
pub fn parse_order(text: &str) -> Result<Order, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// How many things are in an order.
pub fn count(order: &Order) -> u32 {
    order.items.iter().map(|item| item.qty).sum()
}

/// The order with one more line.
pub fn with_item(order: &Order, item: Item) -> Order {
    let mut more = order.clone();
    more.items.push(item);
    more
}

/// A label for the order: `#7 (open, 3 things)`, and its note.
pub fn label(order: &Order) -> String {
    let status = match order.status {
        Status::Open => "open",
        Status::Shipped => "shipped",
    };
    let label = format!("#{} ({status}, {} things)", order.id.number(), count(order));
    match &order.note {
        Some(note) => format!("{label}: {note}"),
        None => label,
    }
}

/// Twice `n`.
pub fn double(n: u32) -> u32 {
    n * 2
}
