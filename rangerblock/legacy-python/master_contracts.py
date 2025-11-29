# MASTER PROTOTYPE: RangerCode Smart Contracts V1
# Synthesized by: Gemini, General Manager
# Mission: To forge a secure, precise, and fair economic engine for the RangerOS ecosystem.

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP, getcontext
from typing import Dict, List, Optional, Callable, Set
import uuid
import time

# ChatGPT's Precision Principle: Use Decimal for all financial calculations.
getcontext().prec = 28
def quantize_eur(d: Decimal) -> Decimal:
    """Helper to ensure all money is rounded to 2 decimal places."""
    return d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def now_utc() -> datetime:
    """Mockable UTC time function."""
    return datetime.utcnow()

# --- EducationFund Contract ---
class EducationFund:
    """A transparent, mission-critical contract to track all educational contributions."""
    def __init__(self):
        self.total_donated: Decimal = Decimal("0.00")
        print("[EducationFund] Initialized. Awaiting contributions for the mission.")

    def receive_tithe(self, amount: Decimal, source_description: str):
        """Adds a tithe to the fund, logging its source for transparency."""
        self.total_donated += quantize_eur(amount)
        print(f"[EducationFund] Received tithe of €{amount:.2f} from {source_description}. New Balance: €{self.total_donated:.2f}")

    def get_balance(self) -> Decimal:
        return self.total_donated

# --- MultiSigTreasury Contract (Qwen's Secure Architecture) ---
@dataclass
class TreasuryTransaction:
    tx_id: str; proposer: str; recipient: str; amount: Decimal; description: str; created_at: datetime
    approvals: Set[str] = field(default_factory=set)
    final_approval_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    status: str = "pending"

class MultiSigTreasury:
    """A 3-of-3 multi-signature wallet with a 7-day timelock, ensuring democratic and deliberate control."""
    TIMELOCK_DURATION = timedelta(days=7)

    def __init__(self, authorized_signers: List[str], now_fn: Callable[[], datetime] = now_utc):
        if len(set(authorized_signers)) != 3:
            raise ValueError("Requires exactly 3 unique authorized signers.")
        self.authorized_signers = set(authorized_signers)
        self.now_fn = now_fn
        self.transactions: Dict[str, TreasuryTransaction] = {}
        self.balance: Decimal = Decimal("0.00")

    def deposit(self, amount: Decimal):
        self.balance += quantize_eur(amount)
        print(f"[Treasury] Deposited €{amount:.2f}. New Balance: €{self.balance:.2f}")

    def propose_transaction(self, proposer: str, recipient: str, amount: Decimal, description: str) -> str:
        if proposer not in self.authorized_signers: raise PermissionError(f"{proposer} is not authorized.")
        tx_id = str(uuid.uuid4())
        tx = TreasuryTransaction(tx_id=tx_id, proposer=proposer, recipient=recipient, amount=quantize_eur(amount), description=description, created_at=self.now_fn())
        tx.approvals.add(proposer)
        self.transactions[tx_id] = tx
        print(f"[Treasury] TXN {tx_id[:8]} proposed by {proposer} for €{tx.amount:.2f}.")
        return tx_id

    def approve_transaction(self, signer: str, tx_id: str):
        if signer not in self.authorized_signers: raise PermissionError(f"{signer} is not authorized.")
        tx = self.transactions[tx_id]
        if tx.status != 'pending': raise ValueError("Transaction is not pending approval.")
        tx.approvals.add(signer)
        print(f"[Treasury] TXN {tx_id[:8]} approved by {signer}. Total approvals: {len(tx.approvals)}/3.")
        if len(tx.approvals) == 3:
            tx.status = "approved"
            tx.final_approval_at = self.now_fn()
            print(f"[Treasury] Final approval for TXN {tx_id[:8]} received. 7-day timelock has begun.")

    def execute_transaction(self, tx_id: str):
        tx = self.transactions[tx_id]
        if tx.status != 'approved': raise ValueError(f"Transaction not approved.")
        if self.now_fn() < tx.final_approval_at + self.TIMELOCK_DURATION: raise TimeoutError("7-day timelock is still active.")
        if tx.amount > self.balance: raise ValueError("Insufficient treasury funds.")
        self.balance -= tx.amount
        tx.status = "executed"; tx.executed_at = self.now_fn()
        print(f"[Treasury] SUCCESS: TXN {tx_id[:8]} executed. €{tx.amount:.2f} sent to {tx.recipient}.")
        print(f"[Treasury] Remaining Balance: €{self.balance:.2f}")

