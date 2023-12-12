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

async function checkAccessToken(){
    const requestOptions = {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
    };
    fetch(`${url}/users/get_user`, requestOptions)
        .then(response => {
            if (!response.ok) {
                window.location.href = '/auth';
            }
            return response.json();
        })
        .catch(error => {
            // Handle connection or request error here
            console.error("Fetch error:", error);
        });
}

async function login(formData) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData
    };
    let data = await fetch(`${url}/token`, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
            return access_token;
        })
        .catch(error => {
            // Handle connection or request error here
            console.error("Fetch error:", error);
        });
    return data;
}

async function getAllFiles() { 
    const requestOptions = {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
    };
    let files = fetch(`${url}/files/get_all_files/`, requestOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then(data => {
        return data.files;
    })
    return files
}

async function downloadFile(file_name) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
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
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
    };
    let ok = fetch(`${url}/files/delete_file?filename=${file_name}`, requestOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return true;
    });
    return ok;
}

async function uploadFile() { 
    const fileInput = document.querySelector('#file-input') ;

    const formData = new FormData();
    formData.append("in_file", fileInput.files[0]);
    const requestOptions = {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
    };
    
    fetch(`${url}/files/upload_file/`, requestOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        let html = document.getElementById('message');
        while (html.firstChild)
            html.removeChild(html.firstChild);
        html.innerHTML = `<h3>Upload succesfull!</h3>`;
        return response.json();
    })
    .catch(error => {
        // Handle connection or request error here
        console.error("Fetch error:", error);
    });
}

