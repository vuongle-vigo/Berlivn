from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
import os
import shutil

import sqlite3
from typing import List
from calc_data import *
from sqlite import *

app = FastAPI()

os.makedirs("products", exist_ok=True)
os.makedirs("documents", exist_ok=True)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (adjust for production)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Request model
class QueryBusbarRequest(BaseModel):
    perPhase: str
    thickness: str
    width: str
    poles: str
    shape: str
    icc: int

class CalcExcelRequest(BaseModel):
    W: float
    T: float
    B: int
    Angle: float
    a: float
    Icc: float
    Force: float
    NbrePhase: int

class ComponentInfo(BaseModel):
    key: str
    nbphase: int
    angle: int
    resmini: int
    info: str
    a_list: str
    thickness: list = None
    width: list = None
    poles: list = None
    shape: list = None


class DeleteComponentRequest(BaseModel):
    component_id: str
    nbphase: int

class GetComponentsListRequest(BaseModel):
    component_id: str
    nbphase: int

# Database connection function
def get_db_connection():
    conn = sqlite3.connect("data.db")  # Path to your SQLite database
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

@app.post("/api/queryBusbar")
async def query_busbar(data: QueryBusbarRequest):
    try:
        # Extract and transform request data
        per_phase = int(data.perPhase.split(" ")[0])  # Extract number from "1 Busbar"
        thickness = float(data.thickness)
        width = float(data.width)

        # Map poles to numeric values
        poles_mapping = {"Bi": 2, "Three": 3, "Four": 4}
        if data.poles in poles_mapping:
            poles = poles_mapping[data.poles]
        else:
            try:
                poles = int(data.poles)  # Attempt to convert to integer if not in mapping
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid value for poles: {data.poles}")

        shape = data.shape

        # Query the database
        conn = get_db_connection()
        query = """
            SELECT * FROM components_list
            WHERE nbphase = ?
              AND thickness = ?
              AND width = ?
              AND poles = ?
              AND shape = ?
        """
        cursor = conn.execute(query, (per_phase, thickness, width, poles, shape))
        products = [dict(row) for row in cursor.fetchall()]

        if not products:
            return {"products": []}  # Return empty list if no products found

        # Fetch additional info for each product
        for product in products:
            info_query = """
                SELECT * FROM components_info
                WHERE nbphase = ? AND key = ?
            """
            additional_info = conn.execute(info_query, (product["nbphase"], product["component_id"])).fetchall()
            product["additionalInfo"] = [dict(info) for info in additional_info]
            # Fetch L value for each additionalInfo entry
            for info in product["additionalInfo"]:
                L = get_aspExcel(int(width), int(thickness), product["nbphase"], info["angle"], int(info["a_list"].split(",")[0].strip()), data.icc, info["resmini"] * 10, poles)
                info["L"] = L if L else None

        conn.close()
        return {"products": products}

    except sqlite3.Error as db_error:
        print(f"Database error: {db_error}")
        raise HTTPException(status_code=500, detail="Database error")

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/calcExcel")
async def calc_excel(data: CalcExcelRequest):
    try:
        # Call get_aspExcel with the provided parameters
        L = get_aspExcel(
            data.W,
            data.T,
            data.B,
            data.Angle,
            data.a,
            data.Icc,
            data.Force,
            data.NbrePhase,
        )
        return {"L": L if L else None}

    except Exception as e:
        print(f"Error in calcExcel: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
@app.get("/api/sendAspExcel")
async def send_asp_excel(
    W: float, T: float, B: int, Angle: float, a: float, Icc: float, Force: float, poles: int
):
    try:
        # Call the function to send ASPExcel data
        response = send_aspExcel(a, W, T, B, Angle, Icc, Force, poles)
        return {"response": response if response else "No response from ASPExcel"}

    except Exception as e:
        print(f"Error in sendAspExcel: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
# Updated GET endpoint to include nbphase
@app.get("/api/getComponents")
async def get_components(component_id: str = None, nbphase: int = None):
    try:
        components = get_component_info_by_id(component_id, nbphase)
        component_list = get_component_list_by_id(component_id, nbphase)
        print(f"Components: {components}, Component List: {component_list}")
        if components and component_list:
            return {"components": components, "components_list": component_list}
        else:
            raise HTTPException(status_code=404, detail="Component not found")
    except Exception as e:
        print(f"Error in getComponents: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/updateComponent")
async def update_component(
    component: ComponentInfo
):
    try:
        result = update_component_info(
            component.key,
            component.nbphase,
            component.angle,
            component.resmini,
            component.info,
            component.a_list
        )
        
        result_list = create_component_list(
            component.nbphase,
            component.thickness,
            component.width,
            component.poles,
            component.shape,
            component.key
        )

        if result and result_list:
            return {"message": "Component updated successfully"}
        else:
            raise HTTPException(status_code=404, detail="Component not found")
    except Exception as e:
        print(f"Error in updateComponent: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
@app.delete("/api/deleteComponent")
async def delete_component(
    component: DeleteComponentRequest
):
    try:
        result = delete_component_info(component.component_id, component.nbphase)
        result_list = delete_component_list(component.component_id, component.nbphase)
        if result and result_list:
            return {"message": "Component deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Component not found")
    except Exception as e:
        print(f"Error in deleteComponent: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
@app.post("/api/createComponent")
async def create_component(
    component: ComponentInfo
):
    try:
        result = create_component_info(
            component.key,
            component.nbphase,
            component.angle,
            component.resmini,
            component.info,
            component.a_list
        )

        result_list = create_component_list(
            component.nbphase,
            component.thickness,
            component.width,
            component.poles,
            component.shape,
            component.key
        )

        if result and result_list:
            return {"message": "Component created successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to create component")
    except Exception as e:
        print(f"Error in createComponent: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    

@app.get("/api/getComponentsList")
async def get_components_list(request: GetComponentsListRequest):
    try:
        components = get_component_list_by_id(request.component_id, request.nbphase)
        if components:
            return {"components": components}
        else:
            raise HTTPException(status_code=404, detail="No components found")
    except Exception as e:
        print(f"Error in getComponentsList: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")





class ImagePath(BaseModel):
    image_path: str

class FilePath(BaseModel):
    file_path: str
    
# Get image
@app.get("/api/getImage")
async def get_image(path: str):
    print(f"Requested image path: {path}")
    file_path = path.lstrip("/")
    absolute_path = os.path.abspath(file_path)
    if os.path.exists(absolute_path):
        return FileResponse(absolute_path)
    raise HTTPException(status_code=404, detail="Image not found")

# Upload images
@app.post("/api/uploadImages")
async def upload_images(img1: UploadFile = File(None), img2: UploadFile = File(None), img3: UploadFile = File(None)):
    for img, idx in [(img1, 1), (img2, 2), (img3, 3)]:
        if img:
            filename = img.filename
            with open(f"products/{filename}", "wb") as f:
                shutil.copyfileobj(img.file, f)
    return {"message": "Images uploaded successfully"}

@app.delete("/api/deleteImage")
async def delete_image(payload: ImagePath):
    file_path = payload.image_path.lstrip("/")  # Remove leading slash
    absolute_path = os.path.abspath(file_path)
    if os.path.exists(absolute_path):
        os.remove(absolute_path)
        return {"message": "Image deleted successfully"}
    raise HTTPException(status_code=404, detail="Image not found")


# Document endpoints
@app.get("/api/getFile")
async def get_file(path: str):
    file_path = path.lstrip("/")
    absolute_path = os.path.abspath(file_path)
    print(f"Requested file path: {absolute_path}")
    if os.path.exists(absolute_path):
        return FileResponse(absolute_path)
    raise HTTPException(status_code=404, detail="File not found")

@app.post("/api/uploadFiles")
async def upload_files(doc: UploadFile = File(None), two_d: UploadFile = File(None), three_d: UploadFile = File(None)):
    print(f"Uploading files: doc={doc}, two_d={two_d}, three_d={three_d}")
    allowed_extensions = {'.pdf', '.doc', '.docx', '.stp', '.step'}
    for file, key in [(doc, 'doc'), (two_d, '2d'), (three_d, '3d')]:
        if file:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in allowed_extensions:
                raise HTTPException(status_code=400, detail=f"Định dạng file không được hỗ trợ: {ext}")
            if key == '3d' and ext not in {'.stp', '.step'}:
                raise HTTPException(status_code=400, detail="Tài liệu 3D phải là định dạng STP")
            if key in {'doc', '2d'} and ext not in {'.pdf', '.doc', '.docx'}:
                raise HTTPException(status_code=400, detail="Tài liệu DOC và 2D phải là định dạng PDF hoặc DOC/DOCX")
            file_path = f"documents/{file.filename}"
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
    return {"message": "Files uploaded successfully"}

@app.delete("/api/deleteFile")
async def delete_file(payload: FilePath):
    file_path = payload.file_path.lstrip("/")
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"message": "File deleted successfully"}
    raise HTTPException(status_code=404, detail="File not found")