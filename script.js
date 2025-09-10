// Function to toggle dark mode, accessible by all pages
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
}

// Load saved theme preference on page load
window.onload = () => {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // Check if we are on the index page by looking for a specific element
    if (document.getElementById("dropZone")) {
        const dropZone = document.getElementById("dropZone");
        const fileInput = document.getElementById("fileInput");
        const generateButton = document.getElementById("generate-button");
        const decodeButton = document.getElementById("decode-button");
        const fileTypeSelect = document.getElementById("file-type");
        const responseGenDiv = document.getElementById("response_gen");
        const qrOutputDiv = document.getElementById("qr-output");
        const responseDecDiv = document.querySelector(".response_dec");
        const camButton = document.getElementById("cam-button");
        const readerDiv = document.getElementById("reader");
        // Get the correct element for scan results/messages
        const scanResultDiv = document.getElementById("scan-result");


        // --- CORRECTED Camera Scanner Logic ---
        let html5QrCode; // We'll store the scanner instance here

        camButton.addEventListener("click", () => {
            // Show the container for the camera view
            readerDiv.style.display = "block";
            // Use the correct element to show the status message
            scanResultDiv.innerHTML = "Starting camera...";

            // If a scanner is already running, stop it
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    console.log("Scanner stopped.");
                    readerDiv.style.display = "none"; // Hide reader on stop
                    scanResultDiv.innerHTML = ""; // Clear the message
                }).catch(err => {
                    console.error("Scanner stop failed:", err);
                });
                return;
            }

            // Initialize the scanner
            html5QrCode = new Html5Qrcode("reader");

            const qrCodeSuccessCallback = (decodedText, decodedResult) => {
                // Use the correct element to show the scan result
                scanResultDiv.innerHTML = `<strong>Scan Successful:</strong> ${decodedText}`;
                // Stop scanning after a success
                html5QrCode.stop().then(() => {
                    readerDiv.style.display = "none"; // Hide reader on success
                });
            };

            const config = {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 250
                }
            };

            // Start scanning
            html5QrCode.start({
                    facingMode: "environment"
                }, config, qrCodeSuccessCallback)
                .catch(err => {
                    console.error("Camera start failed:", err);
                    // Use the correct element to show the error message
                    scanResultDiv.innerHTML = "Error: Could not access camera. Please grant permission.";
                    readerDiv.style.display = "none"; // Hide reader on error
                });
        });


        // --- Generator Logic (No changes needed) ---
        fileTypeSelect.addEventListener("change", () => {
            const selectedType = fileTypeSelect.value;
            qrOutputDiv.innerHTML = '';
            let inputHTML = '';
            if (selectedType === "file") {
                inputHTML = `<input type="file" id="inp_file" style="width: 100%;">`;
            } else if (selectedType === "text") {
                inputHTML = `<input type="text" placeholder="Enter Text here" id="inp_text">`;
            } else if (selectedType === "url") {
                inputHTML = `<input type="url" placeholder="Enter URL here" id="inp_url">`;
            }
            responseGenDiv.innerHTML = inputHTML;
        });

        generateButton.addEventListener("click", async () => {
            const selectedType = fileTypeSelect.value;
            let formData = new FormData();

            if (selectedType === "text") {
                const inpText = document.getElementById("inp_text").value;
                if (!inpText) return alert("Please enter some text!");
                formData.append("data", inpText);
            } else if (selectedType === "url") {
                const inpUrl = document.getElementById("inp_url").value;
                if (!inpUrl) return alert("Please enter a URL!");
                formData.append("data", inpUrl);
            } else if (selectedType === "file") {
                const inpFile = document.getElementById("inp_file").files[0];
                if (!inpFile) return alert("Please select a file!");
                formData.append("file", inpFile);
            } else {
                return alert("Please choose a type!");
            }

            qrOutputDiv.innerHTML = "Generating...";
            const res = await fetch("http://127.0.0.1:5000/generate", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                const blob = await res.blob();
                const imgUrl = URL.createObjectURL(blob);
                qrOutputDiv.innerHTML = `<img src="${imgUrl}" alt="Generated QR">`;
            } else {
                qrOutputDiv.innerHTML = "Error generating QR code.";
            }
        });

        // --- File Decoder Logic (No changes needed) ---
        decodeButton.addEventListener("click", async () => {
            const qrFile = fileInput.files[0];
            if (!qrFile) return alert("Please upload a QR image first!");

            const formData = new FormData();
            formData.append("qrfile", qrFile);
            
            // Use scanResultDiv for consistency, or keep using responseDecDiv if you want separate message areas
            scanResultDiv.innerHTML = "Decoding...";
            const res = await fetch("http://127.0.0.1:5000/decode", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                const decodedData = data.decoded;
                if (decodedData && decodedData.length > 0) {
                    scanResultDiv.innerHTML = `<strong>Decoded Data:</strong> ${decodedData[0]}`;
                } else {
                    scanResultDiv.innerHTML = "No QR code found in the image.";
                }
            } else {
                scanResultDiv.innerHTML = "Failed to decode the image.";
            }
        });

        // --- Drag & Drop Logic (No changes needed) ---
        dropZone.addEventListener("click", () => fileInput.click());
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--accent-color)';
        });
        dropZone.addEventListener("dragleave", () => {
            dropZone.style.borderColor = '#666';
        });
        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#666';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                dropZone.textContent = `File selected: ${files[0].name}`;
            }
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                dropZone.textContent = `File selected: ${fileInput.files[0].name}`;
            }
        });
    }
});