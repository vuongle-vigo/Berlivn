from pydantic import BaseModel
from typing import List, Optional

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
    thickness: Optional[list] = None
    width: Optional[list] = None
    poles: Optional[list] = None
    shape: Optional[list] = None

class DeleteComponentRequest(BaseModel):
    component_id: str
    nbphase: int

class GetComponentsListRequest(BaseModel):
    component_id: str
    nbphase: int

class ImagePath(BaseModel):
    image_path: str

class FilePath(BaseModel):
    file_path: str
