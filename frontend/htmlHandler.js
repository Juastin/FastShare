async function OpenFileUpload() {
    
    let html = document.getElementById('uploadfile');
    let documents = document.getElementById('files');
    while (documents.firstChild)
        documents.removeChild(documents.firstChild);

    html.innerHTML = ` 
    <div id="upload-container">
    <div id="message"></div>
    <div id="selected-files"></div>
    <label class="custom-file-upload">
        <input id="file-input" type="file" multiple="multiple" name="choosefile">
        <div id="no-selected-files">
            Klik hier om een bestand te selecteren.
        </div>
    </label>
        <button id="upload" onclick="uploadFile()">Upload</button>
    </div>
    `;
    // TODO: Print filenames when selecting multiplefiles

    // document.getElementById('file-input').addEventListener('change', function() {
        // const files = this.files;
        // const selectedFilesContainer = document.getElementById('selected-files');
        // selectedFilesContainer.innerHTML = ''; // Clear previous selections

        // if (files.length > 0) {
        //     const fileNames = Array.from(files).map(file => file.name).join(', ');
        //     selectedFilesContainer.innerHTML = `<h4 class="selected-file">Geselecteerde bestand: ${fileNames}</h4>`;
        // }
    // });
}

async function ShowFiles() {
    let files = await getAllFiles();
    console.log(files);
    let documents = document.getElementById('files');
    let uploadfile = document.getElementById('uploadfile');
        
    while (documents.firstChild)
        documents.removeChild(documents.firstChild);
    while (uploadfile.firstChild) {
        uploadfile.removeChild(uploadfile.firstChild);
    }
    files.forEach(file => {
        documents.innerHTML += 
        `<li class="file">
            <h3>${file}</h3>
            <div>
                <button id="delete" onclick="deleteFileHandler('${file}')">Delete</button>
                <button id="download" onclick="downloadFile('${file}')">Download</button>
            </div>
        </li>`;
    });
}

async function deleteFileHandler(filename) {
    if (await deleteFile(filename) == true) {
        await ShowFiles();
    }
}

async function validateLoginForm(){
    let name = document.forms["loginForm"]["name"].value;
    let password = document.forms["loginForm"]["password"].value;
    if (name == "" || password == "") {
        alert("Name and password must be filled out");
        return false;
    }
    else {
        const formData = new URLSearchParams();
        formData.append("username", name);
        formData.append("password", password);
        let data = await login(formData);
        if (data != null) {
            window.location.href = "/";
        }
    }
}
async function validateRegisterForm(){
    let name = document.forms["regForm"]["name"].value;
    let password = document.forms["regForm"]["password"].value;
    let confirmpass = document.forms["regForm"]["confirm-password"].value;
    let secret = document.forms["regForm"]["secret"].value;

    if (password !== confirmpass){
        alert("Passwords are not the same")
    }
    else if (name == "" || password == "" || secret == ""){
        alert("Values cannot be empty.")
    }
    else {
        const formData = new URLSearchParams();
        formData.append("username", name);
        formData.append("password", password);
        formData.append("register_token", secret);
        console.log(formData);
        let data = await register(formData);
        if (data.detail == null) {
                window.location.href = "/auth";
        }
        else {
            alert(data.detail)
        }
    }
}