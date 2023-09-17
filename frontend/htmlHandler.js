async function OpenFileUpload() {
    let html = document.getElementById('uploadfile');
    console.log("OpenFileUpload");
    html.innerHTML = `  
    <div id="upload-container">
        <input id="file-input" type="file" name="Choose file">
        <button id="upload" onclick="uploadFile()">Upload</button>
    </div>`;
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
        data = await login(formData);
        console.log(data);
    }
}