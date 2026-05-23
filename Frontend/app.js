document.addEventListener("DOMContentLoaded", () => {
    // Category Chip interaction
    const categoryChips = document.querySelectorAll(".category-chip");
    categoryChips.forEach(chip => {
        chip.addEventListener("click", () => {
            categoryChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
        });
    });
});

// Like Button functionality
function toggleLike(element) {
    element.classList.toggle("liked");
    const icon = element.querySelector("i");
    const span = element.querySelector("span");
    
    // Parse the number
    let numStr = span.innerText;
    let isK = numStr.includes('K');
    let num = parseFloat(numStr.replace('K', ''));

    if (element.classList.contains("liked")) {
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");
        // Dummy increment
        if (isK) {
            span.innerText = (num + 0.1).toFixed(1) + 'K';
        } else {
            span.innerText = num + 1;
        }
    } else {
        icon.classList.remove("fa-solid");
        icon.classList.add("fa-regular");
        if (isK) {
            span.innerText = (num - 0.1).toFixed(1) + 'K';
        } else {
            span.innerText = num - 1;
        }
    }
}
