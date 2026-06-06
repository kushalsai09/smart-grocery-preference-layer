from collections.abc import Mapping


CATEGORY_HELPER_TEXT = {
    "Dairy": "Keep the same dairy type unless approved.",
    "Meat": "Do not change meat type unless approved.",
    "Vegetables": "Avoid soft, damaged, or poor-quality items.",
    "Leafy Greens": "Avoid wilted, yellow, wet, or slimy leaves.",
    "Bakery": "Prefer same-day or freshest bakery date.",
    "Bread/Wheat": "Keep the same bread type when possible.",
    "Produce/Fruits": "Respect ripeness preference.",
}

DEFAULT_BACKUP_RULE = {
    "same_item_freshest_available": True,
    "same_item_different_size": True,
    "organic_or_premium_allowed": False,
    "max_price_increase": 2,
    "similar_item_same_category": False,
    "reduce_quantity_allowed": True,
    "skip_if_no_approved_option": True,
}


def build_backup_instructions(rule: Mapping) -> list[str]:
    instructions = [CATEGORY_HELPER_TEXT[rule["category"]]]

    if rule["same_item_freshest_available"]:
        instructions.append("Choose the freshest available version of the same item.")

    instructions.append(
        "A different package size is approved."
        if rule["same_item_different_size"]
        else "Keep the original package size."
    )

    if rule["organic_or_premium_allowed"]:
        instructions.append("An organic or premium version is approved.")

    max_price_increase = rule["max_price_increase"]
    instructions.append(
        f"Keep any price increase within ${max_price_increase}."
        if max_price_increase
        else "Do not increase the price."
    )

    instructions.append(
        "A similar item in the same category is approved."
        if rule["similar_item_same_category"]
        else "Do not switch to a different item."
    )

    if rule["reduce_quantity_allowed"]:
        instructions.append("Reduce the quantity if that helps fulfill the order.")

    if rule["skip_if_no_approved_option"]:
        instructions.append("Skip the item if no approved option is available.")

    return instructions
