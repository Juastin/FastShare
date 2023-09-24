async function OpenFileUpload() {
    
    let html = document.getElementById('uploadfile');
    let documents = document.getElementById('files');
    while (documents.firstChild)
        documents.removeChild(documents.firstChild);

    console.log("OpenFileUpload");
    html.innerHTML = `  
    <div id="upload-container">
    <label class="custom-file-upload">
        <input id="file-input" type="file" name="Choose file">
        Klik hier om een bestand te selecteren.
    </label>
        <button id="upload" onclick="uploadFile()">Upload</button>
    </div>`;
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
            <button id="download" onclick="downloadFile('${file}')">Download ${file}</button>
            <button id="delete" onclick="deleteFileHandler('${file}')">Delete ${file}</button>
        </li>`;
    });
}

async function deleteFileHandler(filename) {
    if (await deleteFile(filename) == true) {
        await ShowFiles();
    }
}

async function validateForm(){
    let name = document.forms["myForm"]["name"].value;
    let password = document.forms["myForm"]["password"].value;
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