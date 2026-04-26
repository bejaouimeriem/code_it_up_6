from db import get_connection


def get_full_inventory() -> str:
    """Get all inventory items with quantities."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT name, category, quantity, unit, min_required FROM inventory ORDER BY category")
            rows = cur.fetchall()
        if not rows:
            return "Inventory is empty."
        lines = ["Current Inventory:"]
        for r in rows:
            status = "✅" if r[2] >= r[4] else "⚠️ LOW STOCK"
            lines.append(f"  {status} {r[0]} ({r[1]}): {r[2]} {r[3]} (min needed: {r[4]})")
        return "\n".join(lines)
    finally:
        conn.close()


def check_item(item_name: str) -> str:
    """Check a specific inventory item by name."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT name, quantity, unit, min_required FROM inventory WHERE name ILIKE %s",
                (f"%{item_name}%",)
            )
            rows = cur.fetchall()
        if not rows:
            return f"'{item_name}' not found in inventory."
        return "\n".join([f"{r[0]}: {r[1]} {r[2]} (min required: {r[3]})" for r in rows])
    finally:
        conn.close()


def log_inventory_transaction(inventory_id: int, change_amount: int, reason: str) -> str:
    """Record an inventory change transaction."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO inventory_transactions (inventory_id, change_amount, reason) VALUES (%s, %s, %s)",
                (inventory_id, change_amount, reason)
            )
        conn.commit()
        return "Transaction logged."
    finally:
        conn.close()