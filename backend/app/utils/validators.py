"""
Utility validators and helpers.
"""

import re
from typing import Optional


GITHUB_REPO_URL_RE = re.compile(
    r"^https://github\.com/(?P<owner>[\w\-\.]+)/(?P<repo>[\w\-\.]+)/?$"
)


def parse_github_url(url: str) -> Optional[tuple[str, str]]:
    """
    Parse a GitHub repository URL and return (owner, repo_name).
    Returns None if the URL is not a valid GitHub repo URL.
    """
    match = GITHUB_REPO_URL_RE.match(url.rstrip("/"))
    if not match:
        return None
    return match.group("owner"), match.group("repo")


def is_valid_github_url(url: str) -> bool:
    """Return True if the URL is a valid GitHub repository URL."""
    return parse_github_url(url) is not None


def slugify(value: str) -> str:
    """Convert a string to a lowercase slug with hyphens."""
    value = value.lower().strip()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[\s_]+", "-", value)
    return re.sub(r"-+", "-", value)


def is_valid_email(email: str) -> bool:
    """Simple regex for email validation."""
    if not email:
        return False
    return re.match(r"[^@]+@[^@]+\.[^@]+", email) is not None


def validate_sql_safe(value: str) -> bool:
    """
    Lightweight defensive check for common SQL injection characters/patterns.
    Returns False if dangerous patterns are detected.
    """
    if not value:
        return True
    
    # Common SQL injection patterns
    patterns = [
        r"' OR 1=1",
        r"--",
        r";",
        r"DROP TABLE",
        r"UNION SELECT",
        r"OR \"\"=\"",
    ]
    
    for pattern in patterns:
        if re.search(pattern, value, re.IGNORECASE):
            return False
    return True
