from dataclasses import dataclass


PASS = "PASS"
WARNING = "WARNING"
IMPOSSIBLE = "IMPOSSIBLE"


@dataclass(frozen=True)
class ShelfLifeResult:
    status: str
    message: str


def evaluate_shelf_life(
    product_name: str,
    requested_days: int,
    typical_days: int,
    max_realistic_days: int,
) -> ShelfLifeResult:
    """Compare a customer's requested remaining shelf life to store reality."""
    if requested_days <= typical_days:
        return ShelfLifeResult(
            status=PASS,
            message=(
                f"{product_name} can usually meet {requested_days}+ days remaining."
            ),
        )

    if requested_days <= max_realistic_days:
        return ShelfLifeResult(
            status=WARNING,
            message=(
                f"{product_name} with {requested_days}+ days may be available, "
                "but the shopper should verify dates carefully."
            ),
        )

    return ShelfLifeResult(
        status=IMPOSSIBLE,
        message=(
            f"{product_name} rarely has {requested_days}+ days remaining. "
            f"Recommend choosing {max_realistic_days} days or less."
        ),
    )
