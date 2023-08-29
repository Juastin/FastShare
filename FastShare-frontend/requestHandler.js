const fetchButton = document.getElementById("fetchButton");
const responseParagraph = document.getElementById("response");

let url = "http://127.0.0.1:8000";

let access_token = null;

let global_headers = {
    "accept": "application/json",
    "Content-Type": "application/x-www-form-urlencoded"
}

// Post request
// fetch(url, {
//     method: 'POST',
//     headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({ "id": 78912 })
// })
//    .then(response => response.json())
//    .then(response => console.log(JSON.stringify(response)))
// // Get request

async function checkConnection() {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
}

async function login() {
    const formData = new URLSearchParams();
    formData.append("username", "Justin");
    formData.append("password", "James10!");

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData
    };
    fetch(`${url}/token`, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            access_token = data.access_token;
            console.log(access_token);
        })
        .catch(error => {
            // Handle connection or request error here
            console.error("Fetch error:", error);
        });
}

async function getAllFiles() { 
    const requestOptions = {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    };
    fetch(`${url}/files/get_all_files/`, requestOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then(data => {
        console.log(data.files);
        let documents = document.getElementById('files');
        
        while (documents.firstChild) {
            documents.removeChild(documents.firstChild);
        }

        data.files.forEach(file => {
            documents.innerHTML += '<li>' + file + `<button onclick="downloadFile('${file}')">Download ${file}</button></li>`;;
        });
    });
}

async function downloadFile(file_name) {
    console.log("Downloading B)")
    const requestOptions = {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    };
    fetch(`${url}/files/get_file?filename=${file_name}`, requestOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        var saveData = (function () {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            return function (data, fileName) {
                var json = JSON.stringify(data),
                    blob = new Blob([json], {type: "octet/stream"}),
                    url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            };
        }());
        saveData(response.blob(), file_name);
    });
}

async function uploadFile() { 
    const fileInput = document.querySelector('#file-input') ;

    const formData = new FormData();
    formData.append("in_file", fileInput.files[0]);
    // console.log(fileInput.files[0])

    const requestOptions = {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    };
    
    fetch(`${url}/files/upload_file/`, requestOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then(data => {
        console.log(data.files);
    });
}

