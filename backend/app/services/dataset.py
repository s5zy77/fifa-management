import json
import os
from typing import Dict, Any, List

class DatasetStore:
    _instance = None
    
    def __init__(self):
        self.match = {}
        self.zones = []
        self.signals = []
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
            cls._instance.load_default()
        return cls._instance

    def load_default(self):
        filepath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/upload_template.json"))
        try:
            with open(filepath, "r") as f:
                data = json.load(f)
                self.load_data(data)
        except Exception as e:
            print(f"Warning: Could not load default dataset from {filepath}: {e}")

    def load_data(self, data: Dict[str, Any]):
        self.match = data.get("match", {})
        self.zones = data.get("zones", [])
        self.signals = data.get("signals", [])

    def get_zone(self, zone_id: str) -> Dict[str, Any]:
        for z in self.zones:
            if z["zoneId"] == zone_id:
                return z
        return None

    def get_signals_for_zone(self, zone_id: str) -> List[Dict[str, Any]]:
        return [s for s in self.signals if s["zoneId"] == zone_id]
        
    def get_current_signal(self, zone_id: str, timestamp: str = None) -> Dict[str, Any]:
        # For prototype simplicity, return the highest signal or first if timestamp not specified
        sigs = self.get_signals_for_zone(zone_id)
        if not sigs:
            return None
        return sigs[-1] # Return the latest for now

def get_dataset() -> DatasetStore:
    return DatasetStore.get_instance()
