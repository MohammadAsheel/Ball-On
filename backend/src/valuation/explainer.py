"""Individual, model-derived explanations for fitted linear valuation models."""

from __future__ import annotations

from typing import Any


def ridge_contributions(model: Any, frame: Any) -> list[dict[str, float | str]]:
    """Return additive contributions in log-target space, never invented EUR effects."""
    pipeline = model.base_regressor
    transformed = pipeline.named_steps["prep"].transform(frame)
    regressor = pipeline.named_steps["reg"]
    names = pipeline.named_steps["prep"].get_feature_names_out()
    contributions = transformed[0] * regressor.coef_
    rows = [
        {"feature": str(name), "contribution_log_fee": round(float(value), 6),
         "direction": "positive" if value >= 0 else "negative"}
        for name, value in zip(names, contributions)
    ]
    return sorted(rows, key=lambda item: abs(float(item["contribution_log_fee"])), reverse=True)
