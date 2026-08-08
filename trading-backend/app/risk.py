"""Risk-based position sizing.

Given how much of the account balance the trader is willing to risk (as a
percentage) and where the stop-loss sits, compute the lot size so that if
the stop-loss is hit, the loss equals (roughly) that percentage of balance.

Uses the symbol's tick_value/tick_size directly (rather than "pips"), which
works uniformly across forex, metals, indices and crypto CFDs on MT5.
"""

import math
from dataclasses import dataclass


@dataclass
class LotCalcResult:
    lot: float
    risk_amount: float
    sl_distance: float
    capped: bool


def calculate_lot(
    *,
    balance: float,
    risk_percent: float,
    entry_price: float,
    stop_loss_price: float,
    tick_value: float,
    tick_size: float,
    volume_min: float,
    volume_max: float,
    volume_step: float,
    account_max_lot: float | None = None,
    hard_cap: float | None = None,
) -> LotCalcResult:
    if balance <= 0:
        raise ValueError("balance must be positive")
    if risk_percent <= 0:
        raise ValueError("risk_percent must be positive")
    if tick_size <= 0 or tick_value <= 0:
        raise ValueError("invalid symbol tick_size/tick_value")

    sl_distance = abs(entry_price - stop_loss_price)
    if sl_distance <= 0:
        raise ValueError("stop_loss_price must differ from entry_price")

    risk_amount = balance * (risk_percent / 100.0)
    loss_per_lot = (sl_distance / tick_size) * tick_value
    if loss_per_lot <= 0:
        raise ValueError("could not compute loss per lot for this symbol")

    raw_lot = risk_amount / loss_per_lot

    # Round DOWN to the nearest volume step so the realised risk never
    # exceeds what the trader asked for.
    steps = math.floor(raw_lot / volume_step + 1e-9)
    lot = steps * volume_step
    lot = round(lot, 8)

    capped = False
    if lot < volume_min:
        # Below the broker's minimum tradable size — use the minimum, which
        # means the *actual* risk taken is slightly higher than requested.
        lot = volume_min
        capped = True

    ceiling_candidates = [volume_max]
    if account_max_lot is not None:
        ceiling_candidates.append(account_max_lot)
    if hard_cap is not None:
        ceiling_candidates.append(hard_cap)
    ceiling = min(ceiling_candidates)

    if lot > ceiling:
        lot = math.floor(ceiling / volume_step + 1e-9) * volume_step
        lot = round(lot, 8)
        capped = True

    return LotCalcResult(
        lot=lot,
        risk_amount=risk_amount,
        sl_distance=sl_distance,
        capped=capped,
    )
