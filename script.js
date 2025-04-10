const statusImage = document.getElementById("statusImage");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginForm = document.getElementById("loginForm");

const successModal = document.getElementById("successModal");
const closeModal = document.getElementById("closeModal");

let toggleImage = true;
let isSubmitted = false;

function updateImage() {
  if (usernameInput.value || passwordInput.value) {
    statusImage.src = toggleImage ? "./left.jpg" : "./right.jpg";
    toggleImage = !toggleImage;
  } else if (isSubmitted) {
    statusImage.src = "./wait.jpg";
  }
}

function resetImage() {
  if (!usernameInput.value && !passwordInput.value) {
    statusImage.src = "./wait.jpg";
  }
}

usernameInput.addEventListener("input", function () {
  isSubmitted = false;
  updateImage();
});

passwordInput.addEventListener("input", function () {
  isSubmitted = false;
  updateImage();
});

usernameInput.addEventListener("blur", resetImage);
passwordInput.addEventListener("blur", resetImage);

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  isSubmitted = true;

  if (!usernameInput.value && !passwordInput.value) {
    statusImage.src = "./wait.jpg";
    return;
  }

  if (!usernameInput.value) {
    statusImage.src = "./wait.jpg";
    return;
  }

  if (!passwordInput.value) {
    statusImage.src = "./wait.jpg";
    return;
  }

  successModal.style.display = "flex";
});

closeModal.addEventListener("click", function () {
  successModal.style.display = "none";
  isSubmitted = false;
  updateImage();
});

window.addEventListener("click", function (event) {
  if (event.target === successModal) {
    successModal.style.display = "none";
    isSubmitted = false;
    updateImage();
  }
});
