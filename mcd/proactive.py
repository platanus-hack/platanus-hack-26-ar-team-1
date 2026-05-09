"""
Proactive check — runs every hour via APScheduler (called from app.py).
Since patients initiate contact themselves (no outbound templates needed),
this only flags patients who never replied or didn't finish within the window.
"""
from datetime import datetime, timezone, timedelta
from database.supabase import _db


NON_RESPONSIVE_HOURS = 48  # patient loaded but never messaged in 48h → red


def run_proactive_check():
    print(f"[proactive] Running check at {datetime.now(timezone.utc).isoformat()}")
    try:
        _flag_non_responsive()
    except Exception as e:
        import traceback
        print("[proactive] Error:", e)
        print(traceback.format_exc())


def _flag_non_responsive():
    db = _db()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=NON_RESPONSIVE_HOURS)).isoformat()

    # Patients loaded by doctor but never initiated contact
    result = (
        db.table("patients")
        .select("id, name, phone_number, created_at")
        .eq("status", "pending")
        .lt("created_at", cutoff)
        .execute()
    )
    pending = result.data or []

    for p in pending:
        db.table("patients").update({"status": "non_responsive"}).eq("id", p["id"]).execute()
        print(f"[proactive] Marked non_responsive: {p['name']} ({p['phone_number']})")

    if pending:
        print(f"[proactive] Flagged {len(pending)} patients as non_responsive")
    else:
        print("[proactive] No new non_responsive patients")


if __name__ == "__main__":
    # Can also be run directly: python proactive.py
    run_proactive_check()
