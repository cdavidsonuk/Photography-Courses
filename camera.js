const iso = document.getElementById("iso");
const aperture = document.getElementById("apertureControl");
const shutter = document.getElementById("shutterControl");

const isoDisplay = document.getElementById("isoDisplay");
const apertureDisplay = document.getElementById("aperture");
const shutterDisplay = document.getElementById("shutter");

const result = document.getElementById("result");

function updateCamera() {

    isoDisplay.textContent = iso.value;

    apertureDisplay.textContent = "f/" + parseFloat(aperture.value).toFixed(1);

    shutterDisplay.textContent = "1/" + shutter.value;

}

iso.addEventListener("input", updateCamera);
aperture.addEventListener("input", updateCamera);
shutter.addEventListener("input", updateCamera);

function takePhoto() {

    let message = "";

    if (iso.value < 400) {
        message += "Low ISO = Clean image.\n";
    } else {
        message += "High ISO = More brightness but more noise.\n";
    }

    if (aperture.value < 4) {
        message += "Wide aperture = Blurred background.\n";
    } else {
        message += "Narrow aperture = More depth of field.\n";
    }

    if (shutter.value > 500) {
        message += "Fast shutter = Frozen motion.";
    } else {
        message += "Slow shutter = Motion blur.";
    }

    result.innerText = message;
}

updateCamera();
