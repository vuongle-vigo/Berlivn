from datetime import datetime

def write_log(message, log_file="app.log"):
    try:
        # Lấy thời gian hiện tại
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Ghi log vào file
        with open(log_file, "a", encoding="utf-8") as file:
            file.write(f"[{current_time}] {message}\n")
    except Exception as e:
        print(f"Lỗi khi ghi log: {e}")

