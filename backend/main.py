import os
from datetime import datetime, timedelta
import aiofiles
from fastapi import Depends, FastAPI, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi_utils.tasks import repeat_every
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from database import Database

app = FastAPI()
db = Database()

origins = [
    "http://localhost:3000/#",  # Add other allowed origins if needed
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_user_files = os.getcwd()+"/user_files/"

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class User(BaseModel):
    username: str
    password: str | None = None

class UserInDB(User):
    hashed_password: str | None = None
    date_of_registration: str   
    amount_of_space: float

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
    user.hashed_password = None
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
    user.hashed_password = None
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, os.getenv("SECRET_KEY"), algorithm=os.getenv("ALGORITHM"))
    return encoded_jwt

def make_folder_if_not_exists(current_user=UserInDB):
    if not os.path.isdir(_user_files):
        os.makedirs(_user_files)
    if not os.path.isdir(f"user_files/{current_user.username}/"):
            os.makedirs(f"user_files/{current_user.username}/")

def remove_if_expired(file_path) -> None:
    # TODO: Change this to work on ubuntu
    creation_time = os.path.getctime(file_path)
    dt_creation = datetime.fromtimestamp(creation_time)
    if datetime.now() - dt_creation > timedelta(minutes=10):
        remove_file(file_path)

def remove_file(file_path) -> None:
    db.change_amount_of_space(-os.stat(file_path).st_size, os.path.basename(os.path.dirname(file_path)))
    os.remove(file_path)
    if db.check_if_no_items(os.path.basename(os.path.dirname(file_path))):
        os.rmdir(os.path.dirname(file_path))


@app.on_event("startup")
@repeat_every(seconds=60)
def check_expired_files() -> None:
    print("Removing expired files")
    for path, subdirs, files in os.walk(_user_files):
        for name in files:
            remove_if_expired(os.path.join(path, name))

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

@app.get("/users/get_user/")
async def get_user(user: User = Depends(get_current_user)):
    return {"user": user}

@app.post("/users/create/")
async def register_user(register_token: str, user: User):
    if (register_token.lower() != os.getenv("REGISTER_TOKEN")):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Register token incorrect")
    hashpw = get_password_hash(user.password)
    validate_password(user.password)
    db.create_user(username=user.username, password=hashpw)
    return {"Account created with username": user.username}

@app.get("/files/get_all_files/")
async def get_all_files_of_user(_: User = Depends(get_current_user)):
    user_files = []
    for path, subdirs, files in os.walk(_user_files):
        for name in files:
            user_files.append(name)

    return {"files": user_files}

@app.get("/files/get_file", response_class=FileResponse)
async def get_file_by_name(filename: str, current_user: User = Depends(get_current_user)):
    if os.path.exists(_user_files+current_user.username+"/"+filename) == False:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File does not exists")
    else:
        return _user_files+current_user.username+"/"+filename

@app.get("/users/get_amount_of_space/")
async def get_amount_of_space(current_user: User = Depends(get_current_user)):
    return {"amount_of_space": db.get_amount_of_space_left(current_user.username)}

@app.post("/files/upload_file/")
async def create_upload_file(in_file: UploadFile, current_user: UserInDB = Depends(get_current_user)):
    if not in_file:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Object send is not a file.")
    
    make_folder_if_not_exists(current_user)
    out_file_path = _user_files+current_user.username+"/"+in_file.filename

    if os.path.exists(out_file_path):
        counter = 1
        while True:
            new_file_path = out_file_path.split(".")[0] + f"_{counter}." + out_file_path.split(".")[1]
            if not os.path.exists(new_file_path):
                break
            counter += 1
        out_file_path = out_file_path.split(".")[0] + f"_{counter}." + out_file_path.split(".")[1]

    async with aiofiles.open(out_file_path, 'wb') as out_file:
        total_size = 0
        while content := await in_file.read(1024):  # async read chunk
            total_size += 1024
            if(total_size >= (current_user.amount_of_space * (1024 * 1024))):
                out_file.close()
                raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File is larger than your storage space, delete files or try compressing")
            await out_file.write(content)  # async write chunk
        db.change_amount_of_space(total_size, current_user.username)
        return {"result": "OK", "amount_of_space": db.get_amount_of_space_left(current_user.username)}
    
@app.delete("/files/delete_file/") 
async def delete_file_by_name(filename: str, current_user: User = Depends(get_current_user)):
    if filename == None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No filename provided")
    if os.path.exists(_user_files+current_user.username+"/"+filename) == True:
        remove_file(_user_files+current_user.username+"/"+filename)
        return {"result": "OK", "amount_of_space": db.get_amount_of_space_left(current_user.username)}
    else:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File does not exists")
        