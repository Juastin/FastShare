import os
import sqlite3
from datetime import datetime
from dotenv import load_dotenv
from fastapi import HTTPException, status

class Database():
    def __init__(self):
        self.init_env()

    def init_env(self):
        load_dotenv(os.path.abspath(".env"))

    @staticmethod
    def get_time_stamp():
        return datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    def connect(self) -> bool:
        try:
            self.con = sqlite3.connect("FastShare.db")
            self.cur = self.con.cursor()
        except Exception:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Cannot connect to database, try again later or contact the developer") 

    def check_user_exists(self, username=str) -> bool:
        self.connect()
        self.cur.execute("SELECT * FROM user WHERE username=? COLLATE NOCASE", (username,))
        row = self.cur.fetchone()
        self.con.close()
        return True if row else False

    def get_user_by_username(self, username=str):
        self.connect()
        self.cur.execute("SELECT * FROM user WHERE username=? COLLATE NOCASE" , (username,))
        res = self.cur.fetchone()
        self.con.close()
        return res

    def get_user_amount_of_space(self, username=str):
        self.connect()
        self.cur.execute("SELECT amount_of_space FROM user WHERE username=? COLLATE NOCASE" , (username,))
        res = self.cur.fetchone()
        self.con.close()
        return res

    def create_user(self, username=str, password=str):
        if self.check_user_exists(username): raise HTTPException(status.HTTP_400_BAD_REQUEST, "User already exists")
        self.connect()
        self.cur.execute("INSERT INTO user (username, password, date_of_registration, amount_of_space) VALUES (?, ?, ?, ?)", 
                                        (username, password, Database.get_time_stamp(), os.getenv("DEFAULT_AMOUNT_OF_SPACE"),))
        self.con.commit()
        self.con.close()
        return True
    
    def check_if_no_items(self, username=str):
        path = str(f"user_files/{username}/")
        if len(os.listdir(path)) == 0:
            self.reset_amount_of_space(username)
            return True
        return False

    def get_amount_of_space_left(self, username=str):
        self.connect()
        self.cur.execute("SELECT amount_of_space FROM user WHERE username=? COLLATE NOCASE", (username,))
        res = self.cur.fetchone()
        self.con.close()
        return res[0]

    def change_amount_of_space(self, new_space=int, username=str):
        # from bytes to megabytes.
        new_space /= (1024 * 1024)
        old_space = self.get_user_amount_of_space(username)[0]
        space = round(old_space - new_space, 4)
        self.connect()
        self.cur.execute("UPDATE user SET amount_of_space=? WHERE username=? COLLATE NOCASE", (space, username,))
        self.con.commit()
        self.con.close()
        return True
    
    def reset_amount_of_space(self, username=str):
        self.connect()
        self.cur.execute("UPDATE user SET amount_of_space=? WHERE username=? COLLATE NOCASE", (os.getenv("DEFAULT_AMOUNT_OF_SPACE"), username,))
        self.con.commit()
        self.con.close()
        return True
