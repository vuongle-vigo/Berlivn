import sqlite3

# Hàm tạo kết nối đến SQLite database
def connect_to_db(db_name="data.db"):
    return sqlite3.connect(db_name)

# Hàm thêm dữ liệu vào bảng
def insert_component_info(key, nbphase, params, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # Câu lệnh SQL để thêm dữ liệu
        sql = """
        INSERT INTO components_info (
            key, nbphase, Amini, Amaxi, angle, resmini, typesupport, Bmini, largeurmodule, img1Article, img2Article, numart, info
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        # Đảm bảo params có đúng 11 phần tử
        if len(params) != 11:
            raise ValueError("Mảng params phải có đúng 11 phần tử.")
        
        # Thực thi câu lệnh SQL
        cursor.execute(sql, [key, nbphase] + params)
        conn.commit()   
        print(f"Thêm dữ liệu thành công cho key: {key}")
    except sqlite3.IntegrityError:
        print(f"Key '{key}' đã tồn tại trong bảng.")
    except Exception as e:
        print(f"Lỗi khi thêm dữ liệu: {e}")
    finally:
        conn.close()

def insert_component_list(key, component_list, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # Câu lệnh SQL để thêm dữ liệu
        sql = """
        INSERT INTO components_list (
            nbphase, thickness, width, poles, shape, component_id
        ) VALUES (?, ?, ?, ?, ?, ?)
        """
        
        # Duyệt qua từng component_id trong danh sách và chèn
        for component_id in component_list:
            params = [
                key['nbphase'],
                key['thickness'],
                key['width'],
                key['poles'],
                key['shape'],
                component_id
            ]
            cursor.execute(sql, params)
        
        conn.commit()
        print(f"Đã thêm {len(component_list)} dòng dữ liệu cho key: {key}")
    
    except sqlite3.IntegrityError as e:
        print(f"Lỗi ràng buộc (IntegrityError): {e}")
    except Exception as e:
        print(f"Lỗi khi thêm dữ liệu: {e}")
    finally:
        conn.close()

def get_component_list(db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # Câu lệnh SQL để lấy danh sách component
        sql = "SELECT DISTINCT nbphase, component_id FROM components_list"
        cursor.execute(sql)
        
        # Lấy tất cả kết quả
        results = cursor.fetchall()
        return results
    except Exception as e:
        print(f"Lỗi khi truy vấn dữ liệu: {e}")
    finally:
        conn.close()

# Hàm truy vấn dữ liệu theo key
def query_data_component_info(nbphase, refArticle, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # Câu lệnh SQL để truy vấn
        sql = "SELECT * FROM components_info WHERE nbphase = ? AND key = ?"
        cursor.execute(sql, (nbphase, refArticle))
        
        # Lấy kết quả
        result = cursor.fetchone()
        if result:
            print(f"Dữ liệu cho key '{nbphase}': {result}")
            return result
        else:
            print(f"Không tìm thấy dữ liệu cho key: {refArticle}")
            return None
    except Exception as e:
        print(f"Lỗi khi truy vấn dữ liệu: {e}")
    finally:
        conn.close()

def get_joined_components(db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        sql = """
        SELECT
            cl.id,
            cl.nbphase,
            cl.thickness,
            cl.width,
            cl.poles,
            cl.shape,
            cl.component_id,
            ci.Amini,
            ci.Amaxi,
            ci.angle,
            ci.resmini,
            ci.typesupport,
            ci.Bmini,
            ci.largeurmodule,
            ci.img1Article,
            ci.img2Article,
            ci.numart,
            ci.info
        FROM
            components_list cl
        JOIN
            components_info ci
        ON
            cl.component_id = ci.key AND cl.nbphase = ci.nbphase
        """
        
        cursor.execute(sql)
        results = cursor.fetchall()
        return results

    except Exception as e:
        print(f"Lỗi khi JOIN dữ liệu: {e}")
    finally:
        conn.close()

def insert_calc_excel(W, T, B, Angle, a, Icc, Force, NbrePhase, L, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # Câu lệnh SQL để thêm dữ liệu
        sql = """
        INSERT OR IGNORE INTO calc_excel (
            W, T, B, Angle, a, Icc, Force, NbrePhase, L
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        # Thực thi câu lệnh SQL
        cursor.execute(sql, (W, T, B, Angle, a, Icc, Force, NbrePhase, L))
        conn.commit()
        print("Thêm dữ liệu thành công vào bảng calc_excel")
    except Exception as e:
        print(f"Lỗi khi thêm dữ liệu vào calc_excel: {e}")
    finally:
        conn.close()

def get_calc_excel(W, T, B, Angle, a, Icc, Force, NbrePhase, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # Câu lệnh SQL để truy vấn
        sql = """
        SELECT L FROM calc_excel
        WHERE W = ? AND T = ? AND B = ? AND Angle = ? AND a = ? AND Icc = ? AND Force = ? AND NbrePhase = ?
        """
        
        cursor.execute(sql, (W, T, B, Angle, a, Icc, Force, NbrePhase))
        
        # Lấy kết quả
        result = cursor.fetchone()
        if result:
            return result[0]  # Trả về giá trị L
        else:
            return None
    except Exception as e:
        print(f"Lỗi khi truy vấn dữ liệu: {e}")
    finally:
        conn.close()

def get_calc_excel_F_max(W, T, B, Angle, a, Icc, NbrePhase, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # Câu lệnh SQL để tìm Force lớn nhất có kết quả L
        sql = """
        SELECT MAX(Force)
        FROM calc_excel
        WHERE W = ? AND T = ? AND B = ? AND Angle = ? AND a = ? AND Icc = ? AND NbrePhase = ? AND L IS NOT NULL
        """
        
        cursor.execute(sql, (W, T, B, Angle, a, Icc, NbrePhase))
        
        # Lấy kết quả
        result = cursor.fetchone()
        if result and result[0] is not None:
            return result[0]  # Trả về giá trị Force tối đa
        else:
            return None  # Không tìm thấy bản ghi nào thỏa mãn
    except Exception as e:
        print(f"Lỗi khi truy vấn dữ liệu: {e}")
        return None
    finally:
        conn.close()

def get_calc_excel_L_max(W, T, B, Angle, a, Icc, NbrePhase, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # Câu lệnh SQL để lấy L tại Force lớn nhất
        sql = """
        SELECT L
        FROM calc_excel
        WHERE W = ? AND T = ? AND B = ? AND Angle = ? AND a = ? AND Icc = ? AND NbrePhase = ?
        AND Force = (SELECT MAX(Force) FROM calc_excel 
                     WHERE W = ? AND T = ? AND B = ? AND Angle = ? AND a = ? AND Icc = ? AND NbrePhase = ?)
        """
        
        cursor.execute(sql, (W, T, B, Angle, a, Icc, NbrePhase, W, T, B, Angle, a, Icc, NbrePhase))
        
        # Lấy kết quả
        result = cursor.fetchone()
        if result:
            return result[0]  # Trả về giá trị L tại Force lớn nhất
        else:
            return None  # Không tìm thấy bản ghi nào thỏa mãn
    except Exception as e:
        print(f"Lỗi khi truy vấn dữ liệu: {e}")
        return None
    finally:
        conn.close()

# Updated get_component_info_by_id to include nbphase
def get_component_info_by_id(component_id: str, nbphase: int = None, db_name="data.db"):
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Build SQL query dynamically based on nbphase
        sql = """
        SELECT key, nbphase, angle, resmini, info, a_list 
        FROM components_info 
        WHERE key = ?
        """
        params = [component_id]
        
        if nbphase is not None:
            sql += " AND nbphase = ?"
            params.append(nbphase)
            
        cursor.execute(sql, params)
        result = cursor.fetchone()
        
        if result:
            columns = ["key", "nbphase", "angle", "resmini", "info", "a_list"]
            return dict(zip(columns, result))
        return None
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu: {e}")
        return None
    finally:
        conn.close()

# Updated function for updating component info (excluding key)
def update_component_info(key: str, nbphase: int, angle: int, resmini: float, info: str, a_list: str, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # SQL command to update non-key fields
        sql = """
        UPDATE components_info
        SET angle = ?, resmini = ?, info = ?, a_list = ?
        WHERE key = ? AND nbphase = ?
        """
        cursor.execute(sql, (angle, resmini, info, a_list, key, nbphase))
        
        conn.commit()
        
        if cursor.rowcount > 0:
            return {"message": "Component updated successfully"}
        return None
    except Exception as e:
        print(f"Lỗi khi cập nhật dữ liệu: {e}")
        return None
    finally:
        conn.close()

def delete_component_info(key: str, nbphase: int, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # SQL command to delete the component info
        sql = """
        DELETE FROM components_info
        WHERE key = ? AND nbphase = ?
        """
        cursor.execute(sql, (key, nbphase))
        
        conn.commit()
        
        if cursor.rowcount > 0:
            return {"message": "Component deleted successfully"}
        return None
    except Exception as e:
        print(f"Lỗi khi xóa dữ liệu: {e}")
        return None
    finally:
        conn.close()

def delete_component_list(component_id: str, nbphase: int, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # SQL command to delete the component list
        sql = """
        DELETE FROM components_list
        WHERE component_id = ? AND nbphase = ?
        """
        cursor.execute(sql, (component_id, nbphase))
        
        conn.commit()
        
        if cursor.rowcount > 0:
            return {"message": "Component list deleted successfully"}
        return None
    except Exception as e:
        print(f"Lỗi khi xóa dữ liệu: {e}")
        return None
    finally:
        conn.close()

def create_component_info(key: str, nbphase: int, angle: int, resmini: int, info: str, a_list: str, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        Amini = 60  # Giá trị mặc định
        if a_list:
            # Tách chuỗi a_list thành mảng và lấy phần tử đầu tiên
            first_value = a_list.split(",")[0].strip()
            Amini = int(first_value) if first_value.isdigit() else 60
        # SQL command to insert new component info
        sql = """
        INSERT INTO components_info (key, Amini, nbphase, angle, resmini, info, a_list)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        cursor.execute(sql, (key, Amini, nbphase, angle, resmini, info, a_list))

        conn.commit()
        
        return {"message": "Component created successfully"}
    except sqlite3.IntegrityError:
        print(f"Key '{key}' already exists in the table.")
        return None
    except Exception as e:
        print(f"Lỗi khi tạo dữ liệu: {e}")
        return None
    finally:
        conn.close()

def get_component_list_by_id(component_id: str, nbphase: int, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        sql = """
        SELECT thickness, width, poles, shape
        FROM components_list
        WHERE component_id = ? AND nbphase = ?
        """
        cursor.execute(sql, (component_id, nbphase))
        
        results = cursor.fetchall()

        # Tạo tập hợp các giá trị duy nhất cho từng trường
        thicknesses = set(thickness for thickness, _, _, _ in results)
        widths = set(width for _, width, _, _ in results)
        poles = set(poles for _, _, poles, _ in results)
        shapes = set(shape for _, _, _, shape in results)
        
        # Kiểm tra số lượng phần tử để xác nhận tổ hợp đầy đủ
        expected_count = len(widths) * len(poles)
        is_complete = len(results) == expected_count
        
        # Trả về tổ hợp dưới dạng dictionary
        return {
            "is_complete": is_complete,
            "thickness": sorted(thicknesses),
            "width": sorted(widths),
            "poles": sorted(poles),
            "shape": sorted(shapes)
        }
    except Exception as e:
        print(f"Lỗi khi truy vấn dữ liệu: {e}")
        return None
    finally:
        conn.close()

def create_component_list(nbphase: int, thickness: list, width: list, poles: list, shape: list, component_id: str, db_name="data.db"):
    try:
        conn = connect_to_db(db_name)
        cursor = conn.cursor()
        
        # Bước 1: Xóa các bản ghi cũ với component_id và nbphase
        sql_delete = """
        DELETE FROM components_list
        WHERE component_id = ? AND nbphase = ?
        """
        cursor.execute(sql_delete, (component_id, nbphase))
        
        # Bước 2: Tạo tổ hợp từ các danh sách thickness, width, poles, shape
        combinations = [
            (t, w, p, s)
            for t in thickness
            for w in width
            for p in poles
            for s in shape
        ]
        
        # Bước 3: Thêm các tổ hợp mới vào database
        sql_insert = """
        INSERT INTO components_list (thickness, width, poles, shape, component_id, nbphase)
        VALUES (?, ?, ?, ?, ?, ?)
        """
        for combo in combinations:
            cursor.execute(sql_insert, (*combo, component_id, nbphase))
        
        # Commit thay đổi
        conn.commit()
        
        # Trả về số lượng bản ghi đã thêm
        return len(combinations)
    
    except Exception as e:
        print(f"Lỗi khi xử lý dữ liệu: {e}")
        return None
    finally:
        conn.close()
        
# Example usage:
# create_component_list(
#     nbphase=1,
#     thickness=[5, 10],
#     width=[32, 40],
#     poles=[2, 3, 4],
#     shape=["C"],
#     component_id="100245-D38"
# )

# print(get_component_list_by_id("100245-D37", 1))
# print(get_calc_excel(12, 5, 1, 40, 34, 12, 1700, 4))

# insert_component_list(
#     {
#         "nbphase": 1,
#         "thickness": 5,
#         "width": 32,
#         "poles": 4
#     },
#     [123, 456, 789]
# )