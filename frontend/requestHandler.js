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

async function login(formData) {
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
            return access_token;
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
        let documents = document.getElementById('files');
        
        while (documents.firstChild) {
            documents.removeChild(documents.firstChild);
        }

        data.files.forEach(file => {
            documents.innerHTML += `<li><button onclick="downloadFile('${file}')">Download ${file}</button><button onclick="deleteFile('${file}')">Delete ${file}</button></li>`;
        });
    });
}

async function downloadFile(file_name) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    }
    fetch(`${url}/files/get_file?filename=${file_name}`, requestOptions).then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.blob();
    })
    .then(blob => {
        const win_url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.href = win_url;
        a.download = file_name;
        a.click();
        window.URL.revokeObjectURL(win_url);
        a.remove();
    });
}

async function deleteFile(file_name) {
    const requestOptions = {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${access_token}`
        }
    };
    fetch(`${url}/files/delete_file?filename=${file_name}`, requestOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        getAllFiles();
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
