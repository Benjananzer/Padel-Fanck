document.addEventListener("DOMContentLoaded", () => {
  // Configuración del observador de scroll
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.15 // Se activa cuando el 15% del elemento entra en pantalla
  };

  const revealOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        // Deja de observar una vez que ya apareció para mantener buen rendimiento
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Elementos a los que aplicaremos la animación al bajar
  const elementsToAnimate = document.querySelectorAll(
    ".step-card, .benefit-card, .steps-section h2, .benefits-section h2, .badge"
  );

  elementsToAnimate.forEach((el) => {
    el.classList.add("reveal"); // Añade la clase inicial oculta
    revealOnScroll.observe(el);  // Empieza a observarlo
  });
});