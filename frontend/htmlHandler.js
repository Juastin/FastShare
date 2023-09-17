async function OpenFileUpload() {
    let html = document.getElementById('uploadfile');
    console.log("OpenFileUpload");
    html.innerHTML = `  
    <div id="upload-container">
        <input id="file-input" type="file" name="Choose file">
        <button id="upload" onclick="uploadFile()">Upload</button>
    </div>`;
}