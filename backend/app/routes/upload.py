from fastapi import APIRouter, UploadFile, File, HTTPException
import json
from ..models.dataset import StadiumDataset
from ..services.dataset import get_dataset, DatasetStore
from pydantic import ValidationError

router = APIRouter(prefix="/api/upload", tags=["upload"])

@router.post("/")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Only JSON files are supported for upload.")
    
    try:
        content = await file.read()
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Malformed JSON file.")
        
    try:
        validated_data = StadiumDataset(**data)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Validation error: {e.errors()}")
        
    # Edge Case: Signals or Adjacent Zones referencing unknown zones
    zone_ids = {z.zoneId for z in validated_data.zones}
    for sig in validated_data.signals:
        if sig.zoneId not in zone_ids:
            raise HTTPException(status_code=400, detail=f"Signal references unknown zoneId: {sig.zoneId}")
            
    for z in validated_data.zones:
        for adj in z.adjacentZones:
            if adj not in zone_ids:
                raise HTTPException(status_code=400, detail=f"Zone {z.zoneId} references unknown adjacent zoneId: {adj}")
                
    # Validated! Overwrite the in-memory store immediately
    ds = get_dataset()
    # converting datetime fields to strings by passing through model_dump(mode="json")
    ds.load_data(validated_data.model_dump(mode="json"))
    
    return {"status": "success", "message": "Dataset successfully uploaded and applied to live reasoning endpoints."}
