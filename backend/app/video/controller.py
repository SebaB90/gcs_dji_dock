from fastapi import APIRouter, HTTPException, Depends
from app.users.service import get_current_user, role_required
from app.users.models import UserRole
from .service import (
    get_video_service, 
    VIDEO_SOURCE_WIDE, 
    VIDEO_SOURCE_ZOOM, 
    VIDEO_SOURCE_THERMAL
)

router = APIRouter(prefix="/api/video", tags=["Video Control"])

@router.get("/source")
def get_video_source(current_user = Depends(get_current_user)):
    try:
        service = get_video_service()
        source = service.get_source()
        
        source_name = {
            VIDEO_SOURCE_WIDE: "wide",
            VIDEO_SOURCE_ZOOM: "zoom",
            VIDEO_SOURCE_THERMAL: "thermal"
        }.get(source, "unknown")
        
        return {"status": "success", "source_id": source, "source_name": source_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/source/{source_name}")
def set_video_source(
    source_name: str, 
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR]))
):
    try:
        service = get_video_service()
        source_map = {
            "wide": VIDEO_SOURCE_WIDE, 
            "zoom": VIDEO_SOURCE_ZOOM, 
            "thermal": VIDEO_SOURCE_THERMAL
        }
        
        source_id = source_map.get(source_name.lower())
        if source_id is None:
            raise HTTPException(status_code=400, detail="Invalid source name")
        
        if service.set_source(source_id):
            return {"status": "success", "message": f"Switched to {source_name}"}
        
        raise HTTPException(status_code=500, detail="Failed to switch source")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))