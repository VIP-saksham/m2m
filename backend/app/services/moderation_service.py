SUSPICIOUS_TERMS = {
    'guaranteed profit', 'double money', 'send otp', 'share password',
    'advance fee', 'crypto', 'wire transfer', '100% guaranteed',
}


def scan_text(text):
    value = (text or '').lower()
    matches = [term for term in SUSPICIOUS_TERMS if term in value]
    return {'flagged': bool(matches), 'matches': matches, 'confidence': min(0.98, 0.55 + len(matches) * 0.12)}
