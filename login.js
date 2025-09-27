// document.getElementById("login-form").addEventListener("submit", async function (event) {
//     event.preventDefault();

//     //get username and password from the page
//     const username = document.getElementById("username").value;
//     const password = document.getElementById("password").value;

//     //clear the error message
//     const errorMessage = document.getElementById("error-message");
//     errorMessage.textContent = "";

//     try {
//         //make a post request to the login API
//         const response = await fetch("http://127.0.0.1:8080/api/login", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({ username, password })
//         });

//         //to handle the responce
//         if (response.ok) {
//             const data = await response.json();
//             if (data.role === "admin") {
//                 window.location.href = "http://127.0.0.1:8080/project2.html";
//             } else if (data.role === "manager") {
//                 window.location.href = "http://127.0.0.1:8080/project2.html";
//             }
//         } else {
//             const errorData = await response.json();
//             if (response.status === 400) {
//                 errorMessage.textContent = errorData.error || "Incorrect username or password.";
//             } else {
//                 errorMessage.textContent = "An error occurred. Please try again.";
//             }
//         }
//     } catch (error) {
//         console.error("Error:", error);
//         errorMessage.textContent = "An unexpected error occurred. Please try again later.";
//     }
// });