import re
from typing import Tuple, Optional

# Valid Indonesian regional plate codes
INDONESIAN_REGION_CODES = {
    "A", "AA", "AB", "AD", "AE", "AG", "B", "BA", "BB", "BD", "BE", "BG",
    "BH", "BK", "BL", "BM", "BN", "BP", "BR", "CC", "CD", "D", "DA", "DB",
    "DC", "DD", "DE", "DG", "DH", "DK", "DL", "DM", "DN", "DP", "DR", "DT",
    "DW", "E", "EA", "EB", "ED", "F", "G", "H", "K", "KB", "KH", "KT", "KU",
    "L", "M", "N", "P", "PA", "PB", "R", "S", "T", "W", "Z"
}

# Regex for Indonesian License Plate:
# Group 1: 1-2 letters (Region)
# Group 2: 1-4 digits (Number)
# Group 3: 1-3 letters (Series suffix)
TNKB_REGEX = re.compile(r"^([A-Z]{1,2})\s*([0-9]{1,4})\s*([A-Z]{1,3})$")

def clean_raw_text(text: str) -> str:
    """Removes non-alphanumeric noise, symbols, and extra spaces."""
    if not text:
        return ""
    # Replace common separators with spaces
    cleaned = re.sub(r"[\-_\.:/|\\]", " ", text)
    # Remove all characters except alphanumeric and whitespace
    cleaned = re.sub(r"[^A-Za-z0-9\s]", "", cleaned)
    # Collapse multiple whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip().upper()
    return cleaned

def normalize_indonesian_plate(raw_text: str) -> Tuple[Optional[str], Optional[str], bool]:
    """
    Normalizes a detected plate string to standard Indonesian TNKB format.
    
    Returns:
        tuple (formatted_plate, clean_plate, is_valid_format)
        - formatted_plate: 'B 9504 TEI'
        - clean_plate: 'B9504TEI'
        - is_valid_format: True if strictly matches Indonesian plate standard
    """
    if not raw_text:
        return None, None, False

    cleaned = clean_raw_text(raw_text)
    if not cleaned:
        return None, None, False

    # Attempt direct regex match on cleaned string
    match = TNKB_REGEX.match(cleaned)
    if match:
        region, number, suffix = match.groups()
        if region in INDONESIAN_REGION_CODES or len(region) <= 2:
            formatted = f"{region} {number} {suffix}"
            clean = f"{region}{number}{suffix}"
            return formatted, clean, True

    # If space-delimited tokens exist, try matching tokens
    tokens = cleaned.split()
    if len(tokens) == 3:
        p_region, p_number, p_suffix = tokens[0], tokens[1], tokens[2]
        if (
            1 <= len(p_region) <= 2 and p_region.isalpha() and
            1 <= len(p_number) <= 4 and p_number.isdigit() and
            1 <= len(p_suffix) <= 3 and p_suffix.isalpha()
        ):
            formatted = f"{p_region} {p_number} {p_suffix}"
            clean = f"{p_region}{p_number}{p_suffix}"
            return formatted, clean, True

    # Try searching pattern inside a longer string (e.g. if OCR caught frame or bumper text)
    search_match = re.search(r"\b([A-Z]{1,2})\s*([0-9]{1,4})\s*([A-Z]{1,3})\b", cleaned)
    if search_match:
        region, number, suffix = search_match.groups()
        if region in INDONESIAN_REGION_CODES or len(region) <= 2:
            formatted = f"{region} {number} {suffix}"
            clean = f"{region}{number}{suffix}"
            return formatted, clean, True

    # Fallback: Just return compacted alphanumeric if pattern wasn't strictly parsed
    compact = re.sub(r"\s+", "", cleaned)
    if len(compact) >= 4:
        return cleaned, compact, False

    return None, None, False

def compare_plates(detected_clean: Optional[str], expected_clean: Optional[str]) -> bool:
    """
    Safely compares detected plate with expected plate (both stripped of spaces and uppercased).
    """
    if not detected_clean or not expected_clean:
        return False

    d = re.sub(r"[^A-Za-z0-9]", "", detected_clean).upper()
    e = re.sub(r"[^A-Za-z0-9]", "", expected_clean).upper()
    return d == e

