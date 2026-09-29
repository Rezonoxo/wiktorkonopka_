const menu = document.getElementById("menu");

function menuToggle() {
  menu.classList.toggle("h-32");
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 640) menu.classList.remove("h-32");
});