# --- FairTradeMarketplace Contract ---
class FairTradeMarketplace:
    """Implements the RangerOS economy with the official Cosmic Constitution revenue split."""
    MAX_CREATOR_PRICE = Decimal("19.99")
    USER_SPEND_LIMIT_24H = Decimal("10.00")
    CREATOR_LISTING_LIMIT_24H = timedelta(hours=24)

    # Official RangerOS Fair Trade Protocol
    CREATOR_SHARE = Decimal("0.7360")
    EDUCATION_SHARE = Decimal("0.1000")
    OPS_SHARE = Decimal("0.0640")
    PARTNERS_SHARE = Decimal("0.0500")
    INVESTMENT_SHARE = Decimal("0.0500")

    def __init__(self, education_fund: EducationFund, now_fn: Callable[[], datetime] = now_utc):
        self.education_fund = education_fund; self.now_fn = now_fn
        self.items: Dict[str, Dict] = {}; self.creator_last_listing: Dict[str, datetime] = {}
        self.user_spend_history: Dict[str, List[Tuple[datetime, Decimal]]] = {}

    def list_item(self, creator_id: str, item_name: str, price: Decimal) -> str:
        price = quantize_eur(price)
        if price > self.MAX_CREATOR_PRICE: raise ValueError(f"Price €{price:.2f} exceeds the €{self.MAX_CREATOR_PRICE:.2f} cap.")
        now = self.now_fn()
        if creator_id in self.creator_last_listing and now - self.creator_last_listing[creator_id] < self.CREATOR_LISTING_LIMIT_24H:
            raise PermissionError("Creator can only list one item per 24 hours.")
        item_id = str(uuid.uuid4())
        self.items[item_id] = {"creator_id": creator_id, "name": item_name, "price": price, "status": "available"}
        self.creator_last_listing[creator_id] = now
        print(f"[Marketplace] Item '{item_name}' ({item_id[:8]}) listed by {creator_id} for €{price:.2f}.")
        return item_id

    def purchase_item(self, buyer_id: str, item_id: str) -> Dict[str, Decimal]:
        item = self.items[item_id]
        if item['status'] != 'available': raise ValueError("Item not available.")
        price = item['price']
        self._enforce_spend_cap(buyer_id, price)

        # Calculate revenue split according to the constitution
        creator_amount = quantize_eur(price * self.CREATOR_SHARE)
        education_amount = quantize_eur(price * self.EDUCATION_SHARE)
        ops_amount = quantize_eur(price * self.OPS_SHARE)
        partners_amount = quantize_eur(price * self.PARTNERS_SHARE)
        investment_amount = quantize_eur(price * self.INVESTMENT_SHARE)

        self.education_fund.receive_tithe(education_amount, f"purchase of {item['name']}")

        item['status'] = 'sold'
        if buyer_id not in self.user_spend_history: self.user_spend_history[buyer_id] = []
        self.user_spend_history[buyer_id].append((self.now_fn(), price))

        distribution = {
            "creator": creator_amount, "education_fund": education_amount, "rangeros_ops": ops_amount,
            "partners": partners_amount, "investment": investment_amount
        }
        print(f"[Marketplace] SUCCESS: {buyer_id} purchased '{item['name']}' for €{price:.2f}.")
        return distribution

    def _enforce_spend_cap(self, buyer_id: str, new_purchase_amount: Decimal):
        now = self.now_fn()
        recent_spends = self.user_spend_history.get(buyer_id, [])
        valid_spends = [s for s in recent_spends if now - s[0] < self.CREATOR_LISTING_LIMIT_24H]
        self.user_spend_history[buyer_id] = valid_spends
        total_spent = sum(s[1] for s in valid_spends)
        if total_spent + new_purchase_amount > self.USER_SPEND_LIMIT_24H:
            raise PermissionError(f"Purchase exceeds €{self.USER_SPEND_LIMIT_24H} daily spend limit.")