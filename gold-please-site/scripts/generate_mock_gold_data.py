import json
from datetime import datetime, timedelta

def make_minute(start, open_price, count):
    points = []
    base = datetime.fromisoformat(start)
    for i in range(count):
        fraction = 60 * i / (count - 1)
        point_time = base + timedelta(seconds=fraction)
        date = point_time.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        variation = ((i % 8) - 4) * 0.18 + (0.1 if i % 2 == 0 else -0.1)
        value = round(open_price + variation + (i / count) * 1.2 - 0.6, 2)
        points.append({
            'date': date,
            'open': open_price,
            'value': value,
            'volume': 12000 + (i * 85) % 7000,
        })
    return points

points = make_minute('2024-01-01T00:00:00', 4700.0, 64) + make_minute('2024-01-01T00:01:00', 4708.5, 64)
with open('src/data/mockGoldPrices.json', 'w', encoding='utf-8') as f:
    json.dump(points, f, indent=2)
