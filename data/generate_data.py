import json
import random
from datetime import datetime, timedelta

def generate():
    # 1. Match Data
    match = {
        "matchId": "M-2026-07-15",
        "venueId": "V-METLIFE",
        "kickoffTime": "2026-07-15T15:00:00Z",
        "gatesOpenTime": "2026-07-15T12:00:00Z",
        "expectedAttendance": 80000
    }

    # 2. Zones Data
    zones = [
        {
            "zoneId": "GATE-A",
            "type": "gate",
            "name": "North Gate A",
            "coordinates": {"x": 0.0, "y": 100.0},
            "capacitySqm": 1000,
            "adjacentZones": ["CONC-NORTH"],
            "walkTimeSeconds": 120
        },
        {
            "zoneId": "GATE-B",
            "type": "gate",
            "name": "South Gate B",
            "coordinates": {"x": 0.0, "y": -100.0},
            "capacitySqm": 1000,
            "adjacentZones": ["CONC-SOUTH"],
            "walkTimeSeconds": 120
        },
        {
            "zoneId": "CONC-NORTH",
            "type": "concourse",
            "name": "North Concourse",
            "coordinates": {"x": 0.0, "y": 50.0},
            "capacitySqm": 5000,
            "adjacentZones": ["GATE-A", "FOOD-1", "SEC-101", "SEC-102", "RESET-N"],
            "walkTimeSeconds": 60
        },
        {
            "zoneId": "CONC-SOUTH",
            "type": "concourse",
            "name": "South Concourse",
            "coordinates": {"x": 0.0, "y": -50.0},
            "capacitySqm": 5000,
            "adjacentZones": ["GATE-B", "REST-1", "SEC-103", "SEC-104", "RESET-S"],
            "walkTimeSeconds": 60
        },
        {
            "zoneId": "FOOD-1",
            "type": "foodcourt",
            "name": "North Food Court",
            "coordinates": {"x": -30.0, "y": 50.0},
            "capacitySqm": 500,
            "adjacentZones": ["CONC-NORTH"],
            "walkTimeSeconds": 30
        },
        {
            "zoneId": "REST-1",
            "type": "restroom",
            "name": "South Restrooms",
            "coordinates": {"x": 30.0, "y": -50.0},
            "capacitySqm": 200,
            "adjacentZones": ["CONC-SOUTH"],
            "walkTimeSeconds": 30
        },
        {
            "zoneId": "SEC-101",
            "type": "seating",
            "name": "Section 101",
            "coordinates": {"x": -20.0, "y": 20.0},
            "capacitySqm": 800,
            "adjacentZones": ["CONC-NORTH"],
            "walkTimeSeconds": 45
        },
        {
            "zoneId": "SEC-102",
            "type": "seating",
            "name": "Section 102",
            "coordinates": {"x": 20.0, "y": 20.0},
            "capacitySqm": 800,
            "adjacentZones": ["CONC-NORTH"],
            "walkTimeSeconds": 45
        },
        {
            "zoneId": "SEC-103",
            "type": "seating",
            "name": "Section 103",
            "coordinates": {"x": -20.0, "y": -20.0},
            "capacitySqm": 800,
            "adjacentZones": ["CONC-SOUTH"],
            "walkTimeSeconds": 45
        },
        {
            "zoneId": "SEC-104",
            "type": "seating",
            "name": "Section 104",
            "coordinates": {"x": 20.0, "y": -20.0},
            "capacitySqm": 800,
            "adjacentZones": ["CONC-SOUTH"],
            "walkTimeSeconds": 45
        },
        {
            "zoneId": "RESET-N",
            "type": "reset",
            "name": "North Sensory Room",
            "coordinates": {"x": 40.0, "y": 60.0},
            "capacitySqm": 100,
            "adjacentZones": ["CONC-NORTH"],
            "walkTimeSeconds": 20
        },
        {
            "zoneId": "RESET-S",
            "type": "reset",
            "name": "South Sensory Room",
            "coordinates": {"x": -40.0, "y": -60.0},
            "capacitySqm": 100,
            "adjacentZones": ["CONC-SOUTH"],
            "walkTimeSeconds": 20
        }
    ]

    # 3. Sensory Signals Data (Time-varying from 12:00 to 15:00, every 15 mins)
    signals = []
    base_time = datetime(2026, 7, 15, 12, 0, 0)
    for i in range(13): # 0 to 12 intervals of 15 mins (3 hours)
        current_time = base_time + timedelta(minutes=15 * i)
        ts_str = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        for z in zones:
            ztype = z["type"]
            # Base values depending on type
            if ztype == "gate":
                noise = random.randint(60, 95)
                crowd = random.uniform(1.0, 5.0)
                light = random.randint(300, 800)
            elif ztype == "concourse":
                noise = random.randint(70, 105)
                crowd = random.uniform(2.0, 7.0)
                light = random.randint(400, 900)
            elif ztype == "seating":
                noise = random.randint(80, 120)
                crowd = random.uniform(3.0, 8.0)
                light = random.randint(500, 1000)
            elif ztype == "reset":
                noise = random.randint(30, 45) # Keep reset zones quiet
                crowd = random.uniform(0.1, 1.0)
                light = random.randint(50, 150) # Dimmed lights
            else: # foodcourt, restroom
                noise = random.randint(65, 90)
                crowd = random.uniform(1.5, 6.0)
                light = random.randint(200, 600)
                
            # Simulate a spike closer to kickoff (interval 8-12)
            if i >= 8 and ztype not in ["reset"]:
                noise = min(130, noise + 15)
                crowd = min(10.0, crowd + 2.0)
                
            signals.append({
                "zoneId": z["zoneId"],
                "timestamp": ts_str,
                "noiseDb": float(round(noise, 1)),
                "crowdDensity": float(round(crowd, 2)),
                "lightLevel": float(round(light, 1))
            })

    # Save outputs
    with open("synthetic_zones.json", "w") as f:
        json.dump(zones, f, indent=2)
        
    with open("synthetic_signals.json", "w") as f:
        json.dump(signals, f, indent=2)
        
    with open("upload_template.json", "w") as f:
        json.dump({
            "match": match,
            "zones": zones,
            "signals": signals
        }, f, indent=2)

if __name__ == "__main__":
    generate()
