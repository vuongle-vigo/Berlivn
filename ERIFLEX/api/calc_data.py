import os
import requests
from log import *
from sqlite import *

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def send_aspExcel(A, width, thickness, perphase, angle, Icc, force, poles):
    payload = {
        "W": int(width),
        "T": int(thickness),
        "B": int(perphase),
        "Angle": int(angle),
        "a": int(A),
        "Icc": int(Icc),
        "Force": int(force),
        "NbrePhase": int(poles),
    }
    print(f"Payload: {payload}")
    url = "https://eriflex-configurator.nvent.com/eriflex/admin/aspExcel/aspExcel.asp"
    try:
        response = requests.post(url, headers=headers, params=payload,  timeout=10)
        if response.status_code == 200:
            write_log(f"Response of ASPExcel: {payload}")
            print(f"Response of ASPExcel: {response.text}")
            insert_calc_excel(payload['W'], payload['T'], payload['B'], payload['Angle'], payload['a'], payload['Icc'], payload['Force'], payload['NbrePhase'], response.text)
        else:
            print(f"Request ASPExcel thất bại với mã trạng thái: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Lỗi khi gửi request ASPExcel: {e}")

    return None

def get_aspExcel(W, T, B, Angle, a, Icc, Force, poles):
    if B == 5:
        B = 4
    if get_calc_excel(W, T, B, Angle, a, Icc, Force, poles) is None:
        send_aspExcel(a, W, T, B, Angle, Icc, Force, poles)
    # F_max = get_calc_excel_F_max(W, T, B, Angle, a, Icc, poles)
    # if F_max is not None:
    #     F_max = int(F_max) + 1000
    #     send_aspExcel_max(a, W, T, B, Angle, Icc, F_max, poles)
    # else:
    #     send_aspExcel_max(a, W, T, B, Angle, Icc, Force, poles)
    # return get_calc_excel(W, T, B, Angle, a, Icc, poles)
    return get_calc_excel(W, T, B, Angle, a, Icc, Force, poles)

def send_aspExcel_max(A, width, thickness, perphase, angle, Icc, initial_force, poles):
    force = int(initial_force)
    last_successful_force = force
    
    while True:
        payload = {
            "W": int(width),
            "T": int(thickness),
            "B": int(perphase),
            "Angle": int(angle),
            "a": int(A),
            "Icc": int(Icc),
            "Force": int(force),
            "NbrePhase": int(poles),
        }
        print(f"Payload: {payload}")
        url = "https://eriflex-configurator.nvent.com/eriflex/admin/aspExcel/aspExcel.asp"
        
        try:
            response = requests.post(url, headers=headers, params=payload)
            if response.status_code == 200:
                write_log(f"Response of ASPExcel: {payload}")
                print(f"Response of ASPExcel: {response.text}")
                insert_calc_excel(payload['W'], payload['T'], payload['B'], payload['Angle'], 
                                payload['a'], payload['Icc'], payload['Force'], payload['NbrePhase'], 
                                response.text)
                return last_successful_force
            elif response.status_code == 500:
                print(f"Đạt đến mã trạng thái 500 với Force = {force}")
                print(f"Giá trị Force thành công cuối cùng: {last_successful_force}")
                last_successful_force = force
                force -= 1000  # Tăng Force lên 1000

            else:
                print(f"Request ASPExcel thất bại với mã trạng thái: {response.status_code}")
                force -= 1000  # Tiếp tục tăng Force ngay cả khi gặp mã trạng thái khác
        except requests.exceptions.RequestException as e:
            print(f"Lỗi khi gửi request ASPExcel: {e}")
            break
    
    return last_successful_force
#Test get_aspExcel
# Payload: {'W': 200, 'T': 10, 'B': 1, 'Angle': 90, 'a': 75, 'Icc': 120, 'Force': 25000, 'NbrePhase': 2}
# print(send_aspExcel(110, 10, 10, 4, 90, 14, 32000, 3))
