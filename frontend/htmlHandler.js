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