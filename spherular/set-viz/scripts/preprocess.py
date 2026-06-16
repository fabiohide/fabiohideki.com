#!/usr/bin/env python3
"""
Spherular Set-Viz Preprocessor
Fetches deck data from Supabase and generates static aggregates.json
for the dashboard's default (non-filtered) view.

Usage:
  python3 spherular/set-viz/scripts/preprocess.py
"""

import json
import math
import os
import sys
from collections import defaultdict

# --- Supabase config (same as app.js) ---
SUPABASE_URL = "https://vzuzwvhktwzitqhthsor.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_w7AVjc_WtYrt5Q5w6fkNFg_gXWffvh0"

# Metrics used for ECDF and histogram generation
# Keys match the DB column names; agg_key is how the JS app references them
METRICS = [
    {"db_key": "sas", "agg_key": "sas"},
    {"db_key": "aerc_base", "agg_key": "aercBase"},
    {"db_key": "synergy_net", "agg_key": "synergyNet"},
    {"db_key": "synergy_positive", "agg_key": "synergyPositive"},
    {"db_key": "synergy_negative", "agg_key": "synergyNegative"},
    {"db_key": "expected_amber", "agg_key": "expectedAmber"},
    {"db_key": "amber_control", "agg_key": "amberControl"},
    {"db_key": "creature_control", "agg_key": "creatureControl"},
    {"db_key": "effective_power", "agg_key": "effectivePower"},
]

# AERC component keys (DB column -> JS key)
AERC_COMPONENTS = [
    {"db_key": "expected_amber", "agg_key": "expectedAmber"},
    {"db_key": "amber_control", "agg_key": "amberControl"},
    {"db_key": "creature_control", "agg_key": "creatureControl"},
    {"db_key": "artifact_control", "agg_key": "artifactControl"},
    {"db_key": "efficiency", "agg_key": "efficiency"},
    {"db_key": "recursion", "agg_key": "recursion"},
    {"db_key": "effective_power", "agg_key": "effectivePower"},
    {"db_key": "creature_protection", "agg_key": "creatureProtection"},
    {"db_key": "disruption", "agg_key": "disruption"},
    {"db_key": "other", "agg_key": "other"},
]

COLLECTIONS = ["DRACONIAN_MEASURES", "GRIM_REMINDERS"]

ALL_HOUSES = [
    "Brobnar", "Ekwidon", "Geistoid", "Mars", "Ouboros",
    "Shadows", "Skyborn", "StarAlliance", "Unfathomable", "Untamed",
]


def percentile(sorted_vals, p):
    """Calculate the p-th percentile from a sorted list."""
    if not sorted_vals:
        return 0
    k = (len(sorted_vals) - 1) * (p / 100)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_vals[int(k)]
    return sorted_vals[f] * (c - k) + sorted_vals[c] * (k - f)


def compute_summary(values):
    """Compute summary statistics for a list of numeric values."""
    if not values:
        return {"mean": 0, "median": 0, "std": 0, "min": 0, "max": 0,
                "p10": 0, "p25": 0, "p75": 0, "p90": 0, "p95": 0, "p99": 0}
    sorted_v = sorted(values)
    n = len(sorted_v)
    mean = sum(sorted_v) / n
    variance = sum((x - mean) ** 2 for x in sorted_v) / n
    return {
        "mean": round(mean, 4),
        "median": round(percentile(sorted_v, 50), 4),
        "std": round(math.sqrt(variance), 4),
        "min": round(sorted_v[0], 4),
        "max": round(sorted_v[-1], 4),
        "p10": round(percentile(sorted_v, 10), 4),
        "p25": round(percentile(sorted_v, 25), 4),
        "p75": round(percentile(sorted_v, 75), 4),
        "p90": round(percentile(sorted_v, 90), 4),
        "p95": round(percentile(sorted_v, 95), 4),
        "p99": round(percentile(sorted_v, 99), 4),
    }


def compute_ecdf(values, num_points=200):
    """Compute ECDF as a list of {val, p} points."""
    if not values:
        return []
    sorted_v = sorted(values)
    n = len(sorted_v)
    # Sample evenly spaced points
    step = max(1, n // num_points)
    points = []
    for i in range(0, n, step):
        points.append({
            "val": round(sorted_v[i], 2),
            "p": round((i + 1) / n * 100, 2)
        })
    # Always include the last point
    if points[-1]["val"] != round(sorted_v[-1], 2):
        points.append({"val": round(sorted_v[-1], 2), "p": 100.0})
    return points


def compute_histogram(values, bin_width=1):
    """Compute histogram bins as a list of {x0, x1, count}."""
    if not values:
        return []
    min_v = math.floor(min(values))
    max_v = math.ceil(max(values))
    bins = []
    x = min_v
    while x < max_v:
        count = sum(1 for v in values if x <= v < x + bin_width)
        if count > 0:
            bins.append({"x0": x, "x1": x + bin_width, "count": count})
        x += bin_width
    return bins


def compute_density_2d(values_x, values_y, bin_x=2, bin_y=1):
    """Compute 2D density grid for synergy density plot."""
    if not values_x or not values_y:
        return []
    counts = defaultdict(int)
    for x, y in zip(values_x, values_y):
        bx = round(round(x / bin_x) * bin_x, 2)
        by = round(round(y / bin_y) * bin_y, 2)
        counts[(bx, by)] += 1
    return [{"x": k[0], "y": k[1], "count": v} for k, v in counts.items()]


def fetch_all_decks():
    """Fetch all decks from Supabase using the REST API with pagination."""
    try:
        import urllib.request
        import urllib.parse
    except ImportError:
        print("Error: urllib is required (part of Python stdlib)")
        sys.exit(1)

    all_decks = []
    page_size = 1000
    offset = 0

    while True:
        # Use the REST API directly
        url = f"{SUPABASE_URL}/rest/v1/kf_decks?select=*&order=keyforge_id&offset={offset}&limit={page_size}"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "count=exact",
        }

        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if not data:
                    break
                all_decks.extend(data)
                print(f"  Fetched {len(all_decks)} decks so far...")
                if len(data) < page_size:
                    break
                offset += page_size
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8") if e.fp else ""
            print(f"HTTP Error {e.code}: {body}")
            sys.exit(1)

    return all_decks


