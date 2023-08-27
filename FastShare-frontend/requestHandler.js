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
    formData.append("password", "...");

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
    });
}
async function uploadFile() { 
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "multipart/form-data",
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

