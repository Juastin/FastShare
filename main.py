import os
from datetime import datetime, timedelta
from typing import Annotated
import aiofiles
from fastapi import Depends, FastAPI, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi_utils.tasks import repeat_every
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from database import Database

app = FastAPI()
db = Database()

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class User(BaseModel):
    username: str
    password: str | None = None

class UserInDB(User):
    hashed_password: str
    date_of_registration: str
    amount_of_space: int

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def validate_password(password=str):
    if len(password) < 6:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Password must be at least 6 characters")

def get_password_hash(password=str):
    return pwd_context.hash(password)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

def get_user_by_username(db, username=str) -> UserInDB:
    user = db.get_user_by_username(username)
    if user != None:
        return UserInDB(username=user[0], hashed_password=user[1], date_of_registration=user[2], amount_of_space=user[3])
    
def authenticate_user(db, username=str, password=str) -> UserInDB:
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, os.getenv("SECRET_KEY"), algorithm=os.getenv("ALGORITHM"))
    return encoded_jwt

def make_folder_if_not_exists(current_user=UserInDB):
    if not os.path.isdir("user_files/"):
        os.makedirs("user_files/")
    if not os.path.isdir(f"user_files/{current_user.username}/"):
            os.makedirs(f"user_files/{current_user.username}/")

@app.on_event("startup")
@repeat_every(seconds=60)  # 1 hour
def check_expired_files() -> None:
    print("Hello world")
    # print(os.path.abspath("user_files/"))

    for path, subdirs, files in os.walk(os.path.abspath("user_files/")):
        for name in files:
            remove_if_expired(os.path.join(path, name))


    # onlyfiles = [f for f in os.listdir("user_files/") if os.path.isfile(os.path.join("user_files/", f))]
    # print(onlyfiles)
    # for file in onlyfiles:
    #     os.remove(file)
    #     # print(file)
    #     # print(os.path.getctime(file))
        
def remove_if_expired(file_path):
    print(os.path.getctime(file_path))

@app.get("/")
def read_root():
    return {"Welcome to": "The FastShare API"}

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(db, form_data.username, form_data.password)
    access_token_expires = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")))
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/create/")
async def register_user(user: User):
    hashpw = get_password_hash(user.password)
    validate_password(user.password)
    db.create_user(username=user.username, password=hashpw)
    return {"Account created with username": user.username}

@app.get("/users/me/")
async def read_own_items(current_user: User = Depends(get_current_user)):
    return [{"item_id": "Foo", "owner": current_user.username}]

@app.post("/uploadfile/")
async def create_upload_file(in_file: UploadFile, current_user: User = Depends(get_current_user)):
    if not in_file:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Object send is not a file.")
    
    make_folder_if_not_exists(current_user)
    out_file_path = current_user.username+"/"+in_file.filename
    async with aiofiles.open(out_file_path, 'wb') as out_file:
        while content := await in_file.read(1024):  # async read chunk
            await out_file.write(content)  # async write chunk

        return {"Result": "OK"}