def get_values(decks, key):
    """Extract non-null numeric values for a given key from decks."""
    return [d[key] for d in decks if d.get(key) is not None]


def get_deck_houses(deck):
    """Extract houses from a deck (assumes 'houses' is an array field)."""
    houses = deck.get("houses")
    if isinstance(houses, list):
        return houses
    if isinstance(houses, str):
        try:
            return json.loads(houses)
        except (json.JSONDecodeError, TypeError):
            return []
    return []


def process_collection(decks):
    """Generate full aggregate structure for a list of decks."""
    result = {}

    # Summary
    sas_values = get_values(decks, "sas")
    sas_summary = compute_summary(sas_values)
    result["summary"] = {
        "total_decks": len(decks),
        "sas": sas_summary,
    }

    # ECDF per metric
    ecdf = {}
    for m in METRICS:
        vals = get_values(decks, m["db_key"])
        ecdf[m["agg_key"]] = compute_ecdf(vals)
    result["ecdf"] = ecdf

    # Histograms per metric
    histograms = {}
    for m in METRICS:
        vals = get_values(decks, m["db_key"])
        histograms[m["agg_key"]] = compute_histogram(vals, bin_width=1)
    result["histograms"] = histograms

    # Houses breakdown
    houses_data = {}
    house_decks = defaultdict(list)
    for deck in decks:
        for house in get_deck_houses(deck):
            house_decks[house].append(deck)

    for house in ALL_HOUSES:
        h_decks = house_decks.get(house, [])
        if not h_decks:
            houses_data[house] = {
                "count": 0,
                "sas_est": {"mean": 0, "p90": 0, "p99": 0, "max": 0},
                "sas_est_hist": [],
            }
            continue
        h_sas = get_values(h_decks, "sas")
        h_summary = compute_summary(h_sas)
        houses_data[house] = {
            "count": len(h_decks),
            "sas_est": {
                "mean": h_summary["mean"],
                "p90": h_summary["p90"],
                "p99": h_summary["p99"],
                "max": h_summary["max"],
            },
            "sas_est_hist": compute_histogram(h_sas, bin_width=1),
        }
    result["houses"] = houses_data

    # Synergy density (2D: aerc_base vs synergy_net)
    aerc_vals = get_values(decks, "aerc_base")
    syn_vals = get_values(decks, "synergy_net")
    # Need paired values
    paired = [(d["aerc_base"], d["synergy_net"])
              for d in decks
              if d.get("aerc_base") is not None and d.get("synergy_net") is not None]
    if paired:
        xs, ys = zip(*paired)
        result["synergy_density"] = compute_density_2d(list(xs), list(ys), bin_x=2, bin_y=1)
    else:
        result["synergy_density"] = []

    # AERC Components
    aerc_components = {}
    for comp in AERC_COMPONENTS:
        vals = get_values(decks, comp["db_key"])
        if vals:
            aerc_components[comp["agg_key"]] = {
                "mean": round(sum(vals) / len(vals), 4),
            }
        else:
            aerc_components[comp["agg_key"]] = {"mean": 0}
    result["aerc_components"] = aerc_components

    return result


def main():
    print("=" * 60)
    print("Spherular Set-Viz Preprocessor")
    print("=" * 60)

    # Determine output path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    set_viz_dir = os.path.dirname(script_dir)
    data_dir = os.path.join(set_viz_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    output_path = os.path.join(data_dir, "aggregates.json")

    print(f"\nOutput: {output_path}")
    print(f"Supabase: {SUPABASE_URL}")
    print()

    # Fetch decks
    print("Fetching decks from Supabase...")
    all_decks = fetch_all_decks()
    print(f"Total decks fetched: {len(all_decks)}")

    if not all_decks:
        print("ERROR: No decks found. Check Supabase connection and RLS policies.")
        sys.exit(1)

    # Process per collection
    aggregates = {}
    for col in COLLECTIONS:
        col_decks = [d for d in all_decks if d.get("expansion") == col]
        print(f"\nProcessing {col}: {len(col_decks)} decks")
        if col_decks:
            aggregates[col] = process_collection(col_decks)
        else:
            print(f"  WARNING: No decks for {col}")

    # Write output
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(aggregates, f, ensure_ascii=False)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"\n✅ aggregates.json written ({size_kb:.1f} KB)")
    print(f"   Path: {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
