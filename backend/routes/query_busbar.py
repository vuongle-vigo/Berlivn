from fastapi import APIRouter, HTTPException, File, UploadFile, Query
from fastapi.responses import FileResponse
from typing import Optional

from models.schemas import (
    QueryBusbarRequest, CalcExcelRequest, ComponentInfo,
    DeleteComponentRequest, GetComponentsListRequest,
    ImagePath, FilePath
)
from services.query_busbar_service import (
    query_busbar_service, calc_excel_service, send_asp_excel_service,
    get_components_service, update_component_service, delete_component_service,
    create_component_service, get_components_list_service,
    save_uploaded_file, delete_path
)

router = APIRouter()

@router.post("/queryBusbar")
async def query_busbar(data: QueryBusbarRequest):
    try:
        products = query_busbar_service(data.dict())
        print(products)
        return {"products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/calcExcel")
async def calc_excel(data: CalcExcelRequest):
    try:
        L = calc_excel_service(data.dict())
        return {"L": L if L else None}
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/sendAspExcel")
async def send_asp_excel(W: float, T: float, B: int, Angle: float, a: float, Icc: float, Force: float, poles: int):
    try:
        resp = send_asp_excel_service(W, T, B, Angle, a, Icc, Force, poles)
        return {"response": resp if resp else "No response from ASPExcel"}
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/getComponents")
async def get_components(component_id: Optional[str] = None, nbphase: Optional[int] = None):
    try:
        print(component_id, nbphase)
        components, component_list = get_components_service(component_id, nbphase)
        print(components, component_list)
        if components and component_list:
            return {"components": components, "components_list": component_list}
        raise HTTPException(status_code=404, detail="Component not found")
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/updateComponent")
async def update_component(component: ComponentInfo):
    try:
        ok = update_component_service(component.dict())
        if ok:
            return {"message": "Component updated successfully"}
        raise HTTPException(status_code=404, detail="Component not found")
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/deleteComponent")
async def delete_component(payload: DeleteComponentRequest):
    try:
        ok = delete_component_service(payload.component_id, payload.nbphase)
        if ok:
            return {"message": "Component deleted successfully"}
        raise HTTPException(status_code=404, detail="Component not found")
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/createComponent")
async def create_component(component: ComponentInfo):
    try:
        ok = create_component_service(component.dict())
        if ok:
            return {"message": "Component created successfully"}
        raise HTTPException(status_code=400, detail="Failed to create component")
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/getComponentsList")
async def get_components_list(component_id: str, nbphase: int):
    try:
        components = get_components_list_service(component_id, nbphase)
        if components:
            return {"components": components}
        raise HTTPException(status_code=404, detail="No components found")
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/getImage")
async def get_image(path: str):
    file_path = path.lstrip("/")
    absolute_path = file_path if file_path.startswith("/") else file_path
    if not absolute_path:
        raise HTTPException(status_code=404, detail="Image not found")
    if not __import__("os").path.exists(absolute_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(absolute_path)

@router.post("/uploadImages")
async def upload_images(img1: UploadFile = File(None), img2: UploadFile = File(None), img3: UploadFile = File(None)):
    for img in (img1, img2, img3):
        if img:
            save_uploaded_file(img, "products")
    return {"message": "Images uploaded successfully"}

@router.delete("/deleteImage")
async def delete_image(payload: ImagePath):
    ok = delete_path(payload.image_path)
    if ok:
        return {"message": "Image deleted successfully"}
    raise HTTPException(status_code=404, detail="Image not found")

@router.get("/getFile")
async def get_file(path: str):
    file_path = path.lstrip("/")
    if not __import__("os").path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@router.post("/uploadFiles")
async def upload_files(doc: UploadFile = File(None), two_d: UploadFile = File(None), three_d: UploadFile = File(None)):
    allowed_extensions = {'.pdf', '.doc', '.docx', '.stp', '.step'}
    for file, key in [(doc, 'doc'), (two_d, '2d'), (three_d, '3d')]:
        if file:
            ext = __import__("os").path.splitext(file.filename)[1].lower()
            if ext not in allowed_extensions:
                raise HTTPException(status_code=400, detail=f"Định dạng file không được hỗ trợ: {ext}")
            if key == '3d' and ext not in {'.stp', '.step'}:
                raise HTTPException(status_code=400, detail="Tài liệu 3D phải là định dạng STP")
            if key in {'doc', '2d'} and ext not in {'.pdf', '.doc', '.docx'}:
                raise HTTPException(status_code=400, detail="Tài liệu DOC và 2D phải là định dạng PDF hoặc DOC/DOCX")
            save_uploaded_file(file, "documents")
    return {"message": "Files uploaded successfully"}

@router.delete("/deleteFile")
async def delete_file(payload: FilePath):
    ok = delete_path(payload.file_path)
    if ok:
        return {"message": "File deleted successfully"}
    raise HTTPException(status_code=404, detail="File not found")
