"""Serializable estimator wrappers shared by training and inference."""

from typing import Any

import numpy as np
from sklearn.pipeline import Pipeline


class LogTargetRegressor:
    """Fits log1p(fee) and returns transfer-fee predictions in EUR."""

    def __init__(self, base_regressor: Pipeline):
        self.base_regressor = base_regressor

    def fit(self, X: Any, y: Any):
        self.base_regressor.fit(X, np.log1p(np.asarray(y, dtype=float)))
        return self

    def predict(self, X: Any):
        return np.expm1(self.base_regressor.predict(X)).clip(min=0)
