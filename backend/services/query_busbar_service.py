import os
import shutil
import sqlite3
from typing import Any, Dict, List, Optional

# import business functions from existing modules
from calc_data import get_aspExcel, send_aspExcel  # adjust names if different
from sqlite import *  # reuse existing sqlite helper functions

DB_PATH = "data.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def query_busbar_service(data: Dict[str, Any]):
    print("Query data received:", data)
    per_phase = int(data["perPhase"].split(" ")[0])
    thickness = float(data["thickness"])
    width = float(data["width"])
    poles_mapping = {"Bi": 2, "Three": 3, "Four": 4}
    if data["poles"] in poles_mapping:
        poles = poles_mapping[data["poles"]]
    else:
        poles = int(data["poles"])
    shape = data["shape"]

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

    for product in products:
        info_query = """
            SELECT * FROM components_info
            WHERE nbphase = ? AND key = ?
        """
        additional_info = conn.execute(info_query, (product["nbphase"], product["component_id"])).fetchall()
        product["additionalInfo"] = [dict(info) for info in additional_info]
        for info in product["additionalInfo"]:
            L = get_aspExcel(int(width), int(thickness), product["nbphase"], info["angle"], int(info["a_list"].split(",")[0].strip()), data["icc"], info["resmini"] * 10, poles)
            info["L"] = L if L else None

    conn.close()
    return products

def calc_excel_service(payload: Dict[str, Any]):
    L = get_aspExcel(
        payload["W"],
        payload["T"],
        payload["B"],
        payload["Angle"],
        payload["a"],
        payload["Icc"],
        payload["Force"],
        payload["NbrePhase"],
    )
    return L

def send_asp_excel_service(W, T, B, Angle, a, Icc, Force, poles):
    return send_aspExcel(a, W, T, B, Angle, Icc, Force, poles)

# Component-related services reuse sqlite module functions
def get_components_service(component_id: Optional[str], nbphase: Optional[int]):
    components = get_component_info_by_id(component_id, nbphase)
    component_list = get_component_list_by_id(component_id, nbphase)
    return components, component_list

def update_component_service(component: Dict[str, Any]):
    result = update_component_info(
        component["key"],
        component["nbphase"],
        component["angle"],
        component["resmini"],
        component["info"],
        component["a_list"]
    )
    result_list = create_component_list(
        component["nbphase"],
        component.get("thickness"),
        component.get("width"),
        component.get("poles"),
        component.get("shape"),
        component["key"]
    )
    return result and result_list

def delete_component_service(component_id: str, nbphase: int):
    result = delete_component_info(component_id, nbphase)
    result_list = delete_component_list(component_id, nbphase)
    return result and result_list

def create_component_service(component: Dict[str, Any]):
    result = create_component_info(
        component["key"],
        component["nbphase"],
        component["angle"],
        component["resmini"],
        component["info"],
        component["a_list"]
    )
    result_list = create_component_list(
        component["nbphase"],
        component.get("thickness"),
        component.get("width"),
        component.get("poles"),
        component.get("shape"),
        component["key"]
    )
    return result and result_list

def get_components_list_service(component_id: str, nbphase: int):
    return get_component_list_by_id(component_id, nbphase)

# File/image helpers
def save_uploaded_file(upload_file, dest_folder: str):
    os.makedirs(dest_folder, exist_ok=True)
    dest_path = os.path.join(dest_folder, upload_file.filename)
    with open(dest_path, "wb") as f:
        shutil.copyfileobj(upload_file.file, f)
    return dest_path

def delete_path(path: str):
    p = path.lstrip("/")
    abs_p = os.path.abspath(p)
    if os.path.exists(abs_p):
        os.remove(abs_p)
        return True
    return False