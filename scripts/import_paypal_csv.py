#!/usr/bin/env python3
"""
Simple PayPal CSV importer.

Usage: python3 scripts/import_paypal_csv.py path/to/paypal_export.csv

It will append non-duplicate transactions to data/payments.json using Transaction ID
as the deduplication key.
"""
import csv
import json
import re
import sys
from decimal import Decimal
from pathlib import Path


def find_column(fieldnames, pattern_list):
    for p in pattern_list:
        for h in fieldnames:
            if p.lower() in h.lower():
                return h
    return None


def parse_row(row):
    # common column names
    tx_id = row.get('Transaction ID') or row.get('TransactionID') or row.get('Txn ID') or row.get('Transaction')
    from_email = row.get('From Email Address') or row.get('Payer Email') or row.get('Email Address')
    item_title = row.get('Item Title') or row.get('Item Name') or row.get('Item') or ''
    gross = row.get('Gross') or row.get('Amount') or '0'
    fee = row.get('Fee') or row.get('PayPal Fee') or '0'
    net = row.get('Net') or row.get('Net Amount') or '0'
    date = row.get('Date')

    # parse tokens from item title
    tokens = None
    m = re.search(r"([\d,]+(?:\.\d+)?)\s*BBUX", item_title, re.I)
    if m:
        tokens = float(m.group(1).replace(',', ''))

    def to_decimal(s):
        try:
            return Decimal(s.replace(',', '').strip())
        except Exception:
            return Decimal('0')

    return {
        'transaction_id': tx_id,
        'from_email': from_email,
        'item_title': item_title,
        'tokens': tokens,
        'gross_cad': float(to_decimal(gross)),
        'paypal_fee_cad': float(to_decimal(fee)),
        'net_cad': float(to_decimal(net)),
        'date': date,
        'raw_row': row,
    }


def main():
    if len(sys.argv) < 2:
        print('Usage: import_paypal_csv.py paypal.csv')
        sys.exit(1)

    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        print('CSV not found:', csv_path)
        sys.exit(1)

    data_file = Path('data/payments.json')
    if data_file.exists():
        arr = json.loads(data_file.read_text())
    else:
        arr = []

    existing_tx = {a.get('transaction_id') for a in arr if a.get('transaction_id')}

    with csv_path.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        added = 0
        for row in reader:
            parsed = parse_row(row)
            tx = parsed.get('transaction_id')
            if not tx:
                # skip rows without tx id
                continue
            if tx in existing_tx:
                print('Skipping existing tx:', tx)
                continue

            rec = {
                'source': 'paypal',
                'transaction_id': parsed.get('transaction_id'),
                'date': parsed.get('date'),
                'buyer_email': parsed.get('from_email'),
                'item_description': parsed.get('item_title'),
                'tokens': parsed.get('tokens'),
                'quantity': 1,
                'gross_cad': parsed.get('gross_cad') or 0.0,
                'paypal_fee_cad': parsed.get('paypal_fee_cad') or 0.0,
                'net_cad': parsed.get('net_cad') or 0.0,
                'status': 'completed',
                'imported_via': str(csv_path.name),
            }

            arr.append(rec)
            existing_tx.add(tx)
            added += 1

    data_file.write_text(json.dumps(arr, indent=2))
    print(f'Imported {added} new transactions into {data_file}')


if __name__ == '__main__':
    main()
