document.addEventListener("DOMContentLoaded", () => {
  // Create cursor elements
  const cursorDot = document.createElement("div");
  cursorDot.classList.add("custom-cursor-dot");
  
  const cursorRing = document.createElement("div");
  cursorRing.classList.add("custom-cursor-ring");
  
  document.body.appendChild(cursorDot);
  document.body.appendChild(cursorRing);

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;

  // Track mouse movement
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Dot follows exactly
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
    
    // Unhide if hidden
    cursorDot.classList.remove("custom-cursor-hidden");
    cursorRing.classList.remove("custom-cursor-hidden");
  });

  // Animate the ring with a slight delay (easing)
  function animateRing() {
    // Easing factor (0.15 gives a nice springy delay)
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    
    cursorRing.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;
    
    requestAnimationFrame(animateRing);
  }
  
  animateRing();

  // Handle interactive elements (hover state)
  const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [role="button"], label');
  
  interactiveElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursorDot.classList.add("hovered");
      cursorRing.classList.add("hovered");
    });
    
    el.addEventListener("mouseleave", () => {
      cursorDot.classList.remove("hovered");
      cursorRing.classList.remove("hovered");
    });
  });

  // Hide cursor when leaving the window
  document.addEventListener("mouseleave", () => {
    cursorDot.classList.add("custom-cursor-hidden");
    cursorRing.classList.add("custom-cursor-hidden");
  });
});